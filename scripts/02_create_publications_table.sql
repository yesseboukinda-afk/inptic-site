-- ============================================================
-- SCRIPT SUPABASE : TABLE PUBLICATIONS SCIENTIFIQUES
-- Compatible Supabase SQL Editor (PostgreSQL 15+)
-- ============================================================

-- 1. Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fonction de mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Création de la table `publications`
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  authors JSONB NOT NULL DEFAULT '[]'::jsonb,
  publication_date DATE NOT NULL DEFAULT CURRENT_DATE,
  year INTEGER NOT NULL DEFAULT 2026,
  domain TEXT NOT NULL DEFAULT 'Informatique & Télécoms',
  abstract TEXT NOT NULL DEFAULT '',
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  journal_or_conference TEXT,
  doi_or_url TEXT,
  pdf_url TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migration si la table existait déjà sans pièces jointes
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_publications_domain ON public.publications(domain);
CREATE INDEX IF NOT EXISTS idx_publications_year ON public.publications(year);
CREATE INDEX IF NOT EXISTS idx_publications_created_at ON public.publications(created_at DESC);

-- 5. Trigger updated_at
DROP TRIGGER IF EXISTS trigger_publications_updated_at ON public.publications;
CREATE TRIGGER trigger_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Sécurité Row Level Security (RLS)
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique de toutes les publications" ON public.publications;
CREATE POLICY "Lecture publique de toutes les publications"
  ON public.publications FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Insertion réservée au personnel authentifié et service_role" ON public.publications;
CREATE POLICY "Insertion réservée au personnel authentifié et service_role"
  ON public.publications FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Modification réservée au personnel authentifié et service_role" ON public.publications;
CREATE POLICY "Modification réservée au personnel authentifié et service_role"
  ON public.publications FOR UPDATE
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Suppression réservée au personnel authentifié et service_role" ON public.publications;
CREATE POLICY "Suppression réservée au personnel authentifié et service_role"
  ON public.publications FOR DELETE
  TO authenticated, service_role
  USING (true);

-- 7. Activer les notifications Supabase Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.publications;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 8. Création du bucket Supabase Storage pour les articles scientifiques
INSERT INTO storage.buckets (id, name, public)
VALUES ('publications-docs', 'publications-docs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Accès public en lecture aux publications scientifiques" ON storage.objects;
CREATE POLICY "Accès public en lecture aux publications scientifiques"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'publications-docs');

DROP POLICY IF EXISTS "Upload d'articles scientifiques réservé aux authentifiés" ON storage.objects;
CREATE POLICY "Upload d'articles scientifiques réservé aux authentifiés"
  ON storage.objects FOR INSERT
  TO authenticated, service_role
  WITH CHECK (bucket_id = 'publications-docs');
