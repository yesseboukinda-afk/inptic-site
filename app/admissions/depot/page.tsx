'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, CheckCircle2, ArrowRight, ShieldCheck, Upload, FileText } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useTranslation } from 'react-i18next';
import FormulaireCandidatureLicence, { CandidatureValues } from '@/app/scolarite/formulaire/Formulairecandidature';
import {
  hasCompletedAdmissionPreRegistration,
  REQUIRED_ADMISSION_DOCUMENTS,
} from '@/lib/admissionsWorkflow';

export default function DepotPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; category: string; type: string; data: string }>>([]);
  const [uploadError, setUploadError] = useState('');
  const [concoursSlug, setConcoursSlug] = useState('');

  useEffect(() => {
    setConcoursSlug(new URLSearchParams(window.location.search).get('concours') || '');
    const syncUser = async () => {
      const stored = localStorage.getItem('inptic_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }

      const { data } = await authClient.auth.getSession();
      const authenticatedUser = data.session?.user;
      if (authenticatedUser) {
        setCurrentUser((prev: any) => ({
          ...prev,
          email: authenticatedUser.email || prev?.email,
          name: authenticatedUser.user_metadata?.full_name || prev?.name || 'Candidat',
        }));
      }
      setLoading(false);
    };

    syncUser();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, categoryLabel: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      setUploadError(`${categoryLabel} : seuls les fichiers PDF, JPG, PNG ou WebP sont acceptés.`);
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`${categoryLabel} : le fichier ne doit pas dépasser 5 Mo.`);
      e.target.value = '';
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = typeof reader.result === 'string' ? reader.result : '';
      const newDoc = {
        name: `${categoryLabel} - ${file.name}`,
        category: categoryLabel,
        type: file.type || 'application/octet-stream',
        data: fileData,
      };
      setUploadedFiles((prev) => [...prev.filter((f) => !f.name.startsWith(categoryLabel)), newDoc]);
    };
    reader.onerror = () => setUploadError(`Lecture impossible pour le fichier « ${file.name} ».`);
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (values: CandidatureValues, photo: File | null) => {
    if (!currentUser?.email) {
      alert('Veuillez vous connecter avant de soumettre votre dossier.');
      router.push('/candidat');
      return;
    }

    const missingDocuments = REQUIRED_ADMISSION_DOCUMENTS.filter(
      (category) => !uploadedFiles.some((document) => document.category === category)
    );
    if (missingDocuments.length) {
      throw new Error(`Ajoutez tous les justificatifs obligatoires : ${missingDocuments.join(', ')}.`);
    }

    let photoUrl = '';
    if (photo) {
      try {
        const reader = new FileReader();
        photoUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.readAsDataURL(photo);
        });
      } catch {
        // ignore
      }
    }

    const nowIso = new Date().toISOString();
    const dossierNumero = `INPTIC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const updatedProfile = {
      ...currentUser,
      email: values.email || currentUser.email,
      name: `${values.nom} ${values.prenoms}`.trim() || currentUser.name,
      phone: values.telephone1 || currentUser.phone,
      photo: photoUrl || currentUser.photo,
      filiere: values.filieresInitiale[0] || values.filieresContinue[0] || 'Licence Professionnelle',
      niveau: 'Licence Professionnelle',
      diplome: values.baccalaureat,
      parcours: `Bac ${values.baccalaureat} (${values.anneeBac}). ${values.cursus.filter(c => c.etablissement).map(c => `${c.annee}: ${c.etablissement} (${c.diplome})`).join('; ')}`,
      documents: [
        ...uploadedFiles,
        ...(currentUser.documents || []).filter(
          (document: { category?: string }) =>
            !uploadedFiles.some((uploaded) => uploaded.category === document.category)
        ),
      ],
      dossierValide: false,
      status: 'en_attente',
      dossierStep: 'en_attente',
      dossierNumero,
      accuseReceptionDate: nowIso,
      candidatureData: values,
      admissionWorkflow: {
        ...currentUser.admissionWorkflow,
        applicationCompletedAt: nowIso,
      },
    };

    const response = await fetch('/api/candidat/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Le dossier et ses documents n’ont pas pu être enregistrés.');
    }

    const profileToPersist = {
      ...updatedProfile,
      ...(payload.profile && Array.isArray(payload.profile.documents)
        ? { documents: payload.profile.documents }
        : {}),
    };
    localStorage.setItem('inptic_user', JSON.stringify(profileToPersist));

    const storedUsers = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextUsers = storedUsers.map((user: any) =>
      user.email === profileToPersist.email ? profileToPersist : user
    );
    if (!storedUsers.some((user: any) => user.email === profileToPersist.email)) {
      nextUsers.push(profileToPersist);
    }
    localStorage.setItem('inptic_users', JSON.stringify(nextUsers));
    window.dispatchEvent(new Event('auth-state-changed'));
    router.push(`/admissions/paiement?concours=${encodeURIComponent(concoursSlug)}`);
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Chargement du formulaire de candidature...</p>
      </main>
    );
  }

  const candidateNameParts = String(currentUser?.name || '').trim().split(/\s+/).filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* En-tête */}
      <section className="relative isolate overflow-hidden text-white bg-slate-950">
        <img src="/banniere/1.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('depotPage.title', 'Dépôt de Dossier de Candidature')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            {t('depotPage.intro', 'Remplissez le formulaire officiel de candidature et téléversez vos pièces justificatives. Un accusé de réception vous autorisera à régler vos frais de dossier.')}
          </p>
        </div>
      </section>

      {/* Si non connecté */}
      {!currentUser ? (
        <section className="container-x mt-10 px-4 md:px-0 max-w-xl mx-auto">
          <div className="rounded-3xl border border-blue-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <LogIn size={28} />
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">{t('depotPage.loginRequired', 'Connexion au compte requise')}</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {t('depotPage.loginDesc', 'Veuillez vous connecter à votre compte candidat ou créer un compte avant de remplir et soumettre votre dossier de candidature.')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/candidat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <span>{t('depotPage.loginBtn', "Se connecter / S'inscrire")}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      ) : !hasCompletedAdmissionPreRegistration(currentUser) ||
        (concoursSlug && currentUser.admissionWorkflow?.preRegistration?.concoursSlug !== concoursSlug) ? (
        <section className="container-x mt-10 px-4 md:px-0 max-w-xl mx-auto">
          <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-lg">
            <h2 className="text-xl font-black text-slate-900">Préinscription requise</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Terminez la préinscription à la session actuellement ouverte avant de remplir le dossier officiel.
            </p>
            <Link href="/concours" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">
              Continuer mon inscription <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        <section className="container-x mt-6 px-4 md:px-0 max-w-6xl mx-auto">
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{t('depotPage.connectedAs', 'Candidat connecté :')} <strong className="text-emerald-950">{currentUser.name || currentUser.email}</strong> ({currentUser.email})</span>
            </div>
            <Link href="/admissions/suivi" className="text-blue-700 underline font-bold">
              {t('depotPage.viewTracking', 'Voir mon suivi de dossier')}
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Formulaire principal */}
            <div className="rounded-3xl border border-slate-200 bg-white p-2 sm:p-6 shadow-sm">
              <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-blue-950">
                  <span>Justificatifs obligatoires</span>
                  <span>{uploadedFiles.length} / {REQUIRED_ADMISSION_DOCUMENTS.length}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-700 transition-all"
                    style={{ width: `${Math.min(uploadedFiles.length / REQUIRED_ADMISSION_DOCUMENTS.length, 1) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-blue-900">
                  Les informations du formulaire et les trois pièces doivent être complètes avant de continuer au paiement.
                </p>
              </div>
              <FormulaireCandidatureLicence
                logoSrc="/logoinptic.png"
                initialValues={{
                  nom: candidateNameParts[0] || '',
                  prenoms: candidateNameParts.slice(1).join(' '),
                  email: currentUser.email || '',
                  telephone1: currentUser.phone || '',
                }}
                lockEmail
                submitDisabled={uploadedFiles.length !== REQUIRED_ADMISSION_DOCUMENTS.length}
                onSubmit={handleFormSubmit}
              />
            </div>

            {/* Panneau latéral de téléversement des pièces justificatives */}
            <aside className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm h-fit lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center gap-2 text-blue-700 border-b border-slate-100 pb-3">
                <Upload size={18} />
                <h3 className="font-bold text-sm text-slate-900">{t('depotPage.digitalDocs', 'Pièces justificatives numériques')}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('depotPage.digitalDocsDesc', 'Joignez les trois pièces justificatives requises (PDF ou image, 5 Mo max chacune) avant l’envoi définitif.')}
              </p>

              <div className="space-y-3.5">
                {REQUIRED_ADMISSION_DOCUMENTS.map((category, index) => (
                  <div key={category}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{index + 1}. {category}</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileUpload(e, category)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  </div>
                ))}
              </div>

              {uploadError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-800">{uploadError}</p>}

              {uploadedFiles.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Documents prêts ({uploadedFiles.length})</span>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <span className="truncate font-medium">{f.name}</span>
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
