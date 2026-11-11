import type { LibraryBook } from './library';

export type LibraryFileCatalogOptions = {
  search?: string;
  category?: string;
  language?: string;
  author?: string;
  initial?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export function getLibraryFileCatalog(): Promise<LibraryBook[]>;
export function getLibraryFileBook(books: LibraryBook[], id: string): LibraryBook | null;
export function filterLibraryFileCatalog(
  books: LibraryBook[],
  options?: LibraryFileCatalogOptions,
): {
  books: LibraryBook[];
  featuredBooks: LibraryBook[];
  total: number;
  totalPublicBooks: number;
  totalDownloads: number;
  page: number;
  pageCount: number;
  categories: string[];
  languages: string[];
};
export function isLibraryDatabaseUnavailable(error: unknown): boolean;
export function shouldUseLibraryFileCatalog(): boolean;
export function shouldFallbackToLibraryFiles(): boolean;
