import { withSiteAudit } from '@/lib/site-audit';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { sendSmtpEmail } from '@/lib/smtp-email';
import { REQUIRED_ADMISSION_DOCUMENTS } from '@/lib/admissionsWorkflow';
import { canAccessStaffService } from '@/lib/roles';
import { NextRequest, NextResponse } from 'next/server';

type ReviewStatus = 'pending' | 'approved' | 'correction_requested';
type AdmissionWorkflow = {
  preRegistration?: { concoursSlug?: string | null; completedAt?: string };
  documentReview?: {
    status?: ReviewStatus;
    submittedAt?: string;
    reviewedAt?: string;
    feedback?: string;
    reviewerEmail?: string;
  };
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

async function siteAuditedPOST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user?.email) {
    return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!isRecord(parsed)) throw new Error('invalid-body');
    body = parsed;
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  const pool = getPostgresPool();
  if (body.action === 'submit') {
    try {
      const result = await pool.query(
        `SELECT admission_workflow, documents
         FROM public.profiles WHERE email = $1 LIMIT 1`,
        [user.email],
      );
      const profile = result.rows[0];
      if (!profile) {
        return NextResponse.json({ error: 'Enregistrez d’abord vos pièces justificatives.' }, { status: 409 });
      }

      const workflow = isRecord(profile.admission_workflow)
        ? profile.admission_workflow as AdmissionWorkflow
        : {};
      const registrationResult = await pool.query(
        `SELECT concours_slug FROM public.concours_preinscriptions WHERE user_id = $1 LIMIT 1`,
        [user.id],
      );
      if (!registrationResult.rows[0]?.concours_slug || !workflow.preRegistration?.completedAt) {
        return NextResponse.json({ error: 'Effectuez d’abord la préinscription au concours.' }, { status: 409 });
      }
      if (workflow.documentReview?.status === 'approved') {
        return NextResponse.json({ error: 'Vos pièces ont déjà été validées par la Scolarité.' }, { status: 409 });
      }
      if (workflow.documentReview?.status === 'pending') {
        return NextResponse.json({ error: 'Vos pièces sont déjà en attente de vérification.' }, { status: 409 });
      }

      const documents: unknown[] = Array.isArray(profile.documents) ? profile.documents : [];
      const categories = new Set(
        documents
          .filter(isRecord)
          .map((document: Record<string, unknown>) =>
            typeof document.category === 'string' ? document.category : ''
          ),
      );
      const missingDocuments = REQUIRED_ADMISSION_DOCUMENTS.filter((category) => !categories.has(category));
      if (missingDocuments.length) {
        return NextResponse.json(
          { error: `Pièces manquantes : ${missingDocuments.join(', ')}.` },
          { status: 400 },
        );
      }

      const documentReview = {
        status: 'pending' as const,
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        feedback: '',
        reviewerEmail: null,
      };
      const updatedWorkflow = { ...workflow, documentReview };
      await pool.query(
        `UPDATE public.profiles
         SET admission_workflow = $2::jsonb, updated_at = NOW()
         WHERE email = $1`,
        [user.email, JSON.stringify(updatedWorkflow)],
      );

      return NextResponse.json({ success: true, documentReview }, { status: 202 });
    } catch (error) {
      console.error('Erreur lors de la soumission des pièces de préinscription:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Impossible de transmettre les pièces à la Scolarité.' }, { status: 503 });
    }
  }

  const assignedService = user.user_metadata.service ?? user.user_metadata.department;
  if (!canAccessStaffService(user.role, 'candidate_profiles', assignedService)) {
    return NextResponse.json({ error: 'Action réservée à la Scolarité.' }, { status: 403 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const decision = body.action;
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
  if (!email || !['approved', 'correction_requested'].includes(String(decision))) {
    return NextResponse.json({ error: 'Candidat et décision valides requis.' }, { status: 400 });
  }
  if (decision === 'correction_requested' && !feedback) {
    return NextResponse.json({ error: 'Précisez les pièces ou corrections attendues.' }, { status: 400 });
  }
  if (feedback.length > 1000) {
    return NextResponse.json({ error: 'Le commentaire ne peut pas dépasser 1 000 caractères.' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT full_name, admission_workflow
       FROM public.profiles WHERE email = $1 LIMIT 1`,
      [email],
    );
    const profile = result.rows[0];
    if (!profile) return NextResponse.json({ error: 'Profil candidat introuvable.' }, { status: 404 });

    const workflow = isRecord(profile.admission_workflow)
      ? profile.admission_workflow as AdmissionWorkflow
      : {};
    if (workflow.documentReview?.status !== 'pending') {
      return NextResponse.json({ error: 'Ces pièces ne sont plus en attente de validation.' }, { status: 409 });
    }

    const documentReview = {
      status: decision as 'approved' | 'correction_requested',
      submittedAt: workflow.documentReview.submittedAt || new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      feedback: decision === 'correction_requested' ? feedback : '',
      reviewerEmail: user.email,
    };
    const updatedWorkflow = { ...workflow, documentReview };
    await pool.query(
      `UPDATE public.profiles
       SET admission_workflow = $2::jsonb, updated_at = NOW()
       WHERE email = $1`,
      [email, JSON.stringify(updatedWorkflow)],
    );

    const candidateName = typeof profile.full_name === 'string' && profile.full_name.trim()
      ? profile.full_name.trim()
      : email;
    const concoursSlug = typeof workflow.preRegistration?.concoursSlug === 'string'
      ? workflow.preRegistration.concoursSlug
      : '';
    const applicationUrl = new URL(
      `/admissions/depot${concoursSlug ? `?concours=${encodeURIComponent(concoursSlug)}` : ''}`,
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin,
    ).toString();
    const isApproved = decision === 'approved';
    const subject = isApproved
      ? 'INPTIC — Pièces validées, candidature à compléter'
      : 'INPTIC — Corrections demandées sur vos pièces';
    const text = isApproved
      ? `Bonjour ${candidateName}, vos pièces de préinscription ont été validées par la Scolarité. Vous pouvez maintenant compléter votre candidature : ${applicationUrl}`
      : `Bonjour ${candidateName}, la Scolarité demande des corrections sur vos pièces : ${feedback}. Connectez-vous pour corriger puis renvoyer vos documents : ${applicationUrl}`;
    const html = isApproved
      ? `<p>Bonjour ${escapeHtml(candidateName)},</p><p>Vos pièces de préinscription ont été validées par la Scolarité. Vous pouvez maintenant compléter le formulaire officiel de candidature.</p><p><a href="${escapeHtml(applicationUrl)}">Accéder à ma candidature</a></p>`
      : `<p>Bonjour ${escapeHtml(candidateName)},</p><p>La Scolarité demande des corrections sur vos pièces de préinscription :</p><blockquote>${escapeHtml(feedback)}</blockquote><p>Connectez-vous pour corriger vos pièces puis les renvoyer à la Scolarité.</p><p><a href="${escapeHtml(applicationUrl)}">Corriger mes pièces</a></p>`;

    let notificationSent = true;
    let notificationError: string | undefined;
    try {
      await sendSmtpEmail({ to: email, subject, html, text });
    } catch (error) {
      notificationSent = false;
      notificationError = error instanceof Error ? error.message : 'Envoi de l’e-mail impossible.';
      console.error('Notification de revue des pièces non envoyée:', notificationError);
    }

    return NextResponse.json({ success: true, documentReview, notificationSent, notificationError });
  } catch (error) {
    console.error('Erreur lors de la décision de revue des pièces:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’enregistrer la décision de la Scolarité.' }, { status: 503 });
  }
}

export const POST = withSiteAudit('Revue des pièces de préinscription', siteAuditedPOST);
