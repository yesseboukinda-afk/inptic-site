-- ============================================================
-- MIGRATION GESTION RH & QR CODE DYNAMIQUE
-- Cahier des charges DRTI-CDC-2026-001
-- Compatible Supabase SQL Editor (PostgreSQL 15+)
-- ============================================================

-- 1. Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fonction generique de mise a jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABLE : rh_profiles
-- Profils complets du personnel INPTIC Gabon
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rh_profiles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule       TEXT        UNIQUE NOT NULL,
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  gender          TEXT        NOT NULL CHECK (gender IN ('M', 'F')) DEFAULT 'M',
  birth_date      DATE        NOT NULL,
  birth_place     TEXT        NOT NULL DEFAULT '',
  phone           TEXT        NOT NULL DEFAULT '',
  email           TEXT        NOT NULL DEFAULT '',
  photo_url       TEXT        NOT NULL DEFAULT '',
  department      TEXT        NOT NULL,
  position        TEXT        NOT NULL,
  status          TEXT        NOT NULL CHECK (status IN ('titulaire', 'contractuel', 'stagiaire', 'detache', 'vacataire')) DEFAULT 'contractuel',
  contract_type   TEXT        NOT NULL DEFAULT 'CDI',
  hire_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  job_description TEXT        NOT NULL DEFAULT '',
  is_archived     BOOLEAN     NOT NULL DEFAULT false,
  archived_at     TIMESTAMPTZ,
  archive_reason  TEXT,
  qr_token        TEXT        UNIQUE NOT NULL,
  qr_status       TEXT        NOT NULL CHECK (qr_status IN ('actif', 'revoque', 'inactif')) DEFAULT 'actif',
  qr_generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  qr_revoked_at   TIMESTAMPTZ,
  public_whitelist JSONB NOT NULL DEFAULT '{"photo":true,"lastName":true,"firstName":true,"position":true,"department":true,"status":true,"gender":false,"birthDate":false,"birthPlace":false,"phone":false,"email":false}'::jsonb,
  history         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_rh_profiles_qr_token    ON public.rh_profiles(qr_token);
CREATE INDEX IF NOT EXISTS idx_rh_profiles_matricule   ON public.rh_profiles(matricule);
CREATE INDEX IF NOT EXISTS idx_rh_profiles_department  ON public.rh_profiles(department);
CREATE INDEX IF NOT EXISTS idx_rh_profiles_status      ON public.rh_profiles(status);
CREATE INDEX IF NOT EXISTS idx_rh_profiles_is_archived ON public.rh_profiles(is_archived);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_rh_profiles_updated_at ON public.rh_profiles;
CREATE TRIGGER trigger_rh_profiles_updated_at
  BEFORE UPDATE ON public.rh_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TABLE : rh_audit_logs
-- Journal d'audit des actions sensibles sur les profils
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rh_audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id     TEXT        NOT NULL,
  user_email  TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  target_id   TEXT,
  target_name TEXT,
  details     TEXT,
  ip_address  TEXT
);

CREATE INDEX IF NOT EXISTS idx_rh_audit_timestamp  ON public.rh_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rh_audit_user_email ON public.rh_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_rh_audit_action     ON public.rh_audit_logs(action);

-- ============================================================
-- SECURITE : Row Level Security (RLS)
-- AUCUN acces direct public aux profils complets.
-- La fiche publique passe exclusivement par l'API controlee
-- /api/agent/[token] (service_role uniquement cote serveur).
-- ============================================================
ALTER TABLE public.rh_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_audit_logs  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rh_profiles'
      AND policyname = 'Gestion complete service_role RH'
  ) THEN
    CREATE POLICY "Gestion complete service_role RH"
      ON public.rh_profiles
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rh_audit_logs'
      AND policyname = 'Gestion complete service_role Audit'
  ) THEN
    CREATE POLICY "Gestion complete service_role Audit"
      ON public.rh_audit_logs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- REALTIME (optionnel - utile pour le dashboard admin live)
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rh_profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================
-- STORAGE : Bucket pour les photos du personnel
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rh-photos',
  'rh-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Lecture publique des photos du personnel" ON storage.objects;
CREATE POLICY "Lecture publique des photos du personnel"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'rh-photos');

DROP POLICY IF EXISTS "Upload photos reserves aux gestionnaires RH" ON storage.objects;
CREATE POLICY "Upload photos reserves aux gestionnaires RH"
  ON storage.objects FOR INSERT
  TO authenticated, service_role
  WITH CHECK (bucket_id = 'rh-photos');

DROP POLICY IF EXISTS "Mise a jour photos reserves aux gestionnaires RH" ON storage.objects;
CREATE POLICY "Mise a jour photos reserves aux gestionnaires RH"
  ON storage.objects FOR UPDATE
  TO authenticated, service_role
  USING (bucket_id = 'rh-photos');

DROP POLICY IF EXISTS "Suppression photos reserves aux gestionnaires RH" ON storage.objects;
CREATE POLICY "Suppression photos reserves aux gestionnaires RH"
  ON storage.objects FOR DELETE
  TO authenticated, service_role
  USING (bucket_id = 'rh-photos');

-- ============================================================
-- SEEDS : Personnel INPTIC Gabon (5 profils initiaux)
-- Les qr_token correspondent exactement aux seeds du code TS
-- dans /api/rh/profiles/route.ts
-- ============================================================
INSERT INTO public.rh_profiles (
  matricule, first_name, last_name, gender,
  birth_date, birth_place, phone, email, photo_url,
  department, position, status, contract_type,
  hire_date, job_description, is_archived,
  qr_token, qr_status, qr_generated_at,
  public_whitelist, history, created_at, updated_at
) VALUES

(
  'INPTIC-2018-001', 'Arsene', 'BEKALE', 'M',
  '1974-05-12', 'Libreville', '+241 77 12 34 56', 'arsene.bekale@inptic.ga', '/banniere/DG.webp',
  'Direction Generale (DG)', 'Directeur General', 'titulaire', 'Fonction Publique',
  '2018-09-01',
  'Direction strategique, representation legale et gouvernance generale de l''Institut National de la Poste, des Technologies de l''Information et de la Communication.',
  false,
  'inptic_agent_7f8a9b2c3d4e5f60718293a4b5c6d7e8', 'actif', '2026-01-10T08:00:00Z',
  '{"photo":true,"lastName":true,"firstName":true,"position":true,"department":true,"status":true,"gender":false,"birthDate":false,"birthPlace":false,"phone":false,"email":true}'::jsonb,
  '[{"id":"hist-001","changedAt":"2026-01-10T08:00:00Z","changedBy":"Systeme RH","action":"Creation du profil","details":"Initialisation du profil Directeur General et emission du QR Code dynamique."}]'::jsonb,
  '2026-01-10T08:00:00Z', '2026-01-10T08:00:00Z'
),

(
  'INPTIC-2019-014', 'Pauline', 'NDONG MVE', 'F',
  '1981-11-23', 'Oyem', '+241 66 98 76 54', 'pauline.ndong@inptic.ga', '/banniere/DGA.webp',
  'Direction Generale Adjointe (DGA)', 'Directrice Generale Adjointe', 'titulaire', 'Fonction Publique',
  '2019-03-15',
  'Supervision de la coordination operationnelle des departements academiques et appui au pilotage institutionnel.',
  false,
  'inptic_agent_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', 'actif', '2026-01-12T09:30:00Z',
  '{"photo":true,"lastName":true,"firstName":true,"position":true,"department":true,"status":true,"gender":false,"birthDate":false,"birthPlace":false,"phone":false,"email":true}'::jsonb,
  '[{"id":"hist-002","changedAt":"2026-01-12T09:30:00Z","changedBy":"Systeme RH","action":"Creation du profil","details":"Profil DGA cree et badge dynamique emis."}]'::jsonb,
  '2026-01-12T09:30:00Z', '2026-01-12T09:30:00Z'
),

(
  'INPTIC-2021-032', 'Marc', 'ESSONO OBIANG', 'M',
  '1985-08-19', 'Port-Gentil', '+241 74 55 44 33', 'marc.essono@inptic.ga', '',
  'Direction des Ressources Techniques et de l''Innovation (DRTI)',
  'Directeur des Ressources Techniques et de l''Innovation',
  'titulaire', 'Fonction Publique',
  '2021-02-01',
  'Pilotage des infrastructures SI, de l''innovation technologique, de la cybersecurite et de la transformation numerique de l''INPTIC.',
  false,
  'inptic_agent_9f8e7d6c5b4a39281706f5e4d3c2b1a0', 'actif', '2026-01-15T11:00:00Z',
  '{"photo":true,"lastName":true,"firstName":true,"position":true,"department":true,"status":true,"gender":false,"birthDate":false,"birthPlace":false,"phone":false,"email":true}'::jsonb,
  '[{"id":"hist-003","changedAt":"2026-01-15T11:00:00Z","changedBy":"Systeme RH","action":"Creation du profil","details":"Enregistrement DRTI et emission badge professionnel."}]'::jsonb,
  '2026-01-15T11:00:00Z', '2026-01-15T11:00:00Z'
),

(
  'INPTIC-2022-058', 'Christelle', 'MBOUMBA', 'F',
  '1990-03-14', 'Mouila', '+241 62 11 22 33', 'christelle.mboumba@inptic.ga', '',
  'Service Informatique et SI (SRSIAT)', 'Responsable Systemes, Reseaux et Securite',
  'contractuel', 'CDI',
  '2022-07-01',
  'Administration systeme Linux/Cloud, gestion des serveurs, supervision reseau et controle d''acces aux plateformes institutionnelles.',
  false,
  'inptic_agent_a1b2c3d4e5f67890abcdef1234567890', 'actif', '2026-02-01T10:00:00Z',
  '{"photo":true,"lastName":true,"firstName":true,"position":true,"department":true,"status":true,"gender":false,"birthDate":false,"birthPlace":false,"phone":false,"email":false}'::jsonb,
  '[{"id":"hist-004","changedAt":"2026-02-01T10:00:00Z","changedBy":"Systeme RH","action":"Creation du profil","details":"Initialisation du profil ingenieur SRSIAT."}]'::jsonb,
  '2026-02-01T10:00:00Z', '2026-02-01T10:00:00Z'
),

(
  'INPTIC-2023-089', 'Franck', 'KOUMBA', 'M',
  '1993-09-28', 'Tchibanga', '+241 77 99 88 77', 'franck.koumba@inptic.ga', '',
  'Service Scolarite', 'Gestionnaire des Admissions et Dossiers Etudiants',
  'contractuel', 'CDI',
  '2023-01-15',
  'Gestion des inscriptions administratives, suivi des candidatures et delivrance des attestations et releves de notes.',
  false,
  'inptic_agent_fedcba0987654321fedcba0987654321', 'actif', '2026-02-05T14:20:00Z',
  '{"photo":true,"lastName":true,"firstName":true,"position":true,"department":true,"status":true,"gender":false,"birthDate":false,"birthPlace":false,"phone":false,"email":false}'::jsonb,
  '[{"id":"hist-005","changedAt":"2026-02-05T14:20:00Z","changedBy":"Systeme RH","action":"Creation du profil","details":"Enregistrement de l''agent de scolarite."}]'::jsonb,
  '2026-02-05T14:20:00Z', '2026-02-05T14:20:00Z'
)

ON CONFLICT (matricule) DO NOTHING;

-- ============================================================
-- VERIFICATION FINALE
-- ============================================================
DO $$
DECLARE
  nb_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO nb_profiles FROM public.rh_profiles;
  RAISE NOTICE 'Migration RH terminee — % profil(s) enregistre(s) dans rh_profiles.', nb_profiles;
END $$;
