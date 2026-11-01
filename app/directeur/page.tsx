'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  LogOut,
  Megaphone,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { isSuperAdminRole } from '@/lib/roles';
import { useTranslation } from 'react-i18next';

type StudentProfile = {
  email: string;
  name: string;
  phone?: string;
  niveau?: string;
  parcours?: string;
  promotion?: string;
  filiere?: string;
  dossierNumero?: string;
  role?: string;
  dossierValide?: boolean;
  status?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
};

export default function DirecteurDashboard() {
  const { t } = useTranslation();
  const router = useRouter();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [ready, setReady] = useState(false);
  const [quotaAlert, setQuotaAlert] = useState<string | null>(null);

  useEffect(() => {
    const director = localStorage.getItem('inptic_directeur');
    let directorData: { role?: unknown } = {};
    try {
      directorData = JSON.parse(director || '{}');
    } catch {
      directorData = {};
    }

    if (!director || !isSuperAdminRole(directorData.role)) {
      router.replace('/candidat');
      return;
    }

    const stored = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const localProfiles: StudentProfile[] = Array.isArray(stored)
      ? stored.filter((entry: StudentProfile) => entry.role === 'etudiant' || entry.email)
      : [];

    fetch('/api/candidat/profile')
      .then((response) => (response.ok ? response.json() : { profiles: [] }))
      .then((data: { profiles?: StudentProfile[] }) => {
        const remoteProfiles = Array.isArray(data.profiles) ? data.profiles : [];
        const profilesByEmail = new Map(localProfiles.map((profile) => [profile.email.toLowerCase(), profile]));
        remoteProfiles.forEach((profile) => {
          const localProfile = profilesByEmail.get(profile.email.toLowerCase());
          profilesByEmail.set(profile.email.toLowerCase(), {
            ...localProfile,
            ...profile,
            role: 'etudiant',
          });
        });
        setStudents(Array.from(profilesByEmail.values()));
      })
      .catch(() => {
        setStudents(localProfiles);
      });
    setReady(true);
  }, [router]);

  // Quota email notification check (every 100 registrations)
  useEffect(() => {
    const totalCount = students.length;
    const lastNotified = Number(localStorage.getItem('inptic_last_notified_quota') || '0');
    const currentMilestone = Math.floor(totalCount / 100) * 100;

    if (currentMilestone > 0 && currentMilestone > lastNotified) {
      localStorage.setItem('inptic_last_notified_quota', currentMilestone.toString());
      setQuotaAlert(`Quota d'inscription atteint : ${currentMilestone} étudiants enregistrés. Rapport officiel transmis à la Direction Générale.`);
    }
  }, [students]);

  const stats = useMemo(() => {
    const total = students.length;
    const valides = students.filter((s) => s.status === 'valide' || s.dossierValide).length;
    const enAttente = students.filter((s) => s.status === 'en_attente' || !s.status).length;
    return { total, valides, enAttente };
  }, [students]);

  const handleLogout = () => {
    localStorage.removeItem('inptic_directeur');
    window.dispatchEvent(new Event('auth-state-changed'));
    router.replace('/candidat');
  };

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Chargement de l&apos;Espace Direction Générale...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── BANNIÈRE HÉRO DG ── */}
      <section className="relative isolate overflow-hidden text-white bg-slate-950">
        <img
          src="/banniere/DG.webp"
          alt="Directeur Général INPTIC"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-20 mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <img src="/logoinptic.ico" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                <ShieldCheck size={14} className="text-[#D4AF37]" />
                Direction Générale • INPTIC Gabon
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Tableau de Bord Exécutif &amp; Gouvernance
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-200 max-w-2xl sm:text-lg">
                Supervisez la stratégie globale, la gouvernance de l&apos;Institut, les effectifs étudiants et accédez rapidement à l&apos;ensemble des directions spécialisées.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition shadow"
              >
                <LogOut size={16} />
                <span>Déconnexion DG</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Alerte Quota */}
      {quotaAlert && (
        <div className="mx-auto max-w-6xl mt-6 px-4 md:px-8">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Award size={18} className="text-[#D4AF37] shrink-0" />
              <span>{quotaAlert}</span>
            </div>
            <button onClick={() => setQuotaAlert(null)} className="rounded-lg p-1 hover:bg-amber-100">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── INDICATEURS STRATÉGIQUES ÉXÉCUTIFS ── */}
      <section className="mx-auto max-w-6xl mt-8 px-4 md:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Effectif Global Étudiants</span>
            <p className="mt-2 text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="mt-1 text-[11px] text-slate-500">Inscrits toutes filières confondues</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Admissions Validées</span>
            <p className="mt-2 text-3xl font-black text-emerald-800">{stats.valides}</p>
            <p className="mt-1 text-[11px] text-emerald-700">Dossiers confirmés par la Scolarité</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Inscriptions en Cours</span>
            <p className="mt-2 text-3xl font-black text-amber-800">{stats.enAttente}</p>
            <p className="mt-1 text-[11px] text-amber-700">Traités par la Scolarité</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Rapports de Quota</span>
            <p className="mt-2 text-3xl font-black text-blue-900">{Math.floor(stats.total / 100)}</p>
            <p className="mt-1 text-[11px] text-blue-700">E-mails de paliers de 100 émis</p>
          </div>
        </div>
      </section>

      {/* ── ACCÈS DIRECTS AUX DIRECTIONS DE L'INPTIC ── */}
      <section className="mx-auto max-w-6xl mt-8 px-4 md:px-8 space-y-4">
        <h2 className="text-xl font-black text-slate-900">Accès Rapide aux Directions Spécialisées</h2>

        <div className="grid md:grid-cols-3 gap-5">
          <Link
            href="/scolarite"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 font-bold">
                <GraduationCap size={20} />
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition">Direction de la Scolarité</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Examen, validation des dossiers d&apos;admission des candidats, consultation des pièces justificatives et rapports d&apos;effectifs.
            </p>
          </Link>

          <Link
            href="/admin/rh"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-amber-500 hover:shadow-md transition space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
                <Users size={20} />
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-amber-600 transition" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition">Gestion RH &amp; Personnel</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Supervision des contrats du personnel enseignant et administratif, demandes de congés, fiches de paie et annonces RH.
            </p>
          </Link>

          <Link
            href="/veille"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-purple-500 hover:shadow-md transition space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 font-bold">
                <Megaphone size={20} />
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-purple-600 transition" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-600 transition">Veille</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Publier les annonces officielles et suivre la veille e-réputation.
            </p>
          </Link>
        </div>
      </section>

      {/* ── RAPPORTS DE QUOTA DE L'INSTITUT ── */}
      <section className="mx-auto max-w-6xl mt-8 px-4 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-blue-600" />
            <h2 className="text-lg font-black text-slate-900">Rapports d&apos;Inscription &amp; Notifications de Quota</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Historique des notifications officielles transmises automatiquement à la Direction Générale (`directeur@inptic.ga`) à chaque palier de 100 candidatures atteint.
          </p>

          <div className="space-y-3 pt-2">
            {stats.total >= 100 ? (
              Array.from({ length: Math.floor(stats.total / 100) }).map((_, idx) => {
                const milestone = (idx + 1) * 100;
                return (
                  <div key={milestone} className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black">
                        {milestone}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Palier de {milestone} inscriptions atteint</p>
                        <p className="text-slate-500">Rapport de quota d&apos;effectif officiel généré et transmis au DG</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">
                      Rapport Transmis
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
                Inscriptions actuelles : <strong className="text-slate-800">{stats.total}</strong> / 100.
                Le premier rapport de quota sera automatiquement transmis à la Direction Générale dès le franchissement de la 100ème inscription.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
