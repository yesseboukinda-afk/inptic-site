CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.training_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'video')),
  resource_url TEXT NOT NULL,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_training_catalog_publication
  ON public.training_catalog(status, created_at DESC);

ALTER TABLE public.training_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.training_catalog FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_catalog TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('formations-catalogue', 'formations-catalogue', true, 15728640)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Lecture publique des ressources formations" ON storage.objects;
CREATE POLICY "Lecture publique des ressources formations"/me/accounts?fields=id,name,access_token,tasks
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'formations-catalogue');

DROP POLICY IF EXISTS "Upload admin des ressources formations" ON storage.objects;
CREATE POLICY "Upload admin des ressources formations"
  ON storage.objects FOR INSERT
  TO authenticated, service_role
  WITH CHECK (bucket_id = 'formations-catalogue');