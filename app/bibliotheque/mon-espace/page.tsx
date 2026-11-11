'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Trash2 } from 'lucide-react';
import LibraryBookCard, { type LibraryBookCardData } from '@/components/library/LibraryBookCard';
import StatusAnimation from '@/components/StatusAnimation';

export default function PersonalLibraryPage() {
  const [books, setBooks] = useState<LibraryBookCardData[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const loadBooks = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const booksResponse = await fetch('/api/library/my-books', { cache: 'no-store' });
      const data = await booksResponse.json().catch(() => ({}));
      if (!booksResponse.ok) throw new Error(data.error || 'Impossible de charger votre bibliothèque.');
      setBooks(data.collection as LibraryBookCardData[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger votre bibliothèque.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void loadBooks(); }, [loadBooks]);

  const removeBook = async (book: LibraryBookCardData) => {
    if (!window.confirm(`Retirer « ${book.title} » de votre collection ?`)) return;
    setError('');
    try {
      const response = await fetch(`/api/library/my-books?id=${encodeURIComponent(book.id)}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible de retirer ce livre.');
      await loadBooks();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Impossible de retirer ce livre.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> Catalogue</Link>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">Mon espace bibliothèque</h1>
          <p className="mt-2 text-sm text-slate-300">Retrouvez les ouvrages de votre collection et votre progression de lecture.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <h2 className="border-b border-slate-200 pb-3 text-lg font-bold">Ma collection ({books.length})</h2>
          {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {busy ? (
            <div className="grid min-h-48 place-items-center"><StatusAnimation label="Chargement de votre collection" /></div>
          ) : books.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {books.map((book) => (
                <div key={book.id} className="relative">
                  <LibraryBookCard book={book} />
                  <button type="button" onClick={() => void removeBook(book)} aria-label={`Retirer ${book.title} de ma collection`} className="absolute right-2 top-2 bg-white p-2 text-slate-600 shadow hover:text-red-700">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-slate-300 bg-white p-10 text-center">
              <BookOpen size={32} className="mx-auto text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm text-slate-600">Votre collection est encore vide.</p>
              <Link href="/bibliotheque" className="mt-4 inline-flex text-sm font-bold text-cyan-800 hover:underline">Explorer les ouvrages</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
