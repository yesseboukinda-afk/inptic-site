-- Complete empty PostgreSQL schema for the INPTIC Next.js application on LWS.
-- Run only in a PostgreSQL SQL client after selecting the target database.
-- Do not run in phpMyAdmin: phpMyAdmin connects to MySQL/MariaDB, not PostgreSQL.
-- This creates tables and indexes only; it imports no accounts or application data.
-- Requires PostgreSQL 13+ (gen_random_uuid() is built in).

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'etudiant',
  user_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_verified_at TIMESTAMPTZ,
  must_reset_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT app_users_email_normalized CHECK (email = lower(trim(email)))
);

CREATE TABLE IF NOT EXISTS public.app_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx
  ON public.app_sessions(user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx
  ON public.app_sessions(expires_at);

CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  provider TEXT PRIMARY KEY
    CHECK (provider IN ('qwen', 'groq', 'claude', 'gemini', 'deepseek', 'openai', 'openrouter', 'ollama')),
  model TEXT NOT NULL CHECK (length(model) BETWEEN 1 AND 120),
  api_key_encrypted TEXT,
  thinking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_provider_settings_one_active_idx
  ON public.ai_provider_settings(is_active)
  WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON public.password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS public.homepage_agenda (
  id TEXT PRIMARY KEY CHECK (id = 'homepage'),
  events JSONB NOT NULL CHECK (jsonb_typeof(events) = 'array' AND jsonb_array_length(events) = 3),
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON TABLE public.homepage_agenda TO PUBLIC;

CREATE TABLE IF NOT EXISTS public.homepage_director_message (
  id TEXT PRIMARY KEY CHECK (id = 'homepage'),
  content JSONB NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON TABLE public.homepage_director_message TO PUBLIC;

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx
  ON public.email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS public.private_files (
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  owner_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket, path)
);

CREATE INDEX IF NOT EXISTS private_files_bucket_created_at_idx
  ON public.private_files(bucket, created_at DESC);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  niveau TEXT NOT NULL DEFAULT '',
  parcours TEXT NOT NULL DEFAULT '',
  promotion TEXT NOT NULL DEFAULT '',
  etablissement TEXT NOT NULL DEFAULT '',
  annee TEXT NOT NULL DEFAULT '',
  specialite TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  diplome TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  departement TEXT NOT NULL DEFAULT '',
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  admission_workflow JSONB NOT NULL DEFAULT '{}'::jsonb,
  candidature_data JSONB,
  role TEXT NOT NULL DEFAULT 'etudiant',
  dossier_status TEXT NOT NULL DEFAULT 'en_attente',
  dossier_numero TEXT,
  dossier_valide BOOLEAN NOT NULL DEFAULT FALSE,
  emploi_du_temps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE
ON TABLE public.profiles
TO "c1668531c_inptic-site";

GRANT SELECT, INSERT, DELETE
ON TABLE public.private_files
TO "c1668531c_inptic-site";

CREATE TABLE IF NOT EXISTS public.concours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL DEFAULT 'Général',
  session_year INTEGER NOT NULL DEFAULT 2026,
  status TEXT NOT NULL DEFAULT 'en_cours'
    CHECK (status IN ('a_venir', 'en_cours', 'termine')),
  description TEXT NOT NULL DEFAULT '',
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  calendar JSONB NOT NULL DEFAULT '{}'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  results JSONB NOT NULL DEFAULT '{"published":false,"admittedList":[],"waitingList":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lws_concours_status_year_idx
  ON public.concours(status, session_year DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.concours_preinscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  concours_slug TEXT REFERENCES public.concours(slug) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  consented_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'nouvelle'
    CHECK (status IN ('nouvelle', 'contactee', 'convertie', 'annulee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lws_concours_preinscriptions_created_idx
  ON public.concours_preinscriptions(created_at DESC);

CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lws_publications_domain_year_idx
  ON public.publications(domain, year DESC);

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.publications
TO "c1668531c_inptic-site";

CREATE TABLE IF NOT EXISTS public.actualites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Annonce',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_pages TEXT[] NOT NULL DEFAULT ARRAY['actualites', 'annonces']::TEXT[],
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lws_actualites_status_date_idx
  ON public.actualites(status, published_at DESC);
CREATE INDEX IF NOT EXISTS lws_actualites_target_pages_idx
  ON public.actualites USING GIN(target_pages);

CREATE TABLE IF NOT EXISTS public.actualites_engagement_counters (
  article_slug TEXT PRIMARY KEY,
  views_count BIGINT NOT NULL DEFAULT 0,
  likes_count BIGINT NOT NULL DEFAULT 0,
  shares_count BIGINT NOT NULL DEFAULT 0,
  shares_whatsapp BIGINT NOT NULL DEFAULT 0,
  shares_facebook BIGINT NOT NULL DEFAULT 0,
  shares_linkedin BIGINT NOT NULL DEFAULT 0,
  shares_youtube BIGINT NOT NULL DEFAULT 0,
  shares_mail BIGINT NOT NULL DEFAULT 0,
  shares_tiktok BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.actualites_engagement_visitors (
  article_slug TEXT NOT NULL,
  visitor_id UUID NOT NULL,
  liked BOOLEAN NOT NULL DEFAULT FALSE,
  shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  shared_facebook BOOLEAN NOT NULL DEFAULT FALSE,
  shared_linkedin BOOLEAN NOT NULL DEFAULT FALSE,
  shared_youtube BOOLEAN NOT NULL DEFAULT FALSE,
  shared_mail BOOLEAN NOT NULL DEFAULT FALSE,
  shared_tiktok BOOLEAN NOT NULL DEFAULT FALSE,
  last_viewed_on DATE,
  PRIMARY KEY (article_slug, visitor_id)
);

CREATE TABLE IF NOT EXISTS public.alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  filiere TEXT NOT NULL DEFAULT '',
  poste TEXT NOT NULL DEFAULT '',
  entreprise TEXT NOT NULL DEFAULT '',
  promotion INTEGER NOT NULL DEFAULT 2026,
  commentaire TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  owner_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alumni
  ADD COLUMN IF NOT EXISTS owner_user_id UUID
  REFERENCES public.app_users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS alumni_owner_user_id_unique_idx
  ON public.alumni(owner_user_id) WHERE owner_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.rh_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'M' CHECK (gender IN ('M', 'F')),
  birth_date DATE NOT NULL,
  birth_place TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'contractuel'
    CHECK (status IN ('titulaire', 'contractuel', 'stagiaire', 'detache', 'vacataire')),
  contract_type TEXT NOT NULL DEFAULT 'CDI',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  job_description TEXT NOT NULL DEFAULT '',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT,
  qr_token TEXT NOT NULL UNIQUE,
  qr_status TEXT NOT NULL DEFAULT 'actif'
    CHECK (qr_status IN ('actif', 'revoque', 'inactif')),
  qr_generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_revoked_at TIMESTAMPTZ,
  public_whitelist JSONB NOT NULL DEFAULT '{}'::jsonb,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rh_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  target_name TEXT,
  details TEXT,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS lws_rh_audit_timestamp_idx
  ON public.rh_audit_logs(timestamp DESC);

CREATE TABLE IF NOT EXISTS public.training_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'video')),
  resource_url TEXT NOT NULL,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscribers (
  email TEXT PRIMARY KEY,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  confirmation_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS lws_subscribers_active_idx
  ON public.subscribers(email)
  WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.newsletter_deliveries (
  publication_id TEXT NOT NULL,
  subscriber_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'failed')),
  resend_email_id TEXT,
  error_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (publication_id, subscriber_email)
);

COMMIT;
