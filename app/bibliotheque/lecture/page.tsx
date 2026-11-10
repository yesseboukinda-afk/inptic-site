'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, LoaderCircle, Save } from 'lucide-react';

type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  pageCount: number;
  currentPage: number;
  progressPages: number;
};

export default function LibraryReaderPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id') || '';
    if (!/^[1-9]\d{0,17}$/.test(id)) {
      setError('Identifiant de livre invalide.');
      setBusy(false);
      return;
    }
    let active = true;
    void fetch(`/api/library/books?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Livre indisponible.');
        if (!active) return;
        const item = data.book as Book;
        setBook(item);
        setPage(item.currentPage || 1);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Livre indisponible.');
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  const saveProgress = async () => {
    if (!book) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/library/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'progress', bookId: book.id, currentPage: page, totalPages: book.pageCount }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible d’enregistrer la progression.');
      setBook({ ...book, currentPage: page, progressPages: book.pageCount });
      setNotice('Votre position de lecture a été enregistrée.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Connectez-vous pour enregistrer votre progression.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-7">
        <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white">
          <ArrowLeft size={17} aria-hidden="true" /> Retour au catalogue
        </Link>
        {book && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Page
              <input
                type="number"
                min={1}
                max={book.pageCount || undefined}
                value={page}
                onChange={(event) => setPage(Math.max(1, Number(event.target.value) || 1))}
                className="w-20 border border-white/20 bg-slate-900 px-2 py-1.5 text-white"
                aria-label="Page à afficher"
              />
              {book.pageCount > 0 && <span>sur {book.pageCount}</span>}
            </label>
            <button type="button" onClick={() => void saveProgress()} disabled={saving} className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">
              {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} aria-hidden="true" />}
              Enregistrer ma position
            </button>
            <a href={`/api/library/file?id=${encodeURIComponent(book.id)}&download=1`} className="inline-flex items-center gap-2 bg-cyan-700 px-3 py-2 text-sm font-bold hover:bg-cyan-600">
              <Download size={15} aria-hidden="true" /> Télécharger
            </a>
          </div>
        )}
      </header>

      {book && (
        <div className="border-b border-white/10 px-4 py-3 sm:px-7">
          <h1 className="truncate text-lg font-bold">{book.title}</h1>
          <p className="text-sm text-slate-400">{book.author || 'Auteur inconnu'}</p>
        </div>
      )}
      {error && <p role="alert" className="mx-4 mt-4 border border-red-300/30 bg-red-950 p-3 text-sm text-red-100 sm:mx-7">{error}</p>}
      {notice && <p role="status" className="mx-4 mt-4 border border-emerald-300/30 bg-emerald-950 p-3 text-sm text-emerald-100 sm:mx-7">{notice}</p>}
      {busy ? (
        <div className="grid min-h-[70vh] place-items-center"><LoaderCircle className="animate-spin text-cyan-300" size={32} aria-label="Chargement du livre" /></div>
      ) : book ? (
        <iframe
          key={`${book.id}-${page}`}
          title={`Lecture : ${book.title}`}
          src={`/api/library/file?id=${encodeURIComponent(book.id)}#page=${page}`}
          className="h-[calc(100vh-9.5rem)] min-h-[32rem] w-full border-0 bg-slate-800"
        />
      ) : null}
    </main>
  );
}
