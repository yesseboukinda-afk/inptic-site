import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.SINGPAY_GATEWAY_URL || 'https://gateway.singpay.ga/v1';
const CLIENT_ID = process.env.SINGPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.SINGPAY_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const transactionId = new URL(request.url).searchParams.get('transactionId');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Configuration de paiement manquante côté serveur.' },
      { status: 500 }
    );
  }

  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'Identifiant de transaction requis.' }, { status: 400 });
  }

  try {
    const singpayRes = await fetch(`${GATEWAY_URL}/transaction/api/status/${encodeURIComponent(transactionId)}`, {
      method: 'GET',
      headers: {
        'X-Client-Id': CLIENT_ID,
        'X-Client-Secret': CLIENT_SECRET,
      },
      cache: 'no-store',
    });

    const rawText = await singpayRes.text();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { raw: rawText };
    }

    if (!singpayRes.ok) {
      return NextResponse.json(
        {
          success: false,
          errorType: 'gateway_error',
          error: (payload.message as string) || 'Impossible de récupérer le statut du paiement.',
          provider_response: payload,
        },
        { status: 502 }
      );
    }

    const transaction = payload.transaction as Record<string, unknown> | undefined;
    const providerStatus = payload.status as Record<string, unknown> | string | undefined;
    const statusDetails = providerStatus && typeof providerStatus === 'object' ? providerStatus : undefined;
    const statusMessage =
      (typeof statusDetails?.message === 'string' && statusDetails.message) ||
      (payload.status_message as string) ||
      (payload.statusMessage as string) ||
      (payload.message as string);
    const result = typeof transaction?.result === 'string' ? transaction.result : '';
    const statusCode = typeof statusDetails?.code === 'string'
      ? statusDetails.code
      : typeof providerStatus === 'string' ? providerStatus : '';

    const isSuccess = statusDetails?.success === true || /^success$/i.test(result) || /^success$/i.test(statusCode);
    const isFailure =
      ['PasswordError', 'BalanceError', 'TimeOutError', 'Error'].some((failure) => failure.toLowerCase() === result.toLowerCase()) ||
      /echou|annul|refus|insuffisant|incorrect|error/i.test(statusMessage || statusCode);

    return NextResponse.json({
      success: true,
      status: isSuccess ? 'success' : isFailure ? 'failed' : 'pending',
      statusMessage: statusMessage || 'En attente de confirmation.',
      provider_response: payload,
    });
  } catch (error) {
    console.error('Singpay status check error:', error);
    return NextResponse.json(
      { success: false, errorType: 'gateway_error', error: 'Erreur de connexion avec le service de paiement.', isTimeout: false },
      { status: 500 }
    );
  }
}