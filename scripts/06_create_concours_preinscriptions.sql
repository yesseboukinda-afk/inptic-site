-- Préinscriptions aux concours INPTIC.
CREATE TABLE IF NOT EXISTS public.concours_preinscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concours_slug TEXT NOT NULL REFERENCES public.concours(slug) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'nouvelle'
    CHECK (status IN ('nouvelle', 'contactee', 'convertie', 'annulee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (concours_slug, email)
);

CREATE INDEX IF NOT EXISTS idx_concours_preinscriptions_created_at
  ON public.concours_preinscriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concours_preinscriptions_status
  ON public.concours_preinscriptions(status);

ALTER TABLE public.concours_preinscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.concours_preinscriptions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.concours_preinscriptions TO service_role;