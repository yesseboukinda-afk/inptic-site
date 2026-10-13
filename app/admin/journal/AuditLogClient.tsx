'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, LoaderCircle, Search, ShieldCheck } from 'lucide-react';

type AuditEntry = {
  id: string;
  actor_email: string | null;
  actor_name: string;
  actor_role: string;
  service: string;
  direction: string;
  action: string;
  http_method: string;
  route: string;
  outcome: 'en_cours' | 'succes' | 'echec';
  response_status: number | null;
  created_at: string;
  completed_at: string | null;
};

type RHAuditEntry = {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  target_id: string | null;
  target_name: string | null;
  details: string | null;
  ip_address: string | null;
  timestamp: string;
};

const pageSize = 50;
const serviceOptions = [
  ['all', 'Tous les services'],
  ['scolarite', 'Scolarité'],
  ['communication', 'Communication'],
  ['direction_etudes', 'Direction des études'],
  ['rh', 'Ressources humaines'],
  ['administration_generale', 'Administration générale'],
  ['portail_candidat', 'Portail candidat'],
  ['public', 'Portail public'],
];

const escapeCsv = (value: unknown) => {
  const text = String(value ?? '');
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

export default function AuditLogClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [rhLogs, setRhLogs] = useState<RHAuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [activeLogTab, setActiveLogTab] = useState<'site' | 'rh'>('site');
  const [exporting, setExporting] = useState(false);
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [serviceInput, setServiceInput] = useState('all');
  const [service, setService] = useState('all');
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      scope: activeLogTab,
    });
    if (search) params.set('q', search);
    if (activeLogTab === 'site' && service !== 'all') params.set('service', service);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    setLoading(true);
    setError('');
    void fetch(`/api/admin/audit?${params}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Impossible de charger le journal.');
        if (activeLogTab === 'rh') {
          setRhLogs(Array.isArray(result.logs) ? result.logs : []);
        } else {
          setLogs(Array.isArray(result.logs) ? result.logs : []);
        }
        setTotal(Number(result.total) || 0);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Impossible de charger le journal.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [offset, search, service, from, to, activeLogTab]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim());
    setService(serviceInput);
    setFrom(fromInput);
    setTo(toInput);
  };

  const handleExportLogs = async () => {
    setExporting(true);
    setError('');
    try {
      const params = new URLSearchParams({ scope: activeLogTab, export: '1' });
      if (search) params.set('q', search);
      if (activeLogTab === 'site' && service !== 'all') params.set('service', service);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const response = await fetch(`/api/admin/audit?${params}`, { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible d’exporter le journal.');

      const headers = activeLogTab === 'rh'
        ? ['Date et heure', 'Utilisateur', 'Action', 'ID cible', 'Employé cible', 'Détails', 'Adresse IP']
        : ['Date et heure', 'Acteur', 'Courriel', 'Rôle', 'Service', 'Direction', 'Action', 'Méthode', 'Route', 'Résultat', 'Code HTTP'];
      const rows = (Array.isArray(result.logs) ? result.logs : []).map((entry: AuditEntry | RHAuditEntry) =>
        activeLogTab === 'rh' && 'timestamp' in entry
          ? [entry.timestamp, entry.user_email, entry.action, entry.target_id, entry.target_name, entry.details, entry.ip_address]
          : 'created_at' in entry
            ? [entry.created_at, entry.actor_name, entry.actor_email, entry.actor_role, entry.service, entry.direction, entry.action, entry.http_method, entry.route, entry.outcome, entry.response_status]
            : [],
      );
      const content = '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\r\n');
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `journal_${activeLogTab === 'rh' ? 'rh' : 'tracabilite'}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’exporter le journal.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
          <ArrowLeft size={16} aria-hidden="true" />
          Retour à l’administration
        </Link>

        <header className="mt-5 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-violet-400/15 p-3 text-violet-200">
              <ShieldCheck size={25} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">Accès superadmin</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Journal de traçabilité</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Suivi des actions API avec l’identité, le rôle, le service, la direction et l’heure enregistrés.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-5 flex gap-2 border-b border-slate-200" role="tablist" aria-label="Type de journal">
          <button
            type="button"
            role="tab"
            aria-selected={activeLogTab === 'site'}
            onClick={() => { setActiveLogTab('site'); setOffset(0); }}
            className={`border-b-2 px-4 py-3 text-sm font-bold ${activeLogTab === 'site' ? 'border-violet-700 text-violet-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Traçabilité générale
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeLogTab === 'rh'}
            onClick={() => { setActiveLogTab('rh'); setOffset(0); }}
            className={`border-b-2 px-4 py-3 text-sm font-bold ${activeLogTab === 'rh' ? 'border-violet-700 text-violet-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Opérations RH
          </button>
        </div>

        <form onSubmit={applyFilters} className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-semibold text-slate-600 lg:col-span-2">
            Recherche
            <span className="relative mt-1.5 block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nom, adresse, action ou route"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </span>
          </label>
          {activeLogTab === 'site' && <label className="text-xs font-semibold text-slate-600">
            Service
            <select
              value={serviceInput}
              onChange={(event) => setServiceInput(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              {serviceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>}
          <label className="text-xs font-semibold text-slate-600">
            Du
            <input
              type="date"
              value={fromInput}
              onChange={(event) => setFromInput(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Au
            <input
              type="date"
              value={toInput}
              onChange={(event) => setToInput(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>
          <button type="submit" className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800 lg:col-span-5 lg:justify-self-end">
            Appliquer les filtres
          </button>
        </form>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Événements de traçabilité">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold text-slate-700">
              {total.toLocaleString('fr-FR')} événement{total === 1 ? '' : 's'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={exporting || loading || total === 0}
                onClick={() => void handleExportLogs()}
                className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={16} aria-hidden="true" />
                {exporting ? 'Export…' : 'Exporter les logs'}
              </button>
              <button
                type="button"
                disabled={loading || offset === 0}
                onClick={() => setOffset((current) => Math.max(0, current - pageSize))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} aria-hidden="true" /> Précédent
              </button>
              <button
                type="button"
                disabled={loading || offset + pageSize >= total}
                onClick={() => setOffset((current) => current + pageSize)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Chargement du journal…
            </div>
          ) : (activeLogTab === 'rh' ? rhLogs.length === 0 : logs.length === 0) ? (
            <p className="p-10 text-center text-sm text-slate-500">Aucun événement pour ces filtres.</p>
          ) : activeLogTab === 'rh' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Date et heure</th>
                    <th className="px-4 py-3 font-bold">Utilisateur</th>
                    <th className="px-4 py-3 font-bold">Action</th>
                    <th className="px-4 py-3 font-bold">Employé cible</th>
                    <th className="px-4 py-3 font-bold">Détails</th>
                    <th className="px-4 py-3 font-bold">Adresse IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rhLogs.map((entry) => (
                    <tr key={entry.id} className="align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(entry.timestamp)}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{entry.user_email}</td>
                      <td className="px-4 py-4 font-mono text-xs font-bold">{entry.action}</td>
                      <td className="px-4 py-4">{entry.target_name || '—'}</td>
                      <td className="px-4 py-4 text-slate-600">{entry.details || '—'}</td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">{entry.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Date et heure</th>
                    <th className="px-4 py-3 font-bold">Acteur</th>
                    <th className="px-4 py-3 font-bold">Service / direction</th>
                    <th className="px-4 py-3 font-bold">Action</th>
                    <th className="px-4 py-3 font-bold">Résultat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((entry) => (
                    <tr key={entry.id} className="align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(entry.created_at)}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{entry.actor_name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{entry.actor_email || 'Non authentifié'} · {entry.actor_role}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">{entry.service}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{entry.direction}</p>
                      </td>
                      <td className="max-w-xl px-4 py-4">
                        <p className="font-semibold text-slate-900">{entry.action}</p>
                        <p className="mt-1 break-all font-mono text-xs text-slate-500">{entry.http_method} {entry.route}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          entry.outcome === 'succes'
                            ? 'bg-emerald-50 text-emerald-700'
                            : entry.outcome === 'echec'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {entry.outcome === 'succes' ? 'Réussi' : entry.outcome === 'echec' ? 'Échec' : 'En cours'}
                          {entry.response_status ? ` · ${entry.response_status}` : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Les événements sont conservés même si le compte correspondant est supprimé. Les requêtes en cours peuvent signaler une interruption serveur.
        </p>
      </div>
    </main>
  );
}
