-- Store the public pages targeted by each announcement.
ALTER TABLE public.actualites
  ADD COLUMN IF NOT EXISTS target_pages TEXT[]
  NOT NULL DEFAULT ARRAY['actualites', 'annonces']::TEXT[];

CREATE INDEX IF NOT EXISTS idx_actualites_target_pages
  ON public.actualites USING GIN (target_pages);