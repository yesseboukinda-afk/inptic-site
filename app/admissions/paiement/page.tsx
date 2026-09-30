'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  Phone,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { generateQRCodeSVG } from '@/lib/qrcode';

type CandidateProfile = {
  name: string;
  email: string;
  phone?: string;
  filiere?: string;
  dossierNumero?: string;
  accuseReceptionDate?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentOperator?: 'airtel' | 'moov' | '';
  paymentPhone?: string;
  paymentAmount?: number;
  paymentTransactionId?: string;
  paymentReference?: string;
  paymentDate?: string;
};

export default function PaiementPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState<'airtel' | 'moov' | ''>('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const pollingRef = useRef<{ intervalId?: ReturnType<typeof setInterval>; attempts: number }>({ attempts: 0 });

  useEffect(() => {
    const raw = localStorage.getItem('inptic_user');
    if (!raw) {
      router.replace('/candidat');
      return;
    }

    try {
      const stored = JSON.parse(raw) as CandidateProfile;
      setProfile(stored);
      if (stored.phone) setPaymentPhone(stored.phone);
      if (stored.paymentStatus === 'paid') {
        setPollingStatus('success');
      }
    } catch {
      router.replace('/candidat');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const stopPolling = () => {
    if (pollingRef.current.intervalId) {
      clearInterval(pollingRef.current.intervalId);
      pollingRef.current.intervalId = undefined;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const checkPaymentStatus = async (transactionId: string, updatedProfile: CandidateProfile) => {
    try {
      const res = await fetch(`/api/payment/status?transactionId=${encodeURIComponent(transactionId)}`);
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        if (json.status === 'success') {
          stopPolling();
          setPollingStatus('success');
          setStatusMessage('Paiement validé avec succès par l’opérateur Mobile Money.');

          const finalProfile: CandidateProfile = {
            ...updatedProfile,
            paymentStatus: 'paid',
            paymentDate: new Date().toISOString(),
          };

          setProfile(finalProfile);
          localStorage.setItem('inptic_user', JSON.stringify(finalProfile));

          const storedUsers = JSON.parse(localStorage.getItem('inptic_users') || '[]');
          const nextUsers = storedUsers.map((u: any) => (u.email === finalProfile.email ? finalProfile : u));
          localStorage.setItem('inptic_users', JSON.stringify(nextUsers));
          window.dispatchEvent(new Event('auth-state-changed'));
        } else if (json.status === 'failed') {
          stopPolling();
          setPollingStatus('failed');
          setStatusMessage(json.statusMessage || 'Le paiement a échoué ou a été refusé sur le téléphone.');
          setIsProcessing(false);
        } else {
          pollingRef.current.attempts++;
          if (pollingRef.current.attempts > 30) {
            stopPolling();
            setPollingStatus('failed');
            setStatusMessage('Délai d’attente dépassé pour la confirmation du paiement.');
            setIsProcessing(false);
          }
        }
      }
    } catch {
      // Ignorer les erreurs temporaires de réseau pendant le polling
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!operator) {
      setPaymentError('Veuillez sélectionner votre opérateur Mobile Money (Airtel Money ou Moov Money).');
      return;
    }

    if (!paymentPhone.trim() || paymentPhone.trim().length < 8) {
      setPaymentError('Veuillez saisir un numéro de téléphone valide à débiter.');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');
    setPollingStatus('pending');
    setStatusMessage('Demande de paiement envoyée sur votre téléphone. Veuillez valider avec votre code PIN...');

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 20000,
          phone: paymentPhone.trim(),
          operator,
          reference: profile.dossierNumero || `INPTIC-${Date.now()}`,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success || !json.transactionId) {
        throw new Error(json.error || 'Échec de l’initialisation du paiement auprès de la passerelle.');
      }

      const transactionId = json.transactionId;
      const reference = json.reference || profile.paymentReference || `PAY-INPTIC-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const pendingProfile: CandidateProfile = {
        ...profile,
        paymentStatus: 'pending',
        paymentOperator: operator,
        paymentPhone: paymentPhone.trim(),
        paymentAmount: 20000,
        paymentTransactionId: transactionId,
        paymentReference: reference,
      };

      setProfile(pendingProfile);
      localStorage.setItem('inptic_user', JSON.stringify(pendingProfile));

      // Démarrer le polling du statut de la transaction (toutes les 4 secondes)
      pollingRef.current.attempts = 0;
      pollingRef.current.intervalId = setInterval(() => {
        void checkPaymentStatus(transactionId, pendingProfile);
      }, 4000);
    } catch (err: any) {
      setPaymentError(err.message || 'Le paiement n’a pas pu être exécuté.');
      setPollingStatus('failed');
      setIsProcessing(false);
    }
  };

  if (loading || !profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Chargement de la page de paiement...</p>
      </main>
    );
  }

  const isPaid = profile.paymentStatus === 'paid' || pollingStatus === 'success';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://inptic.ga');
  const verificationUrl = `${siteUrl}/quittance/${profile.paymentReference || profile.paymentTransactionId || 'OFFICIEL'}`;
  const quittanceQrSvg = generateQRCodeSVG(verificationUrl, { size: 160 });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* En-tête Héro */}
      <section className="bg-slate-950 py-12 text-white">
        <div className="container-x px-4 md:px-0 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <ShieldCheck size={14} className="text-[#D4AF37]" />
            Règlement Officiel d&apos;Admission INPTIC
          </div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Paiement des Frais de Dossier</h1>
          <p className="mt-2 text-sm text-slate-300">
            Accusé de réception émis. Validez le paiement réel sur votre téléphone pour débloquer votre quittance officielle.
          </p>
        </div>
      </section>

      <section className="container-x mt-8 px-4 md:px-0 max-w-3xl mx-auto space-y-6">
        {/* Banner Accusé de réception */}
        <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shadow">
              <FileCheck2 size={24} />
            </div>
            <div>
              <span className="inline-block rounded-full bg-emerald-200/80 px-3 py-0.5 text-xs font-bold text-emerald-900 uppercase">
                Accusé de Réception E-mail Envoyé
              </span>
              <h2 className="mt-2 text-xl font-black text-slate-900">
                Dossier Réceptionné &amp; Accusé de Réception Émis
              </h2>
              <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                Un e-mail de confirmation a été envoyé en temps réel à <strong className="text-slate-900">{profile.email}</strong>.
                Vous êtes autorisé à procéder au règlement sécurisé des frais de dossier (<strong>20 000 FCFA</strong>).
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-800">
                <span>Numéro de dossier :</span>
                <span className="font-mono text-sm bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-blue-900">{profile.dossierNumero || 'INPTIC-2026-XXXXXX'}</span>
              </div>
            </div>
          </div>
        </div>

        {paymentError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
            {paymentError}
          </div>
        )}

        {/* Formulaire de paiement Mobile Money ou en attente */}
        {!isPaid ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <CreditCard size={22} className="text-blue-600" />
              <div>
                <h3 className="text-lg font-black text-slate-900">Passerelle Mobile Money SingPay</h3>
                <p className="text-xs text-slate-500">Montant : <strong className="text-slate-900">20 000 FCFA</strong></p>
              </div>
            </div>

            {pollingStatus === 'pending' ? (
              <div className="py-12 text-center space-y-4">
                <RefreshCw size={36} className="animate-spin mx-auto text-blue-600" />
                <h4 className="text-base font-bold text-slate-900">Validation en attente sur votre téléphone</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">{statusMessage}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopPolling();
                      setPollingStatus('idle');
                      setIsProcessing(false);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Annuler / Réessayer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Sélectionnez votre opérateur *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOperator('airtel')}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-bold transition ${
                        operator === 'airtel'
                          ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-500/30 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <img src="/payment/airtel.png" alt="Airtel Money" className="h-8 w-auto object-contain" />
                      <span>Airtel Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOperator('moov')}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-bold transition ${
                        operator === 'moov'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/30 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <img src="/payment/moovmoney.webp" alt="Moov Money" className="h-8 w-auto object-contain" />
                      <span>Moov Money</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Numéro de téléphone à débiter *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="Ex. 077 00 00 00 ou 066 00 00 00"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !operator}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-blue-600 disabled:opacity-50 transition"
                >
                  <CreditCard size={16} />
                  <span>Initier le paiement réel (20 000 FCFA)</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── QUITTANCE OFFICIELLE DE PAIEMENT INPTIC ── */
          <div className="border-4 border-slate-900 p-6 sm:p-8 rounded-3xl bg-white text-slate-900 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-900 pb-4 text-center sm:text-left gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-900">République Gabonaise</p>
                <p className="text-[10px] font-bold text-slate-600">INPTIC Gabon • Direction de la Scolarité</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">QUITTANCE DE PAIEMENT OFFICIELLE</h2>
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl">
                  ✓ REGLEMENT CERTIFIÉ
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1.5 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Informations du Candidat</span>
                <p className="font-black text-sm text-slate-900">{profile.name}</p>
                <p className="text-slate-600">Email : {profile.email}</p>
                <p className="text-slate-600">Téléphone : {profile.phone || 'N/A'}</p>
                <p className="text-slate-600">Dossier N° : <strong className="font-mono text-blue-700">{profile.dossierNumero}</strong></p>
                <p className="text-slate-600">Filière : {profile.filiere}</p>
              </div>

              <div className="space-y-1.5 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Détails du Règlement</span>
                <p className="font-bold text-slate-800">Montant réglé : <span className="text-emerald-700 font-black text-sm">20 000 FCFA</span></p>
                <p className="text-slate-600">Opérateur : <strong className="uppercase">{profile.paymentOperator}</strong></p>
                <p className="text-slate-600">Transaction ID : <span className="font-mono">{profile.paymentTransactionId}</span></p>
                <p className="text-slate-600">Référence : <span className="font-mono text-blue-800 font-bold">{profile.paymentReference}</span></p>
                <p className="text-slate-600">Date : {profile.paymentDate ? new Date(profile.paymentDate).toLocaleString('fr-FR') : 'N/A'}</p>
              </div>
            </div>

            {/* QR Code d'Authenticité */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div
                  className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0"
                  dangerouslySetInnerHTML={{ __html: quittanceQrSvg }}
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    QR Code d&apos;Authenticité Certifié
                  </span>
                  <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                    Ce QR code atteste l&apos;authenticité du paiement des frais de dossier d&apos;admission auprès de la Direction de la Scolarité de l&apos;INPTIC Gabon.
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Le Chef du Service Scolarité</p>
                <p className="mt-4 text-xs font-black text-slate-900 italic">INPTIC Gabon</p>
              </div>
            </div>

            {/* Actions de navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-sm"
              >
                <Printer size={15} />
                <span>Imprimer la Quittance</span>
              </button>

              <Link
                href="/admissions/suivi"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow"
              >
                <span>Accéder à mon espace de suivi</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
