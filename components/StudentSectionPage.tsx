'use client';

import { BookOpen, BriefcaseBusiness, CalendarDays, FileCheck2, FileText, GraduationCap, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type StudentProfile = {
  name?: string;
  email?: string;
  niveau?: string;
  parcours?: string;
  promotion?: string;
  annee?: string;
  diplome?: string;
  documents?: Array<{ name: string; type: string; data?: string }>;
};

type SectionKey = 'profil' | 'cours' | 'emploi-du-temps' | 'diplomes' | 'releves' | 'stages' | 'attestations';

type SectionConfig = {
  title: string;
  description: string;
  icon: typeof UserRound;
};

const sections: Record<SectionKey, SectionConfig> = {
  profil: { title: 'Profil étudiant', description: 'Consultez vos informations personnelles et académiques.', icon: UserRound },
  cours: { title: 'Cours', description: 'Retrouvez votre parcours et vos informations pédagogiques.', icon: BookOpen },
  'emploi-du-temps': { title: 'Emploi du temps', description: 'Consultez votre calendrier de cours, examens et événements.', icon: CalendarDays },
  diplomes: { title: 'Diplômes', description: 'Retrouvez vos diplômes obtenus et votre année de formation.', icon: GraduationCap },
  releves: { title: 'Relevés de notes', description: 'Accédez à vos relevés de notes lorsqu’ils sont disponibles.', icon: FileText },
  stages: { title: 'Stages', description: 'Suivez vos conventions, lieux de stage et documents associés.', icon: BriefcaseBusiness },
  attestations: { title: 'Attestations', description: 'Retrouvez vos attestations de scolarité, de stage et de réussite.', icon: FileCheck2 },
};

export default function StudentSectionPage({ section }: { section: SectionKey }) {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const config = sections[section];
  const Icon = config.icon;

  useEffect(() => {
    const stored = localStorage.getItem('inptic_user');
    if (!stored) {
      router.replace('/candidat');
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StudentProfile & { dossierValide?: boolean; status?: string };
      if (parsed.dossierValide !== true && parsed.status !== 'valide') {
        router.replace('/admissions/suivi');
        return;
      }
      setProfile(parsed);
    } catch {
      router.replace('/candidat');
    }
  }, [router]);

  if (!profile) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">Vérification de l’accès…</main>;
  }

  const documents = profile.documents || [];
  const matchingDocuments = section === 'releves'
    ? documents.filter((document) => /releve|notes?/i.test(document.name))
    : section === 'attestations'
      ? documents.filter((document) => /attestation|certificat/i.test(document.name))
      : section === 'stages'
        ? documents.filter((document) => /stage|convention/i.test(document.name))
        : documents;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8 lg:pl-[238px]">
          <div className="flex items-center gap-3">
            <Icon size={24} className="text-blue-700" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Espace étudiant</p>
              <h1 className="text-xl font-bold text-slate-900">{config.title}</h1>
            </div>
          </div>
          <Link href="/vie-etudiante" className="border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">Tableau de bord</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 lg:pl-[238px]">
        <nav className="mb-6 border border-slate-200 bg-white p-3 lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:mb-0 lg:h-screen lg:w-[210px] lg:overflow-y-auto lg:p-5" aria-label="Menu étudiant">
          {(Object.keys(sections) as SectionKey[]).map((key) => {
            const MenuIcon = sections[key].icon;
            return <Link key={key} href={`/vie-etudiante/${key}`} className={`flex items-center gap-3 border-l-2 px-3 py-3 text-sm font-semibold transition hover:bg-blue-50 hover:text-blue-700 ${key === section ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600'}`}><MenuIcon size={22} aria-hidden="true" />{sections[key].title}</Link>;
          })}
        </nav>

        <section className="student-section-page border border-slate-200 bg-white p-6 md:p-8" aria-live="polite">
          <p className="text-sm text-slate-500">Bonjour {profile.name || 'Étudiant'}.</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{config.title}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">{config.description}</p>

          {section === 'profil' && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ['Nom complet', profile.name],
                ['Email', profile.email],
                ['Niveau', profile.niveau],
                ['Parcours', profile.parcours],
                ['Promotion', profile.promotion],
                ['Année', profile.annee],
              ].map(([label, value]) => <div key={label} className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-900">{value || 'À renseigner'}</p></div>)}
            </div>
          )}

          {section === 'cours' && <div className="mt-8 border border-blue-100 bg-blue-50 p-5"><p className="font-bold text-blue-900">Parcours : {profile.parcours || 'À renseigner'}</p><p className="mt-2 text-sm leading-6 text-slate-700">Le catalogue détaillé des cours sera publié ici par l’administration.</p></div>}
          {section === 'emploi-du-temps' && <div className="mt-8 border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">Calendrier non publié</p><p className="mt-2 text-sm leading-6 text-slate-700">Votre emploi du temps apparaîtra ici dès sa mise à disposition.</p></div>}
          {section === 'diplomes' && <div className="mt-8 border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">{profile.diplome || 'Aucun diplôme enregistré'}</p><p className="mt-2 text-sm text-slate-600">Année : {profile.annee || 'À renseigner'}</p></div>}
          {(['releves', 'stages', 'attestations'] as SectionKey[]).includes(section) && <div className="mt-8">{matchingDocuments.length ? <ul className="space-y-3">{matchingDocuments.map((document) => <li key={`${document.name}-${document.type}`} className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 p-4"><span className="truncate font-semibold text-slate-800">{document.name}</span><span className="text-xs font-bold uppercase text-blue-700">Document</span></li>)}</ul> : <div className="border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">Aucun document disponible</p><p className="mt-2 text-sm leading-6 text-slate-700">Les documents associés à cette rubrique apparaîtront ici après leur dépôt ou leur délivrance.</p></div>}</div>}
        </section>
      </div>
    </main>
  );
}
