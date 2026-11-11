-- Allow public likes while keeping one like per anonymous browser and book.
BEGIN;

CREATE TABLE IF NOT EXISTS public.library_guest_likes (
  visitor_id UUID NOT NULL,
  book_id BIGINT NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (visitor_id, book_id)
);

CREATE INDEX IF NOT EXISTS library_guest_likes_book_idx
  ON public.library_guest_likes(book_id);

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.library_guest_likes
TO "c1668531c_inptic-site";

COMMIT;
