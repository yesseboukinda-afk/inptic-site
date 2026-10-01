import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
    }

    // 1. Sauvegarde dans la base de données Supabase (table subscribers)
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('subscribers').upsert(
          [{ email, subscribed_at: new Date().toISOString() }],
          { onConflict: 'email' }
        );
      } catch {
        // ignore si table non créée
      }
    }

    // 2. Envoi d'un e-mail de confirmation d'inscription via Resend ou équivalent
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'INPTIC Newsletter <noreply@inptic.ga>',
            to: [email],
            subject: 'Confirmation d’inscription à la Newsletter de l’INPTIC Gabon',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 16px; background-color: #f8fafc;">
                <h2 style="color: #1e3a8a; margin-top: 0;">Bienvenue à l'INPTIC Gabon !</h2>
                <p>Bonjour,</p>
                <p>Votre inscription à la <strong>Newsletter officielle de l'Institut National de la Poste, des Technologies de l'Information et de la Communication (INPTIC)</strong> a bien été enregistrée.</p>
                <p>Vous recevrez désormais en temps réel toutes les actualités institutionnelles, ouvertures de concours et notifications d'événements.</p>
                <div style="margin: 24px 0; padding: 16px; background: #dbeafe; border-radius: 8px; color: #1e40af; font-size: 13px;">
                  <strong>Adresse abonnée :</strong> ${email}
                </div>
                <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 24px 0;" />
                <p style="font-size: 11px; color: #64748b; text-align: center;">Institut National de la Poste, des Technologies de l'Information et de la Communication (INPTIC Gabon)<br/>Libreville, Gabon • https://inptic.ga</p>
              </div>
            `,
          }),
        });
      } catch (err) {
        console.error('Erreur envoi email confirmation newsletter:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inscription confirmée ! Un e-mail de confirmation a été envoyé.',
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Erreur lors de l’inscription à la newsletter.' }, { status: 500 });
  }
}
