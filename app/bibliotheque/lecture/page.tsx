'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, Download, LoaderCircle } from 'lucide-react';
import LibraryPdfViewer from '@/components/library/LibraryPdfViewer';
import StatusAnimation from '@/components/StatusAnimation';
import LibraryDownloadButton from '@/components/library/LibraryDownloadButton';

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
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [busy, setBusy] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pageCount = pdfPageCount || book?.pageCount || 0;

  const handlePageCountChange = useCallback((count: number) => {
    setPdfPageCount(count);
    setPage((current) => Math.min(current, count));
  }, []);

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

  const markPage = async () => {
    if (!book) return;
    setMarking(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/library/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'progress', bookId: book.id, currentPage: page, totalPages: pageCount }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible d’enregistrer la progression.');
      setBook({ ...book, currentPage: page, progressPages: pageCount });
      setNotice(`La page ${page} a été ajoutée à vos marque-pages.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Connectez-vous pour marquer cette page.');
    } finally {
      setMarking(false);
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
                max={pageCount || undefined}
                value={page}
                onChange={(event) => {
                  const requestedPage = Math.max(1, Number(event.target.value) || 1);
                  setPage(pageCount ? Math.min(requestedPage, pageCount) : requestedPage);
                }}
                className="w-20 border border-white/20 bg-slate-900 px-2 py-1.5 text-white"
                aria-label="Page à afficher"
              />
              {pageCount > 0 && <span>sur {pageCount}</span>}
            </label>
            <button type="button" onClick={() => void markPage()} disabled={marking} className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">
              {marking ? <LoaderCircle size={15} className="animate-spin" /> : <Bookmark size={15} aria-hidden="true" />}
              Marquer cette page
            </button>
            <LibraryDownloadButton
              href={`/api/library/file?id=${encodeURIComponent(book.id)}&download=1`}
              filename={`${book.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || 'livre'}.pdf`}
              title={book.title}
              className="inline-flex items-center gap-2 bg-cyan-700 px-3 py-2 text-sm font-bold hover:bg-cyan-600"
            >
              <Download size={15} aria-hidden="true" /> Télécharger
            </LibraryDownloadButton>
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
        <div className="grid min-h-[70vh] place-items-center"><StatusAnimation label="Chargement du livre" /></div>
      ) : book ? (
        <LibraryPdfViewer
          src={`/api/library/file?id=${encodeURIComponent(book.id)}`}
          page={page}
          onPageChange={setPage}
          onPageCountChange={handlePageCountChange}
        />
      ) : null}
    </main>
  );
}
