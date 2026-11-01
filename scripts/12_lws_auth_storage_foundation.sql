-- Foundation for the LWS-hosted authentication and private file storage.
-- Run only on the new LWS PostgreSQL database, not on the live Supabase project.

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

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON public.password_reset_tokens(user_id);

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
