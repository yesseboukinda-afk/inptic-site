'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  User,
  X,
  AlertCircle,
  Phone,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { generateQRCodeSVG } from '@/lib/qrcode';

type Notification = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
};

type ProfileDocument = {
  name: string;
  type: string;
  data?: string;
  url?: string;
};

type CandidateProfile = {
  name: string;
  email: string;
  phone?: string;
  niveau?: string;
  parcours?: string;
  promotion?: string;
  etablissement?: string;
  annee?: string;
  specialite?: string;
  diplome?: string;
  photo?: string;
  documents?: ProfileDocument[];
  filiere?: string;
  dossierNumero?: string;
  dossierStep?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  dossierValide?: boolean;
  status?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  notifications?: Notification[];
  role?: string;
  // Accusé de réception & Paiement
  accuseReceptionDate?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentOperator?: 'airtel' | 'moov' | '';
  paymentPhone?: string;
  paymentAmount?: number;
  paymentTransactionId?: string;
  paymentReference?: string;
  paymentDate?: string;
};

export default function Suivi() {
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState<'airtel' | 'moov' | ''>('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showQuittanceModal, setShowQuittanceModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<ProfileDocument | null>(null);

  useEffect(() => {
    const syncProfile = () => {
      const storedRaw = localStorage.getItem('inptic_user');
      if (!storedRaw) {
        router.replace('/candidat');
        return;
      }

      try {
        const stored = JSON.parse(storedRaw) as CandidateProfile;
        // Garantir un accusé de réception automatique si dossier soumis
        if (!stored.accuseReceptionDate && (stored.status === 'en_attente' || stored.status === 'valide')) {
          stored.accuseReceptionDate = new Date().toISOString();
        }
        setProfile(stored);
        if (stored.phone) setPaymentPhone(stored.phone);
      } catch {
        localStorage.removeItem('inptic_user');
        router.replace('/candidat');
      } finally {
        setLoading(false);
      }
    };

    syncProfile();
    window.addEventListener('auth-state-changed', syncProfile);
    return () => window.removeEventListener('auth-state-changed', syncProfile);
  }, [router]);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!operator) {
      alert('Veuillez choisir un opérateur Mobile Money (Airtel Money ou Moov Money).');
      return;
    }

    if (!paymentPhone.trim() || paymentPhone.trim().length < 8) {
      alert('Veuillez saisir un numéro de téléphone valide.');
      return;
    }

    setIsProcessingPayment(true);

    // Simulation paiement sécurisé Mobile Money
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const reference = `PAY-INPTIC-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const updatedProfile: CandidateProfile = {
      ...profile,
      paymentStatus: 'paid',
      paymentOperator: operator,
      paymentPhone: paymentPhone.trim(),
      paymentAmount: 20000,
      paymentTransactionId: transactionId,
      paymentReference: reference,
      paymentDate: nowIso,
    };

    // Sauvegarder
    localStorage.setItem('inptic_user', JSON.stringify(updatedProfile));

    const storedUsers = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextUsers = storedUsers.map((u: any) => (u.email === updatedProfile.email ? updatedProfile : u));
    localStorage.setItem('inptic_users', JSON.stringify(nextUsers));

    try {
      await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });
    } catch {
      // ignore
    }

    setProfile(updatedProfile);
    setIsProcessingPayment(false);
    setShowQuittanceModal(true);
    window.dispatchEvent(new Event('auth-state-changed'));
  };

  if (loading || !profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Chargement de votre espace de suivi...</p>
      </main>
    );
  }

  const isPaid = profile.paymentStatus === 'paid';
  const isValide = profile.status === 'valide' || profile.dossierValide;
  const isRefuse = profile.status === 'refuse';

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://inptic.ga');
  const verificationUrl = `${siteUrl}/quittance/${profile.paymentReference || profile.paymentTransactionId || 'OFFICIEL'}`;
  const quittanceQrSvg = generateQRCodeSVG(verificationUrl, { size: 160 });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── BANNIÈRE HÉRO SUIVI ── */}
      <section className="bg-slate-950 py-12 text-white">
        <div className="container-x px-4 md:px-0 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <ShieldCheck size={14} className="text-[#D4AF37]" />
            Espace Candidat Officiel INPTIC
          </div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Suivi de Candidature &amp; Quittance</h1>
          <p className="mt-2 text-sm text-slate-300">
            Consultez votre accusé de réception, procédez au règlement des frais de dossier et téléchargez votre quittance officielle d&apos;authenticité.
          </p>
        </div>
      </section>

      <section className="container-x mt-8 px-4 md:px-0 max-w-4xl mx-auto space-y-6">
        {/* ── CARD ACCUSÉ DE RÉCEPTION ── */}
        <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shrink-0">
                <FileCheck2 size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Accusé de Réception Officiel</span>
                <h2 className="text-xl font-black text-slate-900">{profile.name || 'Candidat'}</h2>
                <p className="text-xs text-slate-500">Dossier N° : <strong className="font-mono text-blue-700">{profile.dossierNumero || 'INPTIC-2026-000000'}</strong></p>
              </div>
            </div>

            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isValide ? 'bg-emerald-100 text-emerald-800' : isRefuse ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
              {isValide ? 'Dossier Validé' : isRefuse ? 'Dossier Refusé' : 'En cours d\'examen par la Scolarité'}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400">Filière sollicitée</span>
              <p className="font-bold text-slate-800 mt-0.5">{profile.filiere || 'Licence Professionnelle'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400">Réception du dossier</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {profile.accuseReceptionDate ? new Date(profile.accuseReceptionDate).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400">Statut de paiement</span>
              <p className={`font-bold mt-0.5 ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                {isPaid ? 'Payé (20 000 FCFA)' : 'Autorisé - En attente de règlement'}
              </p>
            </div>
          </div>
        </div>

        {/* ── MODULE DE PAIEMENT OU ACCÈS QUITTANCE ── */}
        {!isPaid ? (
          <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50/60 to-white p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-slate-950 font-black shadow">
                <CreditCard size={24} />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-0.5 text-xs font-bold text-amber-900">
                  Paiement autorisé
                </div>
                <h3 className="mt-2 text-xl font-black text-slate-900">
                  Règlement des Frais de Dossier (20 000 FCFA)
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Votre dossier a été bien reçu et certifié éligible au paiement par la Scolarité. Choisissez votre opérateur Mobile Money pour valider votre inscription.
                </p>

                <form onSubmit={handleProcessPayment} className="mt-5 space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Choix de l&apos;opérateur Mobile Money</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOperator('airtel')}
                        className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition ${
                          operator === 'airtel'
                            ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-500/30'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full bg-red-600" />
                        Airtel Money
                      </button>

                      <button
                        type="button"
                        onClick={() => setOperator('moov')}
                        className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition ${
                          operator === 'moov'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/30'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full bg-blue-600" />
                        Moov Money
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone du compte Mobile Money</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        placeholder="Ex. 077 00 00 00 ou 066 00 00 00"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingPayment || !operator}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-600 disabled:opacity-50 transition"
                  >
                    {isProcessingPayment ? <RefreshCw size={15} className="animate-spin" /> : <CreditCard size={15} />}
                    <span>{isProcessingPayment ? 'Traitement du paiement...' : 'Procéder au paiement (20 000 FCFA)'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* ── ACCÈS À LA QUITTANCE OFFICIELLE LORSQUE PAYÉ ── */
          <div className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shrink-0 shadow">
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                    Paiement validé &amp; certifié
                  </span>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Quittance Officielle de Paiement Disponible
                  </h3>
                  <p className="text-xs text-slate-600">
                    Référence : <strong className="font-mono text-emerald-900">{profile.paymentReference}</strong> • Réglé le {new Date(profile.paymentDate!).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowQuittanceModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow"
              >
                <QrCode size={16} className="text-[#D4AF37]" />
                <span>Voir ma quittance officielle (PDF / QR)</span>
              </button>
            </div>
          </div>
        )}

        {/* ── PIÈCES JOINTES SOUMISES ── */}
        {profile.documents && profile.documents.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Pièces justificatives déposées</h3>
            <div className="mt-3 space-y-2">
              {profile.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className="text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                  </div>
                  {doc.data || doc.url ? (
                    <button
                      type="button"
                      onClick={() => setViewingDocument(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
                    >
                      <Eye size={13} />
                      Voir
                    </button>
                  ) : (
                    <span className="text-slate-400 italic">Déposé</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── MODAL DIALOGUE D'AFFICHAGE DE LA QUITTANCE OFFICIELLE INPTIC ── */}
      {showQuittanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm">
          <div className="relative my-4 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl print:p-0 print:shadow-none">
            <button
              onClick={() => setShowQuittanceModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 print:hidden"
            >
              <X size={20} />
            </button>

            {/* Document de quittance officielle */}
            <div className="border-4 border-slate-900 p-6 rounded-2xl bg-white text-slate-900 space-y-6">
              {/* En-tête officiel */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 text-center sm:text-left">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-900">République Gabonaise</p>
                  <p className="text-[10px] font-bold text-slate-600">INPTIC Gabon • Direction de la Scolarité</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">QUITTANCE DE PAIEMENT OFFICIELLE</h2>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg">
                    CERTIFIÉ PAYÉ
                  </span>
                </div>
              </div>

              {/* Infos candidat & Transaction */}
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Informations du Candidat</span>
                  <p className="font-black text-sm text-slate-900">{profile.name}</p>
                  <p className="text-slate-600">Email : {profile.email}</p>
                  <p className="text-slate-600">Téléphone : {profile.phone || 'N/A'}</p>
                  <p className="text-slate-600">Dossier N° : <strong className="font-mono text-blue-700">{profile.dossierNumero}</strong></p>
                  <p className="text-slate-600">Filière : {profile.filiere}</p>
                </div>

                <div className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Détails du Règlement</span>
                  <p className="font-bold text-slate-800">Montant : <span className="text-emerald-700 font-black text-sm">20 000 FCFA</span></p>
                  <p className="text-slate-600">Opérateur : <strong className="uppercase">{profile.paymentOperator || 'Mobile Money'}</strong></p>
                  <p className="text-slate-600">Transaction ID : <span className="font-mono">{profile.paymentTransactionId}</span></p>
                  <p className="text-slate-600">Référence : <span className="font-mono text-blue-800 font-bold">{profile.paymentReference}</span></p>
                  <p className="text-slate-600">Date : {profile.paymentDate ? new Date(profile.paymentDate).toLocaleString('fr-FR') : 'N/A'}</p>
                </div>
              </div>

              {/* QR Code d'Authenticité & Cachet */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0"
                    dangerouslySetInnerHTML={{ __html: quittanceQrSvg }}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <ShieldCheck size={15} className="text-emerald-600" />
                      QR Code d&apos;Authenticité
                    </span>
                    <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                      Ce QR code certifie l&apos;authenticité du règlement auprès de la scolarité de l&apos;INPTIC.
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Le Chef du Service Scolarité</p>
                  <p className="mt-4 text-xs font-black text-slate-900 italic">INPTIC Gabon</p>
                </div>
              </div>

              {/* Actions d'impression */}
              <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition shadow"
                >
                  <Printer size={15} />
                  <span>Imprimer / Télécharger la Quittance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PRÉVISUALISATION DES DOCUMENTS (BOÎTE DE DIALOGUE) ── */}
      {viewingDocument && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex flex-col h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900 truncate">{viewingDocument.name}</h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex items-center justify-center">
              {viewingDocument.type?.includes('image') || (viewingDocument.data && viewingDocument.data.startsWith('data:image')) ? (
                <img src={viewingDocument.data || viewingDocument.url} alt={viewingDocument.name} className="max-h-full max-w-full object-contain rounded-xl shadow" />
              ) : (
                <iframe src={viewingDocument.data || viewingDocument.url} title={viewingDocument.name} className="h-full w-full rounded-xl border border-slate-200 bg-white shadow" />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
