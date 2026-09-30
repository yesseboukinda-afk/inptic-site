'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, CheckCircle2, ArrowRight, ShieldCheck, Upload, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import FormulaireCandidatureLicence, { CandidatureValues } from '@/app/scolarite/formulaire/Formulairecandidature';

export default function DepotPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; type: string; data: string }>>([]);

  useEffect(() => {
    const syncUser = async () => {
      const stored = localStorage.getItem('inptic_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }

      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setCurrentUser((prev: any) => ({
            ...prev,
            email: data.session?.user.email || prev?.email,
            name: data.session?.user.user_metadata?.full_name || prev?.name || 'Candidat',
          }));
        }
      }
      setLoading(false);
    };

    syncUser();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, categoryLabel: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = typeof reader.result === 'string' ? reader.result : '';
      const newDoc = {
        name: `${categoryLabel} - ${file.name}`,
        type: file.type || 'application/octet-stream',
        data: fileData,
      };
      setUploadedFiles((prev) => [...prev.filter((f) => !f.name.startsWith(categoryLabel)), newDoc]);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (values: CandidatureValues, photo: File | null) => {
    if (!currentUser?.email) {
      alert('Veuillez vous connecter avant de soumettre votre dossier.');
      router.push('/candidat');
      return;
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
      documents: [...(currentUser.documents || []), ...uploadedFiles],
      dossierValide: false,
      status: 'en_attente',
      dossierStep: 'en_attente',
      dossierNumero,
      accuseReceptionDate: nowIso,
      candidatureData: values,
    };

    localStorage.setItem('inptic_user', JSON.stringify(updatedProfile));

    const storedUsers = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextUsers = storedUsers.map((u: any) => (u.email === updatedProfile.email ? updatedProfile : u));
    if (!storedUsers.some((u: any) => u.email === updatedProfile.email)) {
      nextUsers.push(updatedProfile);
    }
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

    window.dispatchEvent(new Event('auth-state-changed'));
    router.push('/admissions/paiement');
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Chargement du formulaire de candidature...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* En-tête */}
      <section className="bg-slate-950 py-12 text-white">
        <div className="container-x px-4 md:px-0 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <ShieldCheck size={14} className="text-[#D4AF37]" />
            Portail Officiel d&apos;Admission INPTIC
          </div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Dépôt de Dossier de Candidature</h1>
          <p className="mt-2 text-sm text-slate-300">
            Remplissez le formulaire officiel de candidature et téléversez vos pièces justificatives. Un accusé de réception vous autorisera à régler vos frais de dossier.
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
            <h2 className="mt-4 text-xl font-black text-slate-900">Connexion au compte requise</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Veuillez vous connecter à votre compte candidat ou créer un compte avant de remplir et soumettre votre dossier de candidature.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/candidat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <span>Se connecter / S&apos;inscrire</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="container-x mt-6 px-4 md:px-0 max-w-6xl mx-auto">
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Candidat connecté : <strong className="text-emerald-950">{currentUser.name || currentUser.email}</strong> ({currentUser.email})</span>
            </div>
            <Link href="/admissions/suivi" className="text-blue-700 underline font-bold">
              Voir mon suivi de dossier
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Formulaire principal */}
            <div className="rounded-3xl border border-slate-200 bg-white p-2 sm:p-6 shadow-sm">
              <FormulaireCandidatureLicence
                logoSrc="/logoinptic.png"
                onSubmit={handleFormSubmit}
              />
            </div>

            {/* Panneau latéral de téléversement des pièces justificatives */}
            <aside className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm h-fit lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center gap-2 text-blue-700 border-b border-slate-100 pb-3">
                <Upload size={18} />
                <h3 className="font-bold text-sm text-slate-900">Pièces justificatives numériques</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Joignez les numérisations de vos pièces obligatoires (PDF ou Image, 5 Mo max) avant l&apos;envoi définitif.
              </p>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1. Acte de naissance / CNI</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'Acte de naissance / CNI')}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">2. Baccalauréat / Attestation</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'Baccalauréat / Attestation')}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">3. Relevé de notes officiel</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'Relevé de notes officiel')}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

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
