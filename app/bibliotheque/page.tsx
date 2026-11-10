'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Library, LoaderCircle, ShieldCheck } from 'lucide-react';
import LibraryBookCard, { type LibraryBookCardData } from '@/components/library/LibraryBookCard';
import { authClient } from '@/lib/auth-client';
import { isAdminRole } from '@/lib/roles';

type CatalogResponse = {
  books: LibraryBookCardData[];
  featuredBooks: LibraryBookCardData[];
  total: number;
  totalPublicBooks: number;
  totalDownloads: number;
  page: number;
  pageCount: number;
  categories: string[];
  languages: string[];
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function LibraryPage() {
  const [result, setResult] = useState<CatalogResponse>({
    books: [], featuredBooks: [], total: 0, totalPublicBooks: 0, totalDownloads: 0, page: 1, pageCount: 1, categories: [], languages: [],
  });
  const [initial, setInitial] = useState('ALL');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  const loadCatalog = useCallback(async (signal: AbortSignal) => {
    setBusy(true);
    setError('');
    const params = new URLSearchParams({ sort: 'title', page: String(page), limit: '24' });
    if (initial !== 'ALL') params.set('initial', initial);
    try {
      const response = await fetch(`/api/library/books?${params}`, { cache: 'no-store', signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Le catalogue est indisponible.');
      setResult(data as CatalogResponse);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === 'AbortError') return;
      setError(loadError instanceof Error ? loadError.message : 'Le catalogue est indisponible.');
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }, [initial, page]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadCatalog(controller.signal), 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadCatalog]);

  useEffect(() => {
    void authClient.auth.getSession().then(({ data }) => setHasAdminAccess(isAdminRole(data.session?.user.app_metadata?.role)));
  }, []);

  const updateInteraction = async (action: 'favorite' | 'like' | 'collection', book: LibraryBookCardData) => {
    setNotice('');
    try {
      const response = await fetch('/api/library/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bookId: book.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible d’enregistrer cette action.');
      if (action === 'collection') {
        setNotice(data.added ? 'Livre ajouté à votre bibliothèque personnelle.' : 'Ce livre est déjà dans votre bibliothèque.');
      } else {
        setResult((current) => ({
          ...current,
          books: current.books.map((item) => item.id !== book.id ? item : {
            ...item,
            ...(action === 'favorite' ? { isFavorite: Boolean(data.active) } : {
              isLiked: Boolean(data.active),
              likesCount: Number(data.likesCount) || 0,
            }),
          }),
        }));
      }
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : 'Connectez-vous pour enregistrer vos livres.');
    }
  };

  const booksByInitial = result.books.reduce<Record<string, LibraryBookCardData[]>>((groups, book) => {
    const firstCharacter = book.title.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
    const group = /^[A-Z]$/.test(firstCharacter) ? firstCharacter : '#';
    (groups[group] ||= []).push(book);
    return groups;
  }, {});
  const initialOrder = initial === 'ALL'
    ? [...ALPHABET, '#'].filter((letter) => booksByInitial[letter]?.length)
    : [initial];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 border border-cyan-300/30 bg-cyan-200/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">
                <Library size={16} aria-hidden="true" /> Ressources documentaires INPTIC
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">La bibliothèque numérique</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
                Explorez les ouvrages, partagez vos ressources et reprenez votre lecture depuis votre espace personnel.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/bibliotheque/mon-espace" className="inline-flex min-h-11 items-center gap-2 border border-white/30 px-4 py-2.5 text-sm font-bold hover:bg-white/10">
                <BookOpen size={17} aria-hidden="true" /> Mon espace
              </Link>
              {hasAdminAccess && (
                <Link href="/bibliotheque/admin" className="inline-flex min-h-11 items-center gap-2 bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300">
                  <ShieldCheck size={17} aria-hidden="true" /> Administration
                </Link>
              )}
            </div>
          </div>
          <div className="mt-8 inline-flex items-center gap-2 border-t border-white/20 pt-4 text-sm text-cyan-100">
            <BookOpen size={16} aria-hidden="true" />
            {result.totalPublicBooks.toLocaleString('fr-FR')} ouvrages · {result.totalDownloads.toLocaleString('fr-FR')} téléchargements
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Filtrer les livres par initiale" className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 pb-2">
          {[...ALPHABET, '#', 'ALL'].map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => { setInitial(letter); setPage(1); }}
              aria-pressed={initial === letter}
              className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-all duration-200 hover:z-10 hover:scale-125 hover:bg-cyan-600 hover:text-white hover:shadow-[0_0_16px_rgba(6,182,212,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
                initial === letter
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-100 text-slate-600 hover:bg-gradient-to-br hover:from-cyan-400 hover:to-blue-600'
              }`}
            >
              {letter}
            </button>
          ))}
        </nav>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600"><strong className="text-slate-900">{result.total}</strong> ouvrage{result.total === 1 ? '' : 's'} dans le catalogue</p>
          {notice && <p role="status" className="text-sm font-medium text-cyan-900">{notice}</p>}
        </div>
        {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {busy ? (
          <div className="grid min-h-52 place-items-center"><LoaderCircle className="animate-spin text-cyan-800" size={30} aria-label="Chargement du catalogue" /></div>
        ) : result.books.length ? (
          <div className="mt-5 space-y-8">
            {initialOrder.map((letter) => (
              <section key={letter} aria-labelledby={`books-${letter}`}>
                <h2 id={`books-${letter}`} className="border-b border-slate-200 pb-2 text-lg font-bold text-cyan-600">
                  {letter}
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {booksByInitial[letter]?.map((book) => (
                    <LibraryBookCard
                      key={book.id}
                      book={book}
                      layout="catalog"
                      onFavorite={(item) => void updateInteraction('favorite', item)}
                      onLike={(item) => void updateInteraction('like', item)}
                      onAddToCollection={(item) => void updateInteraction('collection', item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-5 border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BookOpen size={36} className="mx-auto text-slate-400" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold">Aucun ouvrage trouvé</h2>
            <p className="mt-1 text-sm text-slate-600">Essayez une autre recherche ou modifiez les filtres.</p>
          </div>
        )}

        {result.pageCount > 1 && (
          <nav aria-label="Pagination du catalogue" className="mt-8 flex items-center justify-center gap-4">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || busy} className="min-h-10 border border-slate-300 px-4 text-sm font-semibold disabled:opacity-40">Précédent</button>
            <span className="text-sm text-slate-600">Page {page} sur {result.pageCount}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(result.pageCount, value + 1))} disabled={page >= result.pageCount || busy} className="inline-flex min-h-10 items-center gap-1 border border-slate-300 px-4 text-sm font-semibold disabled:opacity-40">Suivant <ArrowRight size={14} aria-hidden="true" /></button>
          </nav>
        )}
      </section>
    </main>
  );
}
