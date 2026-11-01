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

-- 9. Données initiales (Seeds)
INSERT INTO public.publications (title, slug, authors, publication_date, year, domain, abstract, keywords, journal_or_conference, doi_or_url, pdf_url, attachments)
VALUES
(
  'Déploiement et Résilience des Réseaux de Capteurs IoT en Milieu Forestier Équatorial Gabonais',
  'deploiement-resilience-iot-foret-equatoriale-gabon',
  '["Dr. Jean-Marc ONDO (INPTIC)", "Ing. Patrick MVE (Laboratoire Systèmes & IoT)", "Pr. A. BIVEGHE"]'::jsonb,
  '2026-02-14',
  2026,
  'Systèmes Embarqués & IoT',
  'Cette étude analyse les défis de connectivité radio LoRaWAN et de durabilité énergétique des réseaux de micro-capteurs déployés pour le suivi microclimatique et la détection précoce des feux dans le bassin du Congo.',
  '["IoT", "LoRaWAN", "Forêt tropicale", "Énergie solaire", "Réseaux de capteurs", "Gabon"]'::jsonb,
  'Revue Africaine des Technologies de l’Information et Télécoms (RATIT 2026)',
  'https://doi.org/10.1016/j.inptic.iot.2026.012',
  '/docs/publications/inptic_iot_foret_2026.pdf',
  '[{"name": "Article IoT forêt équatoriale 2026.pdf", "url": "/docs/publications/inptic_iot_foret_2026.pdf", "type": "application/pdf"}]'::jsonb
),
(
  'Architectures de Cybersécurité Souveraine pour les Systèmes d’Information des Administrations Publiques',
  'cybersecurite-souveraine-si-administrations-publiques',
  '["Dr. Marcelle ESSONO (DRTI / INPTIC)", "M. Christian BOURDES (Expert Sécurité SI)"]'::jsonb,
  '2025-11-20',
  2025,
  'Cybersécurité',
  'Face à la recrudescence des cybermenaces ciblant les infrastructures critiques en Afrique centrale, cet article propose un cadre de maturité fondé sur le Zero Trust, la cryptographie post-quantique et les SOCs territoriaux.',
  '["Cybersécurité", "Zero Trust", "SOC", "Souveraineté numérique", "Infrastructures critiques"]'::jsonb,
  'Actes du Forum International de Cybersécurité d’Afrique Centrale (FICAS 2025)',
  'https://ficas-conf.org/proceedings/2025/inptic-cybersec',
  '/docs/publications/inptic_cybersec_2025.pdf',
  '[{"name": "Article cybersécurité souveraine 2025.pdf", "url": "/docs/publications/inptic_cybersec_2025.pdf", "type": "application/pdf"}]'::jsonb
),
(
  'Modélisation et Optimisation du Routage sur Réseau Fibre Optique FTTH Urbain à Libreville',
  'optimisation-routage-fibre-ftth-libreville',
  '["Ing. David MOUIRI (Département Réseaux & Télécoms)", "Dr. Serge NZIENGUI"]'::jsonb,
  '2025-06-10',
  2025,
  'Réseaux & Télécoms',
  'Présentation d’un algorithme d’allocation spectrale et de routage multicouche pour minimiser la latence et prévenir la congestion sur la dorsale nationale à fibre optique dans la zone métropolitaine du Grand Libreville.',
  '["Fibre optique", "FTTH", "Routage", "QoS", "Télécommunications", "Libreville"]'::jsonb,
  'IEEE Africa Communications Symposium (AfriComm 2025)',
  'https://doi.org/10.1109/AFRICOMM.2025.88210',
  '/docs/publications/inptic_ftth_libreville_2025.pdf',
  '[{"name": "Article routage FTTH Libreville 2025.pdf", "url": "/docs/publications/inptic_ftth_libreville_2025.pdf", "type": "application/pdf"}]'::jsonb
),
(
  'Apprentissage Automatique pour le Traitement Automatique des Langues Nationales du Gabon',
  'apprentissage-automatique-langues-nationales-gabon',
  '["Dr. Fabrice NGUEMA (Laboratoire IA & Big Data)", "Mme. Estelle BEKALE (Doctorante)"]'::jsonb,
  '2024-09-05',
  2024,
  'Intelligence Artificielle',
  'Exploration des modèles de langage pré-entraînés à faibles ressources appliqués au Fang, Myènè et Punu. Méthodologie de constitution de corpus textuels et audio et plateforme de reconnaissance vocale.',
  '["Intelligence Artificielle", "NLP", "Langues bantoues", "Machine Learning", "Patrimoine numérique"]'::jsonb,
  'Revue Internationale d’Ingénierie Linguistique et Informatique Appliquée',
  'https://doi.org/10.5281/zenodo.inptic.nlp.2024',
  '/docs/publications/inptic_ia_nlp_2024.pdf',
  '[{"name": "Article TAL langues nationales 2024.pdf", "url": "/docs/publications/inptic_ia_nlp_2024.pdf", "type": "application/pdf"}]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
