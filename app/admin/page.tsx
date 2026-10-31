'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  LoaderCircle,
  FileText,
  GraduationCap,
  Eye,
  EyeOff,
  History,
  Image as ImageIcon,
  Mail,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { isSuperAdminRole, STAFF_SERVICE_OPTIONS } from '@/lib/roles';
import { CLUBS } from '@/lib/clubs';

type StaffAccount = {
  id: string;
  email: string;
  role: string;
  name: string;
  department: string;
  clubSlug: string;
  emailVerified: boolean;
  createdAt: string;
};

const staffRoles = [
  { value: 'superadmin', label: 'Super administrateur' },
  { value: 'admin', label: 'Administrateur' },
] as const;

const roleLabels = Object.fromEntries(staffRoles.map(({ value, label }) => [value, label]));
const serviceLabels = Object.fromEntries(STAFF_SERVICE_OPTIONS.map(({ value, label }) => [value, label]));

const managementAreas = [
  {
    title: 'Journal de traçabilité',
    description: 'Consulter les actions enregistrées avec leur auteur, leur service et leur date.',
    href: '/admin/journal',
    icon: History,
    color: 'violet',
  },
  {
    title: 'Admissions et dossiers étudiants',
    description: 'Consulter et gérer les dossiers, documents et étapes de suivi des candidats.',
    href: '/directeur',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Scolarité',
    description: 'Accéder aux dossiers, documents et outils de suivi de la scolarité.',
    href: '/scolarite',
    icon: GraduationCap,
    color: 'cyan',
  },
  {
    title: 'Concours et préinscriptions',
    description: 'Gérer les concours, les résultats, les pièces jointes et les préinscriptions.',
    href: '/concours',
    icon: FileText,
    color: 'amber',
  },
  {
    title: 'Formations et catalogue',
    description: 'Consulter le catalogue et accéder aux outils de gestion des formations.',
    href: '/formations',
    icon: BookOpen,
    color: 'emerald',
  },
  {
    title: 'Contenus du site',
    description: 'Remplacer les photos et gérer les filières, leurs débouchés et les certifications.',
    href: '/admin/contenus',
    icon: ImageIcon,
    color: 'emerald',
  },
  {
    title: 'Actualités et annonces',
    description: 'Créer et gérer les publications diffusées sur le site.',
    href: '/annonces/gestion',
    icon: Megaphone,
    color: 'violet',
  },
  {
    title: 'Abonnés à la newsletter',
    description: 'Consulter les inscriptions et bloquer ou supprimer une adresse.',
    href: '/admin/newsletter',
    icon: Mail,
    color: 'blue',
  },
  {
    title: 'Clubs et candidatures',
    description: 'Consulter les demandes d’adhésion et gérer les clubs étudiants.',
    href: '/clubs',
    icon: Users,
    color: 'indigo',
  },
  {
    title: 'Configuration du moteur IA',
    description: 'Choisir et tester le fournisseur du chatbot, son modèle et ses identifiants.',
    href: '/admin/ai-settings',
    icon: Bot,
    color: 'indigo',
  },
  {
    title: 'Recherche et publications scientifiques',
    description: 'Consulter les publications et accéder aux actions disponibles pour le personnel.',
    href: '/recherche/publications',
    icon: FileText,
    color: 'indigo',
  },
  {
    title: 'Ressources humaines',
    description: 'Gérer les profils du personnel, les cartes professionnelles et les outils RH.',
    href: '/admin/rh',
    icon: BriefcaseBusiness,
    color: 'rose',
  },
] as const;

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unavailable'>('loading');
  const [email, setEmail] = useState('');
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [accountsMessage, setAccountsMessage] = useState('');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'admin',
    department: '',
    clubSlug: '',
  });
  const [creating, setCreating] = useState(false);
  const [initialPasswordVisible, setInitialPasswordVisible] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    let active = true;

    void authClient.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setStatus('unavailable');
        return;
      }

      const session = data.session;
      if (!session) {
        router.replace('/candidat');
        return;
      }

      if (!isSuperAdminRole(session.user.app_metadata?.role)) {
        router.replace('/candidat');
        return;
      }

      setEmail(session.user.email || '');
      setStatus('authorized');
    });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (status !== 'authorized') return;

    let active = true;
    setAccountsLoading(true);
    setAccountsError('');
    void fetch('/api/admin/accounts', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Impossible de charger les comptes.');
        if (active) setAccounts(Array.isArray(result.accounts) ? result.accounts : []);
      })
      .catch((error: unknown) => {
        if (active) setAccountsError(error instanceof Error ? error.message : 'Impossible de charger les comptes.');
      })
      .finally(() => {
        if (active) setAccountsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status]);

  const filteredAccounts = accounts.filter((account) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query ||
      account.email.toLowerCase().includes(query) ||
      account.name.toLowerCase().includes(query);
    return matchesSearch &&
      (departmentFilter === 'all' || account.department === departmentFilter) &&
      (roleFilter === 'all' || account.role === roleFilter);
  });
  const accountsByDepartment = filteredAccounts.reduce<Record<string, StaffAccount[]>>((groups, account) => {
    const department = account.department || 'Direction/service non renseigné';
    groups[department] ??= [];
    groups[department].push(account);
    return groups;
  }, {});

  const refreshAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const response = await fetch('/api/admin/accounts', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de charger les comptes.');
      setAccounts(Array.isArray(result.accounts) ? result.accounts : []);
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : 'Impossible de charger les comptes.');
    } finally {
      setAccountsLoading(false);
    }
  };

  const createAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setAccountsError('');
    setAccountsMessage('');
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de créer le compte.');
      setForm({ email: '', name: '', password: '', role: 'admin', department: '', clubSlug: '' });
      setAccountsMessage(`Le compte ${result.account.email} a été créé.`);
      await refreshAccounts();
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : 'Impossible de créer le compte.');
    } finally {
      setCreating(false);
    }
  };

  const deleteAccount = async (account: StaffAccount) => {
    if (!window.confirm(`Supprimer définitivement le compte de ${account.email} ? Ses sessions seront révoquées.`)) return;

    setDeletingId(account.id);
    setAccountsError('');
    setAccountsMessage('');
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de supprimer le compte.');
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      setAccountsMessage(`Le compte ${account.email} a été supprimé.`);
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : 'Impossible de supprimer le compte.');
    } finally {
      setDeletingId('');
    }
  };

  if (status === 'loading') {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-500">Vérification de l’accès superadmin…</p>
      </main>
    );
  }

  if (status === 'unavailable') {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4">
        <section className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Vérification indisponible</h1>
          <p className="mt-2 text-sm text-slate-600">La session n’a pas pu être vérifiée. Recharge la page ou reconnecte-toi.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Réessayer
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-200">
                <ShieldCheck size={15} aria-hidden="true" />
                Accès superadmin
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Administration du site</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Accède depuis un seul endroit aux espaces de gestion disponibles sur INPTIC.
              </p>
              {email && <p className="mt-4 text-sm text-slate-400">Connecté en tant que {email}</p>}
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Voir le site
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section aria-labelledby="accounts-title" className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="accounts-title" className="text-xl font-bold tracking-tight">Comptes du personnel</h2>
              <p className="mt-1 text-sm text-slate-600">
                Crée et supprime les comptes administratifs, puis consulte-les par direction ou service.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              {filteredAccounts.length} / {accounts.length} comptes
            </span>
          </div>

          {accountsError && (
            <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {accountsError}
            </p>
          )}
          {accountsMessage && (
            <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {accountsMessage}
            </p>
          )}

          <form onSubmit={createAccount} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <Plus size={18} aria-hidden="true" />
              Créer un compte du personnel
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Nom complet
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  autoComplete="name"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Adresse e-mail
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  autoComplete="email"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Mot de passe initial
                <div className="relative mt-1.5">
                  <input
                    required
                    type={initialPasswordVisible ? 'text' : 'password'}
                    maxLength={256}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-11 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setInitialPasswordVisible((visible) => !visible)}
                    aria-label={initialPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={initialPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {initialPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Rôle
                <select
                  value={form.role}
                  onChange={(event) => setForm({
                    ...form,
                    role: event.target.value,
                    department: event.target.value === 'superadmin' ? '' : form.department,
                  })}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  {staffRoles.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              {form.role === 'admin' ? (
                <label className="text-sm font-medium text-slate-700">
                  Service attribué
                  <select
                    required
                    value={form.department}
                    onChange={(event) => setForm({ ...form, department: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="" disabled>Choisir un service</option>
                    {STAFF_SERVICE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              ) : (
                <p className="self-end text-sm text-violet-700 sm:col-span-2">
                  Le superadmin peut accéder à tous les services.
                </p>
              )}
              {form.role === 'admin' && form.department === 'clubs' && (
                <label className="text-sm font-medium text-slate-700">
                  Club attribué
                  <select
                    required
                    value={form.clubSlug}
                    onChange={(event) => setForm({ ...form, clubSlug: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="" disabled>Choisir un club</option>
                    {CLUBS.map((club) => <option key={club.slug} value={club.slug}>{club.name}</option>)}
                  </select>
                </label>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-slate-500">
                Le mot de passe est haché avant stockage. Le compte est activé immédiatement.
              </p>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                Créer le compte
              </button>
            </div>
          </form>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3">
              <label className="relative block">
                <span className="sr-only">Rechercher un compte</span>
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher par nom ou e-mail"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>
              <label>
                <span className="sr-only">Filtrer par direction ou service</span>
                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="all">Toutes les directions/services</option>
                  {STAFF_SERVICE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Filtrer par rôle</span>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="all">Tous les rôles</option>
                  {staffRoles.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>

            {accountsLoading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
                <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                Chargement des comptes…
              </div>
            ) : filteredAccounts.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">Aucun compte du personnel ne correspond à ces filtres.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {Object.entries(accountsByDepartment).sort(([left], [right]) => left.localeCompare(right, 'fr')).map(([department, departmentAccounts]) => (
                  <section key={department} aria-label={department}>
                    <h3 className="bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600 sm:px-5">
                      {serviceLabels[department as keyof typeof serviceLabels] || department}
                      <span className="ml-1 font-medium text-slate-400">({departmentAccounts.length})</span>
                    </h3>
                    <div className="divide-y divide-slate-100">
                      {departmentAccounts.map((account) => (
                        <article key={account.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="mt-0.5 rounded-xl bg-slate-100 p-2.5 text-slate-600">
                              <Users size={18} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <h4 className="truncate font-semibold text-slate-900">{account.name || account.email}</h4>
                              <p className="truncate text-sm text-slate-600">{account.email}</p>
                              {account.clubSlug && (
                                <p className="mt-1 text-xs font-semibold text-violet-700">
                                  {CLUBS.find((club) => club.slug === account.clubSlug)?.name || account.clubSlug}
                                </p>
                              )}
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <BadgeCheck size={13} aria-hidden="true" />
                                  {roleLabels[account.role as keyof typeof roleLabels] || account.role}
                                </span>
                                <span>{account.emailVerified ? 'Compte activé' : 'E-mail non confirmé'}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void deleteAccount(account)}
                            disabled={deletingId === account.id}
                            aria-label={`Supprimer le compte ${account.email}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === account.id
                              ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                              : <Trash2 size={15} aria-hidden="true" />}
                            Supprimer
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="management-areas-title" className="mt-8">
          <div className="mb-4">
            <h2 id="management-areas-title" className="text-xl font-bold tracking-tight">Espaces de gestion</h2>
            <p className="mt-1 text-sm text-slate-600">Les actions proposées dans chaque espace restent soumises aux autorisations de la session.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {managementAreas.map(({ title, description, href, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`inline-flex rounded-xl p-3 ring-1 ${colorClasses[color]}`}>
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <ArrowUpRight size={18} className="text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-8 text-xs leading-5 text-slate-500">
          Les accès sont contrôlés côté serveur. Si un espace nécessite encore un rôle spécialisé, il l’indiquera dans cet espace.
        </p>
      </div>
    </main>
  );
}
