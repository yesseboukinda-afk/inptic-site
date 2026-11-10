-- Native PostgreSQL schema for the Next.js library.
-- Run after scripts/12_lws_auth_storage_foundation.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.library_books (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 300),
  author TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT '',
  edition TEXT NOT NULL DEFAULT '',
  page_count INTEGER NOT NULL DEFAULT 0 CHECK (page_count >= 0),
  legacy_file_name TEXT,
  file_path TEXT,
  legacy_cover_name TEXT,
  cover_path TEXT,
  download_count BIGINT NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  likes_count BIGINT NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  owner_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT library_books_file_location CHECK (
    (legacy_file_name IS NOT NULL AND file_path IS NULL)
    OR (legacy_file_name IS NULL AND file_path IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS library_books_public_created_idx
  ON public.library_books(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS library_books_category_idx
  ON public.library_books(category);
CREATE INDEX IF NOT EXISTS library_books_language_idx
  ON public.library_books(language);
CREATE INDEX IF NOT EXISTS library_books_downloads_idx
  ON public.library_books(download_count DESC);
CREATE INDEX IF NOT EXISTS library_books_likes_idx
  ON public.library_books(likes_count DESC);
CREATE INDEX IF NOT EXISTS library_books_title_search_idx
  ON public.library_books(LOWER(title));

CREATE TABLE IF NOT EXISTS public.library_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  avatar_path TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.library_user_books (
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS public.library_favorites (
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS public.library_likes (
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS public.library_reading_progress (
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  current_page INTEGER NOT NULL DEFAULT 1 CHECK (current_page > 0),
  total_pages INTEGER NOT NULL DEFAULT 0 CHECK (total_pages >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS library_user_books_user_created_idx
  ON public.library_user_books(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS library_favorites_user_created_idx
  ON public.library_favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS library_likes_user_created_idx
  ON public.library_likes(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.library_books, public.library_user_books,
  public.library_profiles, public.library_favorites, public.library_likes,
  public.library_reading_progress
TO "c1668531c_inptic-site";
GRANT USAGE, SELECT ON SEQUENCE public.library_books_id_seq TO "c1668531c_inptic-site";

COMMIT;
