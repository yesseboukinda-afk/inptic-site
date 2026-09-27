'use client';

import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FILIERES_CONCOURS } from './FILIERES_CONCOURS';

export type CandidateDocument = {
  name: string;
  type: string;
  data?: string;
  category?: string;
  url?: string;
  path?: string;
};

export type CandidateUser = {
  name: string;
  email: string;
  phone?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  serieBac?: string;
  anneeBac?: string;
  etablissement?: string;
  filiere?: string;
  centreExamen?: string;
  niveau?: string;
  dossierNumero?: string;
  dossierStep?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  dossierValide?: boolean;
  status?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  documents?: CandidateDocument[];
  photo?: string;
  role?: string;
  tableNumber?: string;
  salleExamen?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentTransactionId?: string;
  paymentProvider?: 'airtel' | 'moov';
  paymentReference?: string;
  paymentDate?: string;
  notifications?: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    createdAt: string;
    paymentTransactionId?: string;
    paymentProvider?: 'airtel' | 'moov';
    paymentReference?: string;
    paymentDate?: string;
  }>;
};

const REQUIRED_DOCUMENTS = [
  { id: 'cni', label: 'Acte de naissance ou CNI / Passeport', description: 'Copie lisible certifiée conforme ou document original numérisé.' },
  { id: 'bac', label: 'Diplôme du Baccalauréat ou Attestation', description: 'Attestation de réussite ou diplôme du Baccalauréat .' },
  { id: 'releve', label: 'Relevé de notes officiel du Baccalauréat', description: 'Relevé complet délivré par l’Office du Baccalauréat.' },
  { id: 'photo', label: 'Photo d’identité ', description: 'Photo d’identité couleur sur fond blanc neutre.' },
];

const DOSSIER_FEE = 21000;

const CENTRES_EXAMEN = [
  'Libreville - Campus INPTIC (Feu tricolore Gros bouquet)',
  'Port-Gentil - Lycée d\'état',
  'Franceville - Lycée Technique',
  'Oyem - Centre Secondaire',
];

const CALENDRIER_EPREUVES = [
  {
    date: 'Samedi 17 Octobre 2026',
    horaire: '08h00 - 10h00',
    matiere: 'Mathématiques Générales & Logique',
    coeff: 3,
    duree: '2h00',
    consigne: 'Calculatrice scientifique non programmable autorisée. Matériel de géométrie requis.',
  },
  {
    date: 'Samedi 17 Octobre 2026',
    horaire: '10h30 - 12h30',
    matiere: 'Culture Numérique & Technologies de l’Information',
    coeff: 2,
    duree: '2h00',
    consigne: 'QCM et questions ouvertes sur l’écosystème numérique, algorithmique de base et télécoms.',
  },
  {
    date: 'Samedi 17 Octobre 2026',
    horaire: '14h00 - 16h00',
    matiere: 'Français & Expression Écrite',
    coeff: 2,
    duree: '2h00',
    consigne: 'Résumé de texte d’actualité technologique et dissertation argumentée.',
  },
  {
    date: 'Dimanche 18 Octobre 2026',
    horaire: '09h00 - 10h30',
    matiere: 'Anglais Technique & Général',
    coeff: 1,
    duree: '1h30',
    consigne: 'Compréhension de texte spécialisé, vocabulaire technique et grammaire.',
  },
];

const defaultAvatar =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="32" fill="url(#bg)"/>
      <circle cx="100" cy="72" r="34" fill="#f8fafc" fill-opacity="0.92"/>
      <path d="M52 158c12-28 35-42 48-42s36 14 48 42" fill="#f8fafc" fill-opacity="0.92"/>
      <path d="M34 80L100 42L166 80L100 118L34 80Z" fill="#facc15" fill-opacity="0.9"/>
      <text x="100" y="130" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a" font-family="Arial, sans-serif">INPTIC</text>
    </svg>
  `);

export default function ConcoursStudentPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [candidate, setCandidate] = useState<CandidateUser | null>(null);
  const [activeTab, setActiveTab] = useState<'dossier' | 'pieces' | 'epreuves' | 'convocation'>('dossier');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CandidateDocument | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentOperator, setPaymentOperator] = useState<'airtel' | 'moov' | ''>('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'failed'>('idle');
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const paymentPollingRef = useRef<{ intervalId?: ReturnType<typeof setInterval>; attempts: number }>({ attempts: 0 });

  // Initial load
  useEffect(() => {
    const raw = localStorage.getItem('inptic_user');
    if (!raw) {
      router.replace('/candidat');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const paymentReceipt = Array.isArray(parsed.notifications)
        ? parsed.notifications.find((item: NonNullable<CandidateUser['notifications']>[number]) => item.paymentTransactionId)
        : undefined;
      const normalized: CandidateUser = {
        name: parsed.name || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        dateNaissance: parsed.dateNaissance || '',
        lieuNaissance: parsed.lieuNaissance || '',
        nationalite: parsed.nationalite || 'Gabonaise',
        serieBac: parsed.serieBac || parsed.diplome || 'C',
        anneeBac: parsed.anneeBac || parsed.annee || new Date().getFullYear().toString(),
        etablissement: parsed.etablissement || '',
        filiere: parsed.filiere || FILIERES_CONCOURS[0],
        centreExamen: parsed.centreExamen || CENTRES_EXAMEN[0],
        niveau: parsed.niveau || 'Licence 1 (Cycle Ingénieur / Technicien Supérieur)',
        dossierNumero: parsed.dossierNumero || `INPTIC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        dossierStep: parsed.dossierStep || (parsed.dossierValide || parsed.status === 'valide' ? 'valide' : 'en_attente'),
        dossierValide: Boolean(parsed.dossierValide || parsed.status === 'valide'),
        status: parsed.status || (parsed.dossierValide ? 'valide' : 'en_attente'),
        documents: Array.isArray(parsed.documents) ? parsed.documents : [],
        photo: parsed.photo || '',
        role: parsed.role || 'etudiant',
        tableNumber: parsed.tableNumber || `T-${String(Math.floor(100 + Math.random() * 899))}`,
        salleExamen: parsed.salleExamen || 'Amphithéâtre A - Campus INPTIC',
        paymentStatus: parsed.paymentStatus || (paymentReceipt ? 'paid' : undefined),
        paymentTransactionId: parsed.paymentTransactionId || paymentReceipt?.paymentTransactionId || '',
        paymentProvider: parsed.paymentProvider || paymentReceipt?.paymentProvider,
        paymentReference: parsed.paymentReference || paymentReceipt?.paymentReference || '',
        paymentDate: parsed.paymentDate || paymentReceipt?.paymentDate || '',
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      };
      setCandidate(normalized);
    } catch {
      router.replace('/candidat');
    }
  }, [router]);

  useEffect(() => () => {
    if (paymentPollingRef.current.intervalId) {
      clearInterval(paymentPollingRef.current.intervalId);
    }
  }, []);

  // Notifications timeout
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const saveCandidateData = async (
    updated: CandidateUser,
    successMsg = 'Dossier enregistré avec succès.',
    upload?: { file: File; category: string }
  ) => {
    setIsSaving(true);
    try {
      const requestBody = upload ? new FormData() : null;
      if (requestBody && upload) {
        requestBody.set('profile', JSON.stringify(updated));
        requestBody.set('document', upload.file);
        requestBody.set('documentCategory', upload.category);
      }
      const response = await fetch('/api/candidat/profile', {
        method: 'POST',
        ...(requestBody ? {} : { headers: { 'Content-Type': 'application/json' } }),
        body: requestBody || JSON.stringify(updated),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || 'Le serveur n’a pas pu enregistrer le dossier.');
      }

      const savedDocuments = result?.source === 'supabase' && Array.isArray(result.profile?.documents)
        ? result.profile.documents as CandidateDocument[]
        : updated.documents;
      const savedCandidate = { ...updated, documents: savedDocuments };
      setCandidate(savedCandidate);

      localStorage.setItem('inptic_user', JSON.stringify(savedCandidate));

      const storedProfiles = JSON.parse(localStorage.getItem('inptic_users') || '[]');
      const compactCandidate = {
        ...savedCandidate,
        documents: savedCandidate.documents?.map(({ data, ...document }) => document),
      };
      const nextProfiles = Array.isArray(storedProfiles)
        ? storedProfiles.map((p: any) => (p.email?.toLowerCase() === updated.email.toLowerCase() ? { ...p, ...compactCandidate } : p))
        : [compactCandidate];
      if (!nextProfiles.some((p: any) => p.email?.toLowerCase() === updated.email.toLowerCase())) {
        nextProfiles.push(compactCandidate);
      }
      localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
      window.dispatchEvent(new Event('auth-state-changed'));

      setNotice({ text: successMsg, type: 'success' });
    } catch (error) {
      setCandidate(updated);
      setNotice({
        text: error instanceof Error ? `Erreur lors de la sauvegarde : ${error.message}` : 'Erreur lors de la sauvegarde du dossier.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof CandidateUser, value: any) => {
    if (!candidate) return;
    setCandidate((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!candidate) return;
    saveCandidateData(candidate, 'Informations du candidat mises à jour avec succès.');
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const updated = { ...candidate, photo: result };
      saveCandidateData(updated, 'Photo d’identité enregistrée.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (category: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !candidate) return;
    const newDoc: CandidateDocument = {
      name: file.name,
      type: file.type || 'application/octet-stream',
      category,
    };

    const filtered = (candidate.documents || []).filter((document) => document.category !== category);
    const updated = { ...candidate, documents: [...filtered, newDoc] };
    saveCandidateData(updated, `Pièce « ${file.name} » téléversée avec succès.`, { file, category });
    event.target.value = '';
  };

  const handlePreviewDocument = async (document: CandidateDocument) => {
    if (document.path && candidate) {
      try {
        const response = await fetch('/api/candidat/profile/document-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: candidate.email, path: document.path }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.url) {
          throw new Error(result.error || 'Impossible de générer le lien de prévisualisation.');
        }
        setPreviewDoc({ ...document, url: result.url });
      } catch (error) {
        setNotice({
          text: error instanceof Error ? error.message : 'Impossible d’ouvrir ce document.',
          type: 'error',
        });
      }
      return;
    }

    if (document.data || document.url) setPreviewDoc(document);
  };

  const handleDeleteDocument = (docName: string) => {
    if (!candidate) return;
    const updatedDocs = (candidate.documents || []).filter((d) => d.name !== docName);
    const updated = { ...candidate, documents: updatedDocs };
    saveCandidateData(updated, 'Document supprimé du dossier.');
  };

  const handleSubmitDossier = () => {
    if (!candidate) return;
    if (candidate.paymentStatus === 'paid') {
      setNotice({ text: 'Le paiement de votre dossier a déjà été confirmé.', type: 'info' });
      return;
    }

    const missingDocuments = REQUIRED_DOCUMENTS.filter(
      (document) => document.id !== 'quittance' && !candidate.documents?.some((uploaded) => uploaded.category === document.id)
    );
    if (missingDocuments.length) {
      setNotice({
        text: `Ajoutez les pièces manquantes avant le paiement : ${missingDocuments.map((document) => document.label).join(', ')}.`,
        type: 'error',
      });
      return;
    }

    setPaymentPhone(candidate.phone || '');
    setPaymentOperator('');
    setPaymentStatus('idle');
    setPaymentStatusMessage('');
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const stopPaymentPolling = () => {
    if (paymentPollingRef.current.intervalId) {
      clearInterval(paymentPollingRef.current.intervalId);
      paymentPollingRef.current.intervalId = undefined;
    }
  };

  const finalizeDossierAfterPayment = async (
    transactionId: string,
    provider: 'airtel' | 'moov',
    reference: string
  ) => {
    if (!candidate) return;
    stopPaymentPolling();
    setIsPaymentLoading(false);
    const paymentDate = new Date().toISOString();
    const paymentNotice = {
      id: `payment-${transactionId}`,
      message: `Paiement des frais de concours confirmé (${reference}).`,
      type: 'success' as const,
      createdAt: paymentDate,
      paymentTransactionId: transactionId,
      paymentProvider: provider,
      paymentReference: reference,
      paymentDate,
    };

    const updated: CandidateUser = {
      ...candidate,
      status: 'en_attente',
      dossierStep: 'en_attente',
      dossierValide: false,
      paymentStatus: 'paid',
      paymentTransactionId: transactionId,
      paymentProvider: provider,
      paymentReference: reference,
      paymentDate,
      notifications: [
        paymentNotice,
        ...(candidate.notifications || []).filter((notification) => notification.id !== paymentNotice.id),
      ].slice(0, 10),
    };
    await saveCandidateData(updated, 'Paiement confirmé. Votre dossier a été transmis au service des admissions.');
    setIsPaymentModalOpen(false);
  };

  const pollPaymentStatus = (transactionId: string, provider: 'airtel' | 'moov', reference: string) => {
    stopPaymentPolling();
    paymentPollingRef.current.attempts = 0;
    const maxAttempts = 20;

    paymentPollingRef.current.intervalId = setInterval(async () => {
      paymentPollingRef.current.attempts += 1;

      try {
        const response = await fetch(`/api/payment/status?transactionId=${encodeURIComponent(transactionId)}`, { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data?.status === 'success') {
          await finalizeDossierAfterPayment(transactionId, provider, reference);
          return;
        }

        if (data?.status === 'failed') {
          stopPaymentPolling();
          setPaymentStatus('failed');
          setPaymentError(data?.statusMessage || 'Le paiement a été refusé ou annulé.');
          return;
        }

        if (!response.ok && response.status !== 502) {
          stopPaymentPolling();
          setPaymentStatus('failed');
          setPaymentError(data?.error || 'Impossible de vérifier le paiement.');
          return;
        }

        setPaymentStatusMessage(data?.statusMessage || 'Validez la demande sur votre téléphone.');
      } catch {
        // Les erreurs réseau passagères sont retentées pendant la période de confirmation.
      }

      if (paymentPollingRef.current.attempts >= maxAttempts) {
        stopPaymentPolling();
        setPaymentStatus('failed');
        setPaymentError('Délai dépassé. Vérifiez votre téléphone puis relancez le paiement.');
      }
    }, 3000);
  };

  const startDossierPayment = async () => {
    if (!candidate) return;
    if (!paymentOperator) {
      setPaymentError('Sélectionnez Airtel Money ou Moov Money.');
      return;
    }
    if (paymentPhone.replace(/\D/g, '').length < 8) {
      setPaymentError('Saisissez un numéro de téléphone valide (au moins 8 chiffres).');
      return;
    }

    setIsPaymentLoading(true);
    setPaymentError('');

    try {
      const reference = `INPTIC-${candidate.dossierNumero || Date.now()}-${Date.now()}`;
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: DOSSIER_FEE,
          phone: paymentPhone.trim(),
          operator: paymentOperator,
          reference,
          description: 'Frais de dossier concours INPTIC',
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success || !data?.transactionId) {
        throw new Error(data?.error || 'Le paiement n’a pas pu être initialisé.');
      }

      setPaymentStatus('pending');
      setPaymentStatusMessage(data?.message || 'Validez la demande sur votre téléphone.');
      pollPaymentStatus(data.transactionId, paymentOperator, reference);
    } catch (error) {
      setPaymentStatus('failed');
      setPaymentError(error instanceof Error ? error.message : 'Une erreur est survenue lors du paiement.');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handlePrintConvocation = () => {
    window.print();
  };

  if (!candidate) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <p className="font-semibold">Chargement de votre espace concours...</p>
        </div>
      </main>
    );
  }

  const isDossierValide = candidate.dossierValide === true || candidate.status === 'valide';
  const isEnAttente = candidate.status === 'en_attente';
  const docsUploadedCount = candidate.documents?.length || 0;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Toast Notice */}
      {notice && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-xl transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-950/20'
              : notice.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-950/20'
              : 'bg-blue-600 text-white shadow-blue-950/20'
          }`}
        >
          {notice.type === 'success' && <CheckCircle2 size={18} />}
          {notice.type === 'error' && <AlertCircle size={18} />}
          {notice.type === 'info' && <HelpCircle size={18} />}
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            className="ml-2 hover:opacity-75 focus:outline-none"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation des onglets du concours */}
      <section className="print:hidden border-b border-slate-200 bg-slate-900 text-white">
          <div className="mx-auto flex max-w-6xl overflow-x-auto px-4 md:px-8">
            <nav className="flex gap-2 py-3" aria-label="Sections du Concours">
              <button
                type="button"
                onClick={() => setActiveTab('dossier')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeTab === 'dossier'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <User size={16} />
                <span>1. Mon Dossier Candidat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pieces')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeTab === 'pieces'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FileCheck size={16} />
                <span>2. Pièces Justificatives ({docsUploadedCount}/6)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('epreuves')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeTab === 'epreuves'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Calendar size={16} />
                <span>3. Épreuves & Calendrier</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('convocation')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeTab === 'convocation'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Award size={16} />
                <span>4. Convocation & Statut</span>
              </button>
            </nav>
          </div>
      </section>

      {/* Contenu principal selon l'onglet actif */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* ===================== ONGLET 1 : MON DOSSIER CANDIDAT ===================== */}
        {activeTab === 'dossier' && (
          <section className="print:hidden space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">
                    Fiche d’Inscription au Concours d’Entrée
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Renseignez scrupuleusement vos informations personnelles et le choix de votre filière pour le concours 2026.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Statut actuel :</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isDossierValide
                      ? 'bg-emerald-100 text-emerald-800'
                      : isEnAttente
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {isDossierValide ? 'Candidature Validée' : isEnAttente ? 'En cours d’examen' : 'En constitution'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
                {/* Photo d'identité */}
                <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={candidate.photo || defaultAvatar}
                    alt="Photo du candidat"
                    className="h-24 w-24 rounded-xl border border-slate-300 object-cover shadow bg-white"
                  />
                  <div className="space-y-2 text-center sm:text-left">
                    <p className="font-bold text-slate-900">Photo d’identité officielle pour la convocation</p>
                    <p className="text-xs text-slate-500 max-w-md">
                      Format passeport requis (fond blanc, visage dégagé, net et récent). Cette photo figurera obligatoirement sur votre convocation et votre feuille d’émargement.
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm">
                      <Camera size={14} />
                      <span>Téléverser ma photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Identité */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nom et Prénom(s) complets *
                  </label>
                  <input
                    type="text"
                    required
                    value={candidate.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="Ex: Jean-Marc OBIANG"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Adresse Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={candidate.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="candidat@domaine.ga"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Numéro de Téléphone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={candidate.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="+241 77 00 00 00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Date de Naissance
                  </label>
                  <input
                    type="date"
                    value={candidate.dateNaissance || ''}
                    onChange={(e) => handleFieldChange('dateNaissance', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Lieu de Naissance
                  </label>
                  <input
                    type="text"
                    value={candidate.lieuNaissance || ''}
                    onChange={(e) => handleFieldChange('lieuNaissance', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="Ex: Libreville"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nationalité
                  </label>
                  <input
                    type="text"
                    value={candidate.nationalite || 'Gabonaise'}
                    onChange={(e) => handleFieldChange('nationalite', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>

                {/* Vœux & Filière */}
                <div className="md:col-span-2 pt-4 border-t border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Award size={18} className="text-blue-600" />
                    <span>Choix du Programme et du Centre d’Examen</span>
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Filière postulée au Concours *
                  </label>
                  <select
                    value={candidate.filiere || FILIERES_CONCOURS[0]}
                    onChange={(e) => handleFieldChange('filiere', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {FILIERES_CONCOURS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Centre d’Examen Écrit *
                  </label>
                  <select
                    value={candidate.centreExamen || CENTRES_EXAMEN[0]}
                    onChange={(e) => handleFieldChange('centreExamen', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {CENTRES_EXAMEN.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Série du Baccalauréat
                  </label>
                  <input
                    type="text"
                    value={candidate.serieBac || ''}
                    onChange={(e) => handleFieldChange('serieBac', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="Ex: C, D, TI, SI, A1..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Année d’Obtention du Bac
                  </label>
                  <input
                    type="text"
                    value={candidate.anneeBac || ''}
                    onChange={(e) => handleFieldChange('anneeBac', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    placeholder="Ex: 2026"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    * Toutes les modifications sont enregistrées sur votre espace candidat.
                  </p>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-900/20 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Enregistrement...' : 'Enregistrer mon dossier'}</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ===================== ONGLET 2 : PIÈCES DU DOSSIER ===================== */}
        {activeTab === 'pieces' && (
          <section className="print:hidden space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">
                    Pièces Justificatives Exigées pour le Concours
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Téléversez chacune des 6 pièces obligatoires. Les formats acceptés sont PDF, JPEG, PNG (max 5 Mo).
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-right">
                  <p className="text-xs font-semibold text-blue-700 uppercase">Complétude du dossier</p>
                  <p className="text-lg font-black text-blue-950">
                    {docsUploadedCount} / {REQUIRED_DOCUMENTS.length} Pièces
                  </p>
                </div>
              </div>

              {/* Grille des pièces obligatoires */}
              <div className="mt-6 space-y-4">
                {REQUIRED_DOCUMENTS.map((req) => {
                  const uploaded = (candidate.documents || []).find((d) => d.category === req.id);
                  const isPaymentReceipt = req.id === 'quittance';
                  const paymentComplete = isPaymentReceipt && candidate.paymentStatus === 'paid';
                  const isProvided = Boolean(uploaded) || paymentComplete;

                  return (
                    <div
                      key={req.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition ${
                        isProvided
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-lg p-2 ${
                            isProvided
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isProvided ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm md:text-base">{req.label}</h3>
                            {isProvided ? (
                              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                                Fourni
                              </span>
                            ) : isPaymentReceipt ? (
                              <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                                Après paiement
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                                Manquant
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">{req.description}</p>
                          {uploaded && (
                            <p className="mt-1 text-xs font-mono font-semibold text-emerald-700 truncate max-w-sm">
                              Fichier : {uploaded.name}
                            </p>
                          )}
                          {paymentComplete && !uploaded && (
                            <p className="mt-1 text-xs font-mono font-semibold text-emerald-700 truncate max-w-sm">
                              Référence : {candidate.paymentReference}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isPaymentReceipt && !paymentComplete ? (
                          <span className="text-xs font-medium text-slate-500">Créée après confirmation</span>
                        ) : uploaded ? (
                          <>
                            {(uploaded.data || uploaded.url || uploaded.path) && (
                              <button
                                type="button"
                                onClick={() => handlePreviewDocument(uploaded)}
                                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                              >
                                <Eye size={14} />
                                <span>Aperçu</span>
                              </button>
                            )}

                            <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                              <Upload size={14} />
                              <span>Remplacer</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={(e) => handleFileUpload(req.id, e)}
                                className="sr-only"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(uploaded.name)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm">
                            <Upload size={14} />
                            <span>Déposer le fichier</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              onChange={(e) => handleFileUpload(req.id, e)}
                              className="sr-only"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton de soumission définitive */}
              <div className="mt-8 rounded-xl bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-base md:text-lg">Transmission du dossier de candidature</h4>
                  <p className="mt-1 text-xs text-slate-300 max-w-xl">
                    Déposez les pièces demandées, puis réglez les frais de 21 000 FCFA. La quittance est créée après confirmation du paiement.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitDossier}
                  disabled={candidate.paymentStatus === 'paid'}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 text-sm transition shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  {candidate.paymentStatus === 'paid' ? <CheckCircle2 size={18} /> : <CreditCard size={18} />}
                  <span>{candidate.paymentStatus === 'paid' ? 'Paiement confirmé' : 'Payer et soumettre le dossier'}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ===================== ONGLET 3 : ÉPREUVES & CALENDRIER DU CONCOURS ===================== */}
        {activeTab === 'epreuves' && (
          <section className="print:hidden space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Calendar size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Session Officielle 2026</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900">
                  Planning et Matières du Concours d’Entrée
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Retrouvez ici le calendrier détaillé des épreuves écrites pour la filière{' '}
                  <strong className="text-blue-700">{candidate.filiere}</strong> au centre{' '}
                  <strong className="text-slate-900">{candidate.centreExamen}</strong>.
                </p>
              </div>

              {/* Liste des épreuves */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {CALENDRIER_EPREUVES.map((epreuve, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                        {epreuve.date}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        Coeff. {epreuve.coeff}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">{epreuve.matiere}</h3>

                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        <span>{epreuve.horaire} ({epreuve.duree})</span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg">
                      <strong>Consignes :</strong> {epreuve.consigne}
                    </p>
                  </div>
                ))}
              </div>

              {/* Consignes obligatoires pour le concours */}
              <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="font-bold text-amber-900 flex items-center gap-2 text-base">
                  <AlertCircle size={18} className="text-amber-700" />
                  <span>Consignes Impératives pour le Jour des Épreuves</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs md:text-sm text-amber-900/90 list-disc list-inside leading-relaxed">
                  <li>
                    Présentation obligatoire de la <strong>Convocation Officielle imprimée</strong> et d’une <strong>pièce d’identité originale en cours de validité</strong> (CNI, Passeport ou Permis).
                  </li>
                  <li>
                    Les candidats doivent se présenter au centre d’examen <strong>au moins 45 minutes avant le début de chaque épreuve</strong> pour les formalités de contrôle et d’émargement.
                  </li>
                  <li>
                    L’accès à la salle d’examen est strictement interdit dès l’ouverture de l’enveloppe contenant les sujets.
                  </li>
                  <li>
                    Les téléphones portables, montres connectées et tout appareil communicant doivent impérativement être éteints et déposés à l’entrée de la salle.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ===================== ONGLET 4 : CONVOCATION & STATUT ===================== */}
        {activeTab === 'convocation' && (
          <section className="space-y-6">
            {/* Statut non validé */}
            {!isDossierValide && (
              <div className="print:hidden rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-amber-950">
                      Convocation en attente de validation
                    </h3>
                    <p className="mt-2 text-sm text-amber-900 leading-relaxed max-w-2xl">
                      Votre convocation officielle au concours sera générée et téléchargeable dès que vos pièces justificatives auront été vérifiées et approuvées par la commission des concours de l’INPTIC.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('pieces')}
                        className="rounded-lg bg-amber-700 text-white font-bold px-4 py-2 text-xs hover:bg-amber-800 transition"
                      >
                        Vérifier mes pièces justificatives
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fiche Officielle de Convocation (imprimable) */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-6 md:p-10 shadow-xl max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
              {/* En-tête officiel */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-6 text-center sm:text-left">
                <div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-600">
                    République Gabonaise — Ministère de l’Économie Numérique
                  </p>
                  <h2 className="mt-1 text-xl md:text-3xl font-black text-slate-950 tracking-tight">
                    INPTIC LIBREVILLE
                  </h2>
                  <p className="text-xs font-semibold text-slate-600">
                    Institut National de la Poste, des Technologies de l’Information et de la Communication
                  </p>
                </div>

                <div className="text-center sm:text-right">
                  <div className="inline-block rounded-xl border border-slate-900 bg-slate-950 px-4 py-2 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">CONCOURS 2026</p>
                    <p className="text-xs md:text-sm font-mono font-bold">{candidate.dossierNumero}</p>
                  </div>
                </div>
              </div>

              {/* Titre Document */}
              <div className="my-6 text-center">
                <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 border border-slate-300">
                  Document Officiel d’Accès aux Épreuves
                </span>
                <h3 className="mt-2 text-2xl md:text-3xl font-black text-slate-900 uppercase">
                  Convocation au Concours d’Entrée
                </h3>
              </div>

              {/* Fiche Candidat & Emplacement Photo */}
              <div className="grid gap-6 sm:grid-cols-[140px_1fr] items-start p-5 rounded-xl border border-slate-300 bg-slate-50">
                <div className="flex flex-col items-center">
                  <img
                    src={candidate.photo || defaultAvatar}
                    alt={candidate.name}
                    className="h-36 w-28 rounded-lg border-2 border-slate-400 object-cover shadow-sm bg-white"
                  />
                  <span className="mt-2 text-[10px] font-bold uppercase text-slate-500">Photo Candidat</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs md:text-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Nom & Prénoms :</span>
                    <p className="font-bold text-slate-950 text-base">{candidate.name || 'À renseigner'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Email :</span>
                    <p className="font-semibold text-slate-900 truncate">{candidate.email}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Filière choisie :</span>
                    <p className="font-bold text-blue-700 text-sm">{candidate.filiere}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Niveau visé :</span>
                    <p className="font-semibold text-slate-900">{candidate.niveau}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Centre d’Examen :</span>
                    <p className="font-bold text-slate-950">{candidate.centreExamen}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Numéro de Table / Salle :</span>
                    <p className="font-black text-slate-950 text-base">
                      {candidate.tableNumber} — {candidate.salleExamen}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tableau officiel des épreuves */}
              <div className="mt-6">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Calendrier et Horaires des Épreuves Écrites
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-300">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Matière</th>
                        <th className="p-2.5">Horaire</th>
                        <th className="p-2.5">Coeff</th>
                        <th className="p-2.5 text-center">Émargement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {CALENDRIER_EPREUVES.map((ep, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-700">{ep.date}</td>
                          <td className="p-2.5 font-bold text-slate-900">{ep.matiere}</td>
                          <td className="p-2.5 text-slate-600">{ep.horaire}</td>
                          <td className="p-2.5 font-bold text-blue-700">{ep.coeff}</td>
                          <td className="p-2.5 text-center border-l border-slate-200">
                            <span className="inline-block h-6 w-16 border-b border-dashed border-slate-400"></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures et Cachet */}
              <div className="mt-8 grid grid-cols-2 gap-6 pt-4 border-t border-slate-300 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Le Candidat (signature) :</p>
                  <div className="mt-8 border-b border-dashed border-slate-400 w-40"></div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-900">Pour la Commission d’Admission :</p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">Le Directeur des Études Pédagogiques</p>
                  <div className="mt-4 inline-block rounded-xl border border-blue-600/40 bg-blue-50 px-3 py-1.5 text-center">
                    <p className="font-mono text-[10px] font-bold text-blue-900">CERTIFIÉ CONFORME</p>
                    <p className="text-[9px] text-blue-700">INPTIC / DÉP GABON</p>
                  </div>
                </div>
              </div>

              {/* Bouton d'impression de la convocation */}
              <div className="print:hidden mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Cette convocation doit être présentée imprimée sur papier A4 avec votre pièce d’identité.
                </p>
                <button
                  type="button"
                  onClick={handlePrintConvocation}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 text-sm transition shadow-lg active:scale-95"
                >
                  <Printer size={16} />
                  <span>Imprimer ma Convocation </span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {isPaymentModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dossier-payment-title"
          onClick={() => {
            if (!isPaymentLoading) setIsPaymentModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Frais de concours</p>
                <h2 id="dossier-payment-title" className="mt-1 text-xl font-black text-slate-900">Paiement Mobile Money</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isPaymentLoading}
                aria-label="Fermer le paiement"
                className="rounded p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-5 text-sm text-slate-600">
              Montant à régler : <strong className="text-slate-900">{DOSSIER_FEE.toLocaleString('fr-FR')} FCFA</strong>.
              La soumission sera finalisée après confirmation du paiement.
            </p>

            {paymentStatus === 'pending' ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center" role="status">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
                <p className="font-semibold text-blue-900">Paiement en attente</p>
                <p className="mt-1 text-sm text-blue-800">{paymentStatusMessage || 'Validez la demande sur votre téléphone.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-slate-700">Choisissez votre opérateur</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      aria-label="Airtel Money"
                      aria-pressed={paymentOperator === 'airtel'}
                      onClick={() => setPaymentOperator('airtel')}
                      className={`flex h-20 items-center justify-center rounded-lg border-2 px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 ${paymentOperator === 'airtel' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}
                    >
                      <img src="/payment/airtel.png" alt="" className="h-14 w-32 object-contain" />
                    </button>
                    <button
                      type="button"
                      aria-label="Moov Money"
                      aria-pressed={paymentOperator === 'moov'}
                      onClick={() => setPaymentOperator('moov')}
                      className={`flex h-20 items-center justify-center rounded-lg border-2 px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${paymentOperator === 'moov' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}
                    >
                      <img src="/payment/moovmoney.webp" alt="" className="h-14 w-32 object-contain" />
                    </button>
                  </div>
                </fieldset>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Numéro Mobile Money</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={paymentPhone}
                    onChange={(event) => setPaymentPhone(event.target.value)}
                    placeholder="074 00 12 09"
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                {paymentError && <p className="text-sm text-red-700" role="alert">{paymentError}</p>}

                <button
                  type="button"
                  onClick={startDossierPayment}
                  disabled={isPaymentLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={17} />
                  {isPaymentLoading ? 'Initialisation du paiement…' : `Payer ${DOSSIER_FEE.toLocaleString('fr-FR')} FCFA`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Prévisualisation Document */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-slate-900">{previewDoc.name}</h3>
                <p className="text-xs text-slate-500">{previewDoc.type}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center bg-slate-50 p-4 rounded-xl min-h-[300px]">
              {previewDoc.type.startsWith('image/') && (previewDoc.data || previewDoc.url) ? (
                <img
                  src={previewDoc.data || previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-[60vh] max-w-full rounded object-contain shadow"
                />
              ) : previewDoc.type === 'application/pdf' && (previewDoc.data || previewDoc.url) ? (
                <iframe
                  src={previewDoc.data || previewDoc.url}
                  title={previewDoc.name}
                  className="h-[60vh] w-full rounded border border-slate-200"
                />
              ) : (
                <div className="text-center">
                  <FileText size={48} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">{previewDoc.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Prévisualisation non disponible pour ce type de fichier.</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
