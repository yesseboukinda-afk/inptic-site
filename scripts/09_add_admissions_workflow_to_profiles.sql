ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admission_workflow JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS candidature_data JSONB;
