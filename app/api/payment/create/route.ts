import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { safeClientErrorMessage, sanitizeSecrets } from '@/lib/security-sanitize';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import {
  hasCompleteAdmissionDossier,
  hasCompletedAdmissionPreRegistration,
} from '@/lib/admissionsWorkflow';

const GATEWAY_URL = process.env.SINGPAY_GATEWAY_URL || 'https://gateway.singpay.ga/v1';
const CLIENT_ID = process.env.SINGPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.SINGPAY_CLIENT_SECRET;
const WALLET_ID = process.env.SINGPAY_WALLET_ID;
const DISBURSEMENT_ID = process.env.SINGPAY_DISBURSEMENT_ID;

async function getPortefeuilleInfo(walletId: string): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${GATEWAY_URL}/portefeuille/api/${encodeURIComponent(walletId)}`,
    {
      method: 'GET',
      headers: {
        'x-client-id': CLIENT_ID!,
        'x-client-secret': CLIENT_SECRET!,
      },
      cache: 'no-store',
    }
  );

  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const providerMessage =
      (typeof payload.message === 'string' && payload.message) ||
      (typeof payload.error === 'string' && payload.error);
    throw new Error(
      `Vérification du portefeuille SingPay refusée (HTTP ${response.status})${providerMessage ? ` : ${providerMessage}` : '.'}`
    );
  }

  const walletStatus = typeof payload.status === 'string' ? payload.status : '';
  const goLiveStatus = typeof payload.goLive === 'string' ? payload.goLive : '';
  if (/pending/i.test(walletStatus) || /^wait$/i.test(goLiveStatus)) {
    throw new Error(
      `Le portefeuille SingPay n'est pas encore activé (status: ${walletStatus || 'inconnu'}, goLive: ${goLiveStatus || 'inconnu'}). Faites-le activer par SingPay avant de recevoir des paiements.`
    );
  }

  return payload;
}

type Operator = 'airtel' | 'moov';

function getProviderErrorMessage(payload: unknown, depth = 0): string | null {
  if (!payload || typeof payload !== 'object' || depth > 3) return null;

  const record = payload as Record<string, unknown>;
  for (const key of ['message', 'error_description', 'status_message', 'statusMessage', 'detail', 'description', 'error']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value === 'object') {
      const nestedMessage = getProviderErrorMessage(value, depth + 1);
      if (nestedMessage) return nestedMessage;
    }
  }

  return null;
}

// Prefixes gabonais. Airtel -> code operateur "74", Moov -> code operateur "62".
const AIRTEL_PREFIXES = ['074', '077', '076', '74', '77', '76'];
const MOOV_PREFIXES = ['065', '066', '062', '060', '063', '65', '66', '62', '60', '63'];

function detectOperator(rawPhone: string): { operator: Operator; opCode: string } | null {
  const digits = rawPhone.replace(/\D/g, '');
  const local = digits.startsWith('241') ? digits.slice(3) : digits;

  if (AIRTEL_PREFIXES.some((prefix) => local.startsWith(prefix))) {
    return { operator: 'airtel', opCode: '74' };
  }
  if (MOOV_PREFIXES.some((prefix) => local.startsWith(prefix))) {
    return { operator: 'moov', opCode: '62' };
  }
  return null;
}

async function siteAuditedPOST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user?.email) {
    return NextResponse.json({ success: false, error: 'Connectez-vous à votre compte candidat avant de payer.' }, { status: 401 });
  }

  try {
    const result = await getPostgresPool().query(
      `SELECT admission_workflow, candidature_data, documents
       FROM public.profiles WHERE email = $1 LIMIT 1`,
      [user.email],
    );
    const profile = result.rows[0];
    const admissionProfile = profile && {
      email: user.email,
      admissionWorkflow: profile.admission_workflow,
      candidatureData: profile.candidature_data,
      documents: Array.isArray(profile.documents) ? profile.documents : [],
    };
    if (
      !admissionProfile ||
      !hasCompletedAdmissionPreRegistration(admissionProfile) ||
      !hasCompleteAdmissionDossier(admissionProfile)
    ) {
      return NextResponse.json(
        { success: false, error: 'Enregistrez le formulaire complet et joignez toutes les pièces obligatoires avant de procéder au paiement.' },
        { status: 409 },
      );
    }
  } catch (error) {
    console.error('Erreur de vérification du dossier avant paiement:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ success: false, error: 'Impossible de vérifier votre dossier avant paiement.' }, { status: 503 });
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !WALLET_ID) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Configuration de paiement manquante côté serveur (SINGPAY_CLIENT_ID / SINGPAY_CLIENT_SECRET / SINGPAY_WALLET_ID).',
      },
      { status: 500 }
    );
  }

  if (process.env.MODE !== 'test' && !DISBURSEMENT_ID) {
    return NextResponse.json(
      { success: false, error: 'SINGPAY_DISBURSEMENT_ID est requis pour les paiements d’un portefeuille en production.' },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  const amount = body.amount;
  const phone = body.phone;
  const forcedOperator = body.operator;
  const reference = body.reference;

  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ success: false, error: 'Numéro de téléphone requis.' }, { status: 400 });
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ success: false, error: 'Montant invalide.' }, { status: 400 });
  }

  let operator: Operator;
  let opCode: string;

  if (forcedOperator === 'airtel' || forcedOperator === 'moov') {
    operator = forcedOperator;
    opCode = forcedOperator === 'airtel' ? '74' : '62';
  } else {
    const detected = detectOperator(phone);
    if (!detected) {
      return NextResponse.json(
        { success: false, error: "Impossible de déterminer l'opérateur (Airtel ou Moov) à partir du numéro fourni." },
        { status: 400 }
      );
    }
    operator = detected.operator;
    opCode = detected.opCode;
  }

  const numero = phone.replace(/\D/g, '');
  const finalAmount = process.env.MODE === 'test' ? 100 : amount;
  const paymentReference = typeof reference === 'string' && reference ? reference : `INPTIC-${Date.now()}`;

  try {
    await getPortefeuilleInfo(WALLET_ID);

    const singpayRes = await fetch(`${GATEWAY_URL}/${opCode}/paiement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': CLIENT_ID,
        'X-Client-Secret': CLIENT_SECRET,
        'X-Wallet': WALLET_ID,
      },
      body: JSON.stringify({
        client_msisdn: numero,
        amount: finalAmount,
        reference: paymentReference,
        portefeuille: WALLET_ID,
        ...(DISBURSEMENT_ID ? { disbursement: DISBURSEMENT_ID } : {}),
        isTransfer: false,
      }),
    });

    const rawText = await singpayRes.text();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { raw: rawText };
    }

    if (!singpayRes.ok) {
      const providerMessage = getProviderErrorMessage(payload);
      return NextResponse.json(
        {
          success: false,
          error: `SingPay a refusé la demande (HTTP ${singpayRes.status})${providerMessage ? ` : ${providerMessage}` : '.'}`,
          providerStatus: singpayRes.status,
        },
        { status: 502 }
      );
    }

    const transaction = payload.transaction as Record<string, unknown> | undefined;
    const transactionId =
      (payload.transaction_id as string) ||
      (payload.transactionId as string) ||
      ((payload.data as Record<string, unknown>)?.transaction_id as string) ||
      (transaction?.id as string) ||
      (transaction?._id as string) ||
      (payload.id as string);

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: "SingPay a accepté la demande mais n'a pas retourné d'identifiant de transaction.",
        },
        { status: 502 }
      );
    }

    try {
      await getPostgresPool().query(
        `UPDATE public.profiles
         SET admission_workflow = COALESCE(admission_workflow, '{}'::jsonb) ||
               jsonb_build_object('payment', $2::jsonb),
             updated_at = NOW()
         WHERE email = $1`,
        [
          user.email,
          JSON.stringify({
            status: 'pending',
            operator,
            phone: phone.trim(),
            amount: finalAmount,
            transactionId,
            reference: paymentReference,
            createdAt: new Date().toISOString(),
          }),
        ],
      );
    } catch (error) {
      console.error('Échec de persistance du suivi de paiement:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json(
        {
          success: false,
          transactionId,
          error: 'La demande de paiement a été envoyée, mais son suivi n’a pas pu être enregistré. Ne relancez pas le paiement et contactez la Scolarité.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      transactionId,
      provider: operator,
      reference: paymentReference,
      message: (payload.message as string) || 'Paiement initié. Validez la demande sur votre téléphone.',
    });
  } catch (error) {
    console.error('Singpay create payment error:', error instanceof Error ? sanitizeSecrets(error.message) : error);
    return NextResponse.json(
      {
        success: false,
        error: safeClientErrorMessage(error, 'Erreur de connexion avec le service de paiement. Veuillez réessayer.'),
      },
      { status: 502 }
    );
  }
}

export const POST = withSiteAudit("Initiation de paiement Mobile Money", siteAuditedPOST);
