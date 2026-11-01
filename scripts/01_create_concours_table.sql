-- ============================================================
-- SCRIPT SUPABASE : TABLE CONCOURS & RÉSULTATS
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

-- 3. Création de la table `concours`
CREATE TABLE IF NOT EXISTS public.concours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL DEFAULT 'Général',
  session_year INTEGER NOT NULL DEFAULT 2026,
  status TEXT NOT NULL CHECK (status IN ('a_venir', 'en_cours', 'termine')) DEFAULT 'en_cours',
  description TEXT NOT NULL DEFAULT '',
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  calendar JSONB NOT NULL DEFAULT '{}'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  results JSONB NOT NULL DEFAULT '{"published": false, "admittedList": [], "waitingList": []}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Index optimisés
CREATE INDEX IF NOT EXISTS idx_concours_status ON public.concours(status);
CREATE INDEX IF NOT EXISTS idx_concours_session_year ON public.concours(session_year);
CREATE INDEX IF NOT EXISTS idx_concours_created_at ON public.concours(created_at DESC);

-- 5. Trigger updated_at
DROP TRIGGER IF EXISTS trigger_concours_updated_at ON public.concours;
CREATE TRIGGER trigger_concours_updated_at
  BEFORE UPDATE ON public.concours
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Sécurité Row Level Security (RLS)
ALTER TABLE public.concours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique de tous les concours" ON public.concours;
CREATE POLICY "Lecture publique de tous les concours"
  ON public.concours FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Insertion réservée au personnel authentifié et service_role" ON public.concours;
CREATE POLICY "Insertion réservée au personnel authentifié et service_role"
  ON public.concours FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Modification réservée au personnel authentifié et service_role" ON public.concours;
CREATE POLICY "Modification réservée au personnel authentifié et service_role"
  ON public.concours FOR UPDATE
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Suppression réservée au personnel authentifié et service_role" ON public.concours;
CREATE POLICY "Suppression réservée au personnel authentifié et service_role"
  ON public.concours FOR DELETE
  TO authenticated, service_role
  USING (true);

-- 7. Activer les notifications Supabase Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.concours;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 8. Création du bucket Supabase Storage pour les pièces jointes & PV
INSERT INTO storage.buckets (id, name, public)
VALUES ('concours-docs', 'concours-docs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS pour le bucket concours-docs
DROP POLICY IF EXISTS "Accès public en lecture aux documents de concours" ON storage.objects;
CREATE POLICY "Accès public en lecture aux documents de concours"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'concours-docs');

DROP POLICY IF EXISTS "Upload de documents de concours réservé aux authentifiés" ON storage.objects;
CREATE POLICY "Upload de documents de concours réservé aux authentifiés"
  ON storage.objects FOR INSERT
  TO authenticated, service_role
  WITH CHECK (bucket_id = 'concours-docs');

-- 9. Données initiales (Seeds)
INSERT INTO public.concours (title, slug, department, session_year, status, description, conditions, calendar, attachments, results)
VALUES
(
  'Concours d’Entrée en 1ère Année DTS — Session 2026',
  'concours-entree-dts-2026',
  'Réseaux & Télécoms, Génie Logiciel, Multimédia',
  2026,
  'en_cours',
  'Ouverture officielle des inscriptions au concours d’entrée à l’INPTIC Gabon pour les filières DTS. Les épreuves écrites porteront sur les Mathématiques, la Physique et le Français.',
  '["Être titulaire d’un Baccalauréat scientifique ou technique (C, D, E, F2, F3) ou équivalent.", "Être âgé de 23 ans au plus au 31 décembre 2026.", "Dossier complet comprenant acte de naissance légalisé, certificat médical et relevés de notes du Bac.", "Frais de dossier de 20 000 FCFA à régler en ligne ou à la scolarité."]'::jsonb,
  '{"registrationStart": "2026-03-01T08:00:00Z", "registrationEnd": "2026-05-15T18:00:00Z", "examDate": "2026-06-05T07:30:00Z", "resultsDate": "2026-06-25T12:00:00Z"}'::jsonb,
  '[{"name": "Arrêté ministériel d’ouverture du concours 2026.pdf", "url": "/docs/arrete_concours_2026.pdf", "size": 1450000, "type": "application/pdf"}]'::jsonb,
  '{"published": false, "admittedList": [], "waitingList": []}'::jsonb
),
(
  'Concours Spécial d’Admission en Licence Professionnelle (L3) — Session 2026',
  'concours-admission-licence-pro-2026',
  'Cybersécurité, Systèmes Embarqués & IoT, Management des TIC',
  2026,
  'a_venir',
  'Concours ouvert aux titulaires d’un DTS, BTS ou DUT en informatique, réseaux, télécommunications ou gestion désireux d’intégrer le cycle Licence Professionnelle.',
  '["Titulaire d’un Bac+2 validé (DTS, BTS, DUT) dans les domaines numériques ou tertiaires.", "Moyenne minimale requise de 12/20 sur les deux années préparatoires.", "Entretien technique et test de compétences spécialisées."]'::jsonb,
  '{"registrationStart": "2026-05-20T08:00:00Z", "registrationEnd": "2026-07-10T18:00:00Z", "examDate": "2026-07-22T08:00:00Z", "resultsDate": "2026-08-05T12:00:00Z"}'::jsonb,
  '[]'::jsonb,
  '{"published": false, "admittedList": [], "waitingList": []}'::jsonb
),
(
  'Concours d’Entrée en 1ère Année DTS — Session 2025 (Terminé)',
  'concours-entree-dts-2025-resultats',
  'Toutes filières DTS',
  2025,
  'termine',
  'Le concours de la session 2025 est officiellement clôturé. Les procès-verbaux de délibération et listes des candidats admis et en liste d’attente sont disponibles en téléchargement.',
  '["Titulaire du Baccalauréat session 2025 ou antérieure."]'::jsonb,
  '{"registrationStart": "2025-03-01T08:00:00Z", "registrationEnd": "2025-05-15T18:00:00Z", "examDate": "2025-06-07T08:00:00Z", "resultsDate": "2025-06-28T14:00:00Z"}'::jsonb,
  '[]'::jsonb,
  '{"published": true, "publishedAt": "2025-06-28T14:00:00Z", "pdfUrl": "/docs/pv_resultats_concours_2025.pdf", "notes": "Les candidats admis sont priés de se présenter à la scolarité avant le 15 septembre.", "admittedList": ["MBOUMBA Jean-Pierre — DTS Génie Logiciel (Mention Bien)", "NZAMBA Claire Laure — DTS Réseaux & Télécoms (Mention Très Bien)", "OBIANG Arnaud — DTS Multimédia & Internet (Mention Bien)"], "waitingList": ["1. ONDO Guy Roger — DTS Génie Logiciel", "2. MENGUE Patricia — DTS Réseaux & Télécoms"]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
