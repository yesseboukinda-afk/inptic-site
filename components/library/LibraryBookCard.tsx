'use client';

import Link from 'next/link';
import { BookOpen, Download } from 'lucide-react';
import { useState } from 'react';
import LibraryDownloadButton from './LibraryDownloadButton';

export type LibraryBookCardData = {
  id: string;
  title: string;
  author: string;
  category: string;
  language: string;
  pageCount: number;
  downloadCount: number;
  currentPage: number;
  progressPages: number;
};

type Props = {
  book: LibraryBookCardData;
  layout?: 'default' | 'catalog';
};

export default function LibraryBookCard({
  book,
  layout = 'default',
}: Props) {
  const [coverAvailable, setCoverAvailable] = useState(true);
  const progress = book.progressPages > 0
    ? Math.min(100, Math.round((book.currentPage / book.progressPages) * 100))
    : 0;

  if (layout === 'catalog') {
    return (
      <article className="library-book-catalog-card min-w-0 text-center">
        <div className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900 shadow-sm">
          <Link href={`/bibliotheque/lecture?id=${encodeURIComponent(book.id)}`} className="absolute inset-0" aria-label={`Lire ${book.title}`}>
            {coverAvailable ? (
              <img
                src={`/api/library/cover?id=${encodeURIComponent(book.id)}`}
                alt=""
                loading="lazy"
                onError={() => setCoverAvailable(false)}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="grid h-full place-items-center"><BookOpen size={42} className="text-cyan-100/80" aria-hidden="true" /></span>
            )}
          </Link>
          <div className="library-book-catalog-action library-book-catalog-actions absolute bottom-2 right-2 z-10 flex gap-1 rounded-sm bg-white/90 p-1 shadow-sm sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <LibraryDownloadButton
              href={`/api/library/file?id=${encodeURIComponent(book.id)}&download=1`}
              filename={`${book.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || 'livre'}.pdf`}
              title={book.title}
              aria-label={`Télécharger ${book.title}`}
              className="library-book-catalog-action-button rounded-sm p-1 text-slate-500 hover:text-cyan-800"
            >
              <Download size={14} aria-hidden="true" />
            </LibraryDownloadButton>
          </div>
        </div>
        <Link href={`/bibliotheque/lecture?id=${encodeURIComponent(book.id)}`} className="group block px-1">
          <h3 className="mt-2 truncate text-xs font-bold text-slate-800 group-hover:text-cyan-800 sm:text-sm" title={book.title}>{book.title}</h3>
          <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs" title={book.author || 'Auteur inconnu'}>{book.author || 'Auteur inconnu'}</p>
        </Link>
      </article>
    );
  }

  return (
    <article className="library-book-standard-card overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/bibliotheque/lecture?id=${encodeURIComponent(book.id)}`} className="group block">
        <div className="relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900">
          {coverAvailable && (
            <img
              src={`/api/library/cover?id=${encodeURIComponent(book.id)}`}
              alt=""
              loading="lazy"
              onError={() => setCoverAvailable(false)}
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          )}
          {!coverAvailable && <BookOpen size={52} className="text-cyan-100/80" aria-hidden="true" />}
          <span className="absolute bottom-3 left-3 bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800">
            {book.category || 'Ouvrage'}
          </span>
        </div>
        <div className="p-4">
          <h2 className="line-clamp-2 min-h-12 text-base font-bold text-slate-900 group-hover:text-cyan-800">{book.title}</h2>
          <p className="mt-1 truncate text-sm text-slate-600">{book.author || 'Auteur inconnu'}</p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            {book.language && <span>{book.language}</span>}
            {book.pageCount > 0 && <span>{book.pageCount} pages</span>}
          </div>
          {progress > 0 && (
            <div className="mt-3" aria-label={`Progression de lecture ${progress} pour cent`}>
              <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                <span>Reprendre la lecture</span><span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100"><div className="h-1.5 bg-cyan-700" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
        </div>
      </Link>
      <div className="library-book-standard-actions flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><Download size={13} aria-hidden="true" />{book.downloadCount}</span>
        </div>
        <div>
          <LibraryDownloadButton
            href={`/api/library/file?id=${encodeURIComponent(book.id)}&download=1`}
            filename={`${book.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || 'livre'}.pdf`}
            title={book.title}
            className="inline-flex items-center gap-1.5 bg-cyan-800 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-900"
          >
            <Download size={14} aria-hidden="true" /> Télécharger
          </LibraryDownloadButton>
        </div>
      </div>
    </article>
  );
}
