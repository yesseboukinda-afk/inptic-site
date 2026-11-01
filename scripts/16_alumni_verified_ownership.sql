-- Attach Alumni profiles to verified INPTIC accounts for safe self-service edits.
-- Existing profiles remain public but unclaimed; do not assign owners based on names.

BEGIN;

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
  ON public.alumni(owner_user_id)
  WHERE owner_user_id IS NOT NULL;

COMMIT;
