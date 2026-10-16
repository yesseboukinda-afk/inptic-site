'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LoaderCircle, Mail, RefreshCw, Search, ShieldBan, Trash2, UserRoundCheck } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { isSuperAdminRole } from '@/lib/roles';

type Subscriber = {
  email: string;
  subscribed_at: string;
  is_active: boolean;
  is_blocked: boolean;
};

type Filter = 'all' | 'active' | 'unsubscribed' | 'blocked';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'unsubscribed', label: 'Désabonnés' },
  { value: 'blocked', label: 'Bloqués' },
];

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadSubscribers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/newsletter', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de charger les abonnés.');
      setSubscribers(Array.isArray(result.subscribers) ? result.subscribers : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les abonnés.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void authClient.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError('La session ne peut pas être vérifiée. Rechargez la page.');
        setLoading(false);
        return;
      }
      if (!data.session || !isSuperAdminRole(data.session.user.app_metadata?.role)) {
        router.replace('/candidat');
        return;
      }
      setAuthorized(true);
      void loadSubscribers();
    });
    return () => { active = false; };
  }, [router]);

  const filteredSubscribers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscribers.filter((subscriber) => {
      const matchesSearch = !query || subscriber.email.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' ||
        (filter === 'active' && subscriber.is_active && !subscriber.is_blocked) ||
        (filter === 'unsubscribed' && !subscriber.is_active && !subscriber.is_blocked) ||
        (filter === 'blocked' && subscriber.is_blocked);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, subscribers]);

  const updateBlockStatus = async (subscriber: Subscriber) => {
    const isBlocked = !subscriber.is_blocked;
    const prompt = isBlocked
      ? `Bloquer ${subscriber.email} ? Cette adresse ne recevra plus la newsletter et ne pourra pas se réinscrire.`
      : `Débloquer ${subscriber.email} ? Elle devra se réinscrire pour recevoir de nouveau la newsletter.`;
    if (!window.confirm(prompt)) return;

    setPendingEmail(subscriber.email);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscriber.email, isBlocked }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de modifier le statut.');
      setSubscribers((current) => current.map((item) => item.email === subscriber.email ? result.subscriber : item));
      setMessage(isBlocked ? 'Adresse bloquée.' : 'Adresse débloquée.');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Impossible de modifier le statut.');
    } finally {
      setPendingEmail('');
    }
  };

  const deleteSubscriber = async (subscriber: Subscriber) => {
    if (!window.confirm(`Supprimer définitivement ${subscriber.email} et ses données d’envoi ?`)) return;

    setPendingEmail(subscriber.email);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscriber.email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de supprimer cet abonné.');
      setSubscribers((current) => current.filter((item) => item.email !== subscriber.email));
      setMessage('Abonné supprimé.');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Impossible de supprimer cet abonné.');
    } finally {
      setPendingEmail('');
    }
  };

  if (!authorized) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-500" aria-live="polite">
          {loading ? 'Vérification de l’accès superadmin…' : error || 'Redirection…'}
        </p>
      </main>
    );
  }

  const activeCount = subscribers.filter((subscriber) => subscriber.is_active && !subscriber.is_blocked).length;
  const blockedCount = subscribers.filter((subscriber) => subscriber.is_blocked).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
          <ArrowLeft size={16} aria-hidden="true" />
          Retour au tableau de bord
        </Link>

        <header className="mt-5 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">Administration</p>
            <h1 className="mt-2 text-3xl font-black">Abonnés à la newsletter</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Consultez les inscriptions. Le blocage empêche tout nouvel envoi et toute réinscription.
            </p>
          </div>
          <Mail size={36} className="text-blue-200" aria-hidden="true" />
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Résumé des abonnés">
          {[
            { label: 'Total', value: subscribers.length },
            { label: 'Actifs', value: activeCount },
            { label: 'Bloqués', value: blockedCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-black">{stat.value}</p>
            </div>
          ))}
        </section>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Liste des abonnés">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">Rechercher une adresse e-mail</span>
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un e-mail"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={`rounded-full px-3 py-2 text-xs font-bold ${filter === item.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {item.label}
                </button>
              ))}
              <button type="button" onClick={() => void loadSubscribers()} disabled={loading} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Actualiser">
                {loading ? <LoaderCircle size={17} className="animate-spin" /> : <RefreshCw size={17} />}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
              Chargement des abonnés…
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Aucun abonné ne correspond à cette recherche.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredSubscribers.map((subscriber) => {
                const busy = pendingEmail === subscriber.email;
                const status = subscriber.is_blocked
                  ? { text: 'Bloqué', classes: 'bg-red-50 text-red-700' }
                  : subscriber.is_active
                    ? { text: 'Actif', classes: 'bg-emerald-50 text-emerald-700' }
                    : { text: 'Désabonné', classes: 'bg-slate-100 text-slate-600' };
                return (
                  <li key={subscriber.email} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0">
                      <p className="break-all font-semibold text-slate-900">{subscriber.email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Inscrit le {new Date(subscriber.subscribed_at).toLocaleDateString('fr-FR')}
                        <span className={`ml-2 inline-flex rounded-full px-2 py-1 font-bold ${status.classes}`}>{status.text}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void updateBlockStatus(subscriber)}
                        disabled={Boolean(pendingEmail)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {subscriber.is_blocked ? <UserRoundCheck size={15} /> : <ShieldBan size={15} />}
                        {subscriber.is_blocked ? 'Débloquer' : 'Bloquer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSubscriber(subscriber)}
                        disabled={Boolean(pendingEmail)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        Supprimer
                      </button>
                      {busy && <LoaderCircle size={17} className="animate-spin self-center text-slate-400" aria-label="Action en cours" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
