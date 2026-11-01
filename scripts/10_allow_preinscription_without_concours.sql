ALTER TABLE public.concours_preinscriptions
  ALTER COLUMN concours_slug DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN consented_at DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_concours_preinscriptions_user_id
  ON public.concours_preinscriptions(user_id);
