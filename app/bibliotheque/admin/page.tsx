'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, BookOpen, Download, FileSpreadsheet, LoaderCircle, Plus, Search, ShieldCheck, Trash2, Upload, Users } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { isSuperAdminRole } from '@/lib/roles';
import StatusAnimation from '@/components/StatusAnimation';

type AdminBook = {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  language: string;
  edition: string;
  pageCount: number;
  downloadCount: number;
  legacyFileName: string | null;
};

type Stats = {
  books: number;
  users: number;
  downloads: number;
};

export default function LibraryAdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const params = new URLSearchParams({ q: search.trim(), limit: '48', sort: 'date', page: String(page), admin: '1' });
      const [catalogResponse, statsResponse] = await Promise.all([
        fetch(`/api/library/books?${params}`, { cache: 'no-store' }),
        fetch('/api/library/admin', { cache: 'no-store' }),
      ]);
      const [catalog, summary] = await Promise.all([
        catalogResponse.json().catch(() => ({})),
        statsResponse.json().catch(() => ({})),
      ]);
      if (!catalogResponse.ok) throw new Error(catalog.error || 'Impossible de charger le catalogue.');
      if (!statsResponse.ok) throw new Error(summary.error || 'Impossible de charger les statistiques.');
      setBooks(catalog.books || []);
      setPageCount(catalog.pageCount || 1);
      setSelectedIds([]);
      setStats(summary.stats || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la bibliothèque.');
    } finally {
      setBusy(false);
    }
  }, [page, search]);

  useEffect(() => {
    void authClient.auth.getSession().then(({ data }) => {
      if (!isSuperAdminRole(data.session?.user.app_metadata?.role)) {
        window.location.assign('/candidat');
        return;
      }
      setAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (authorized) void loadData();
  }, [authorized, loadData]);

  const createBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/library/books', { method: 'POST', body: new FormData(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de publier cet ouvrage.');
      form.reset();
      setNotice('L’ouvrage a été ajouté au catalogue.');
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible de publier cet ouvrage.');
    } finally {
      setSaving(false);
    }
  };

  const importBooks = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setImporting(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/library/admin/import', { method: 'POST', body: new FormData(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible d’importer ce fichier.');
      form.reset();
      setNotice(`Import terminé : ${data.inserted} ajouté(s), ${data.updated} mis à jour.`);
      await loadData();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Impossible d’importer ce fichier.');
    } finally {
      setImporting(false);
    }
  };

  const editBook = async (event: FormEvent<HTMLFormElement>, book: AdminBook) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      formData.set('id', book.id);
      const response = await fetch('/api/library/books', { method: 'PATCH', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de modifier cet ouvrage.');
      setNotice(data.warning || 'Les informations du livre ont été mises à jour.');
      await loadData();
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'Impossible de modifier cet ouvrage.');
    } finally {
      setSaving(false);
    }
  };

  const importSourceBooks = async () => {
    setImporting(true);
    setError('');
    setNotice('');
    try {
      const form = new FormData();
      form.set('source', 'repository');
      const response = await fetch('/api/library/admin/import', { method: 'POST', body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de synchroniser les livres source.');
      setNotice(`Synchronisation terminée : ${data.inserted} ajouté(s), ${data.updated} mis à jour${data.skippedMissing ? `, ${data.skippedMissing} PDF absent(s) ignoré(s)` : ''}.`);
      await loadData();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Impossible de synchroniser les livres source.');
    } finally {
      setImporting(false);
    }
  };

  const deleteBook = async (book: AdminBook) => {
    if (!window.confirm(`Supprimer « ${book.title} » du catalogue et ses fichiers associés ? Cette action est définitive.`)) return;
    setError('');
    try {
      const response = await fetch(`/api/library/books?id=${encodeURIComponent(book.id)}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de supprimer cet ouvrage.');
      setNotice(data.warning || 'L’ouvrage a été supprimé avec ses fichiers associés.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer cet ouvrage.');
    }
  };

  const deleteSelectedBooks = async () => {
    if (!selectedIds.length || !window.confirm(`Supprimer les ${selectedIds.length} ouvrages sélectionnés ? Cette action est définitive.`)) return;
    setError('');
    setSaving(true);
    try {
      const params = new URLSearchParams();
      selectedIds.forEach((id) => params.append('id', id));
      const response = await fetch(`/api/library/books?${params}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de supprimer ces ouvrages.');
      setNotice(data.warning || `${data.deleted} ouvrage(s) supprimé(s).`);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer ces ouvrages.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelected = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((value) => value !== id));
    } else if (selectedIds.length >= 100) {
      setError('Vous pouvez sélectionner 100 ouvrages maximum à la fois.');
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const togglePageSelection = () => {
    const pageIds = books.map((book) => book.id);
    if (pageIds.every((id) => selectedIds.includes(id))) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
      return;
    }
    const next = [...new Set([...selectedIds, ...pageIds])];
    if (next.length > 100) {
      setError('Vous pouvez sélectionner 100 ouvrages maximum à la fois.');
      return;
    }
    setSelectedIds(next);
  };

  if (!authorized) {
    return <main className="grid min-h-[60vh] place-items-center bg-slate-50"><LoaderCircle className="animate-spin text-cyan-800" size={30} aria-label="Vérification des droits" /></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> Bibliothèque</Link>
          <div className="mt-4 flex items-center gap-3"><ShieldCheck size={25} className="text-amber-300" aria-hidden="true" /><h1 className="text-3xl font-black">Administration de la bibliothèque</h1></div>
          <p className="mt-2 text-sm text-slate-300">Gérez tous les ouvrages, y compris les PDF présents dans les fichiers source du serveur.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {error && <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
        {stats && (
          <section aria-label="Statistiques" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Ouvrages', value: stats.books, icon: BookOpen },
              { label: 'Comptes du site', value: stats.users, icon: Users },
              { label: 'Téléchargements', value: stats.downloads, icon: Download },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 border border-slate-200 bg-white p-4 shadow-sm">
                <Icon size={20} className="text-cyan-800" aria-hidden="true" />
                <div><p className="text-xl font-black">{Number(value).toLocaleString('fr-FR')}</p><p className="text-xs text-slate-500">{label}</p></div>
              </div>
            ))}
          </section>
        )}

        <section className="border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2 text-xl font-bold"><FileSpreadsheet size={19} aria-hidden="true" /> Livres des fichiers source</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            Synchronisez les ouvrages déjà présents dans le dépôt et leurs métadonnées. Ils seront ajoutés à la liste ci-dessous,
            où vous pourrez modifier leurs informations ou remplacer et supprimer leurs PDF.
          </p>
          <button type="button" onClick={() => void importSourceBooks()} disabled={importing || saving} className="mt-4 inline-flex min-h-11 items-center gap-2 bg-cyan-800 px-5 font-bold text-white hover:bg-cyan-900 disabled:opacity-50">
            {importing ? <LoaderCircle size={16} className="animate-spin" /> : <FileSpreadsheet size={16} aria-hidden="true" />}
            Synchroniser les fichiers source
          </button>
          <h3 className="mt-6 border-t border-cyan-200 pt-5 text-lg font-bold">Importer un autre fichier CSV</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            Les PDF et couvertures correspondant aux noms du CSV doivent déjà être présents sur le serveur.
          </p>
          <form onSubmit={(event) => void importBooks(event)} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block text-sm font-semibold">Fichier CSV (1 Mo maximum)
              <input name="file" type="file" accept=".csv,text/csv" required className="mt-2 block w-full text-sm font-normal" />
            </label>
            <button type="submit" disabled={importing || saving} className="inline-flex min-h-11 items-center gap-2 bg-cyan-800 px-5 font-bold text-white hover:bg-cyan-900 disabled:opacity-50">
              {importing ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} aria-hidden="true" />}
              {importing ? 'Import en cours…' : 'Importer le CSV'}
            </button>
          </form>
        </section>

        <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Plus size={19} aria-hidden="true" /> Ajouter un ouvrage</h2>
          <form onSubmit={createBook} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold">Titre *<input name="title" required maxLength={300} className="mt-1 min-h-11 w-full border border-slate-300 px-3 font-normal" /></label>
            <label className="text-sm font-semibold">Auteur<input name="author" maxLength={200} className="mt-1 min-h-11 w-full border border-slate-300 px-3 font-normal" /></label>
            <label className="text-sm font-semibold">Catégorie<input name="category" maxLength={120} className="mt-1 min-h-11 w-full border border-slate-300 px-3 font-normal" /></label>
            <label className="text-sm font-semibold">Langue<input name="language" maxLength={80} className="mt-1 min-h-11 w-full border border-slate-300 px-3 font-normal" /></label>
            <label className="text-sm font-semibold">Édition<input name="edition" maxLength={120} className="mt-1 min-h-11 w-full border border-slate-300 px-3 font-normal" /></label>
            <label className="text-sm font-semibold">Nombre de pages<input name="pageCount" type="number" min="0" max="100000" defaultValue="0" className="mt-1 min-h-11 w-full border border-slate-300 px-3 font-normal" /></label>
            <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">Description<textarea name="description" rows={3} maxLength={12000} className="mt-1 w-full border border-slate-300 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-semibold">PDF (50 Mo maximum) *<input name="file" type="file" accept="application/pdf,.pdf" required className="mt-2 block w-full text-sm font-normal" /></label>
            <label className="text-sm font-semibold">Couverture facultative<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm font-normal" /></label>
            <div className="flex items-end"><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 bg-cyan-800 px-5 font-bold text-white hover:bg-cyan-900 disabled:opacity-50">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} aria-hidden="true" />} Publier dans le catalogue</button></div>
          </form>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-xl font-bold">Gérer les ouvrages</h2><p className="mt-1 text-sm text-slate-600">48 ouvrages par page.</p></div>
            <label className="relative block w-full sm:max-w-sm"><span className="sr-only">Rechercher un livre</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setSelectedIds([]); }} placeholder="Titre, auteur, description…" className="min-h-11 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm" /></label>
          </div>
          {busy ? <div className="grid min-h-40 place-items-center"><StatusAnimation label="Chargement des ouvrages" /></div> : (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white p-3">
                <label className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={books.length > 0 && books.every((book) => selectedIds.includes(book.id))} onChange={togglePageSelection} />
                  Sélectionner cette page
                </label>
                <button type="button" disabled={!selectedIds.length || saving} onClick={() => void deleteSelectedBooks()} className="inline-flex min-h-10 items-center gap-2 border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-40">
                  <Trash2 size={15} aria-hidden="true" /> Supprimer la sélection ({selectedIds.length})
                </button>
              </div>
              {books.map((book) => (
                <details key={book.id} className="border border-slate-200 bg-white shadow-sm">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
                    <span className="flex items-center gap-3"><input type="checkbox" aria-label={`Sélectionner ${book.title}`} checked={selectedIds.includes(book.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleSelected(book.id)} /><span><strong>{book.title}</strong><span className="ml-2 text-sm text-slate-500">{book.author || 'Auteur inconnu'}</span></span></span>
                    <span className="flex items-center gap-3 text-xs text-slate-500">{book.downloadCount} téléchargements</span>
                  </summary>
                  <form onSubmit={(event) => void editBook(event, book)} className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {book.legacyFileName && <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-3">PDF source : {book.legacyFileName}</p>}
                    <label className="text-xs font-semibold">Titre<input name="title" required defaultValue={book.title} maxLength={300} className="mt-1 min-h-10 w-full border border-slate-300 px-2 text-sm font-normal" /></label>
                    <label className="text-xs font-semibold">Auteur<input name="author" defaultValue={book.author} maxLength={200} className="mt-1 min-h-10 w-full border border-slate-300 px-2 text-sm font-normal" /></label>
                    <label className="text-xs font-semibold">Catégorie<input name="category" defaultValue={book.category} maxLength={120} className="mt-1 min-h-10 w-full border border-slate-300 px-2 text-sm font-normal" /></label>
                    <label className="text-xs font-semibold">Langue<input name="language" defaultValue={book.language} maxLength={80} className="mt-1 min-h-10 w-full border border-slate-300 px-2 text-sm font-normal" /></label>
                    <label className="text-xs font-semibold">Édition<input name="edition" defaultValue={book.edition} maxLength={120} className="mt-1 min-h-10 w-full border border-slate-300 px-2 text-sm font-normal" /></label>
                    <label className="text-xs font-semibold">Pages<input name="pageCount" type="number" min="0" max="100000" defaultValue={book.pageCount} className="mt-1 min-h-10 w-full border border-slate-300 px-2 text-sm font-normal" /></label>
                    <label className="text-xs font-semibold sm:col-span-2 lg:col-span-3">Description<textarea name="description" rows={2} defaultValue={book.description} maxLength={12000} className="mt-1 w-full border border-slate-300 px-2 py-2 text-sm font-normal" /></label>
                    <label className="text-xs font-semibold">Remplacer le PDF (50 Mo max)<input name="file" type="file" accept="application/pdf,.pdf" className="mt-1 block w-full text-sm font-normal" /></label>
                    <label className="text-xs font-semibold">Remplacer la couverture (JPG, PNG ou WebP, 5 Mo max)<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm font-normal" /></label>
                    <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                      <button type="submit" disabled={saving} className="min-h-10 bg-cyan-800 px-4 text-sm font-bold text-white disabled:opacity-50">Enregistrer</button>
                      <button type="button" onClick={() => void deleteBook(book)} className="inline-flex min-h-10 items-center gap-2 border border-red-200 px-4 text-sm font-bold text-red-700 hover:bg-red-50"><Trash2 size={15} aria-hidden="true" /> Supprimer</button>
                    </div>
                  </form>
                </details>
              ))}
              {!books.length && <p className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Aucun ouvrage trouvé.</p>}
              {pageCount > 1 && <nav aria-label="Pagination de l’administration" className="flex items-center justify-center gap-4 py-3">
                <button type="button" onClick={() => { setPage((value) => Math.max(1, value - 1)); setSelectedIds([]); }} disabled={page <= 1 || busy} className="min-h-10 border border-slate-300 px-4 text-sm font-semibold disabled:opacity-40">Précédent</button>
                <span className="text-sm text-slate-600">Page {page} sur {pageCount}</span>
                <button type="button" onClick={() => { setPage((value) => Math.min(pageCount, value + 1)); setSelectedIds([]); }} disabled={page >= pageCount || busy} className="min-h-10 border border-slate-300 px-4 text-sm font-semibold disabled:opacity-40">Suivant</button>
              </nav>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
