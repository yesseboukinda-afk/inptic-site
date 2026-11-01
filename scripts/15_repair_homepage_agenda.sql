-- Repair the homepage agenda table when an earlier CREATE TABLE IF NOT EXISTS
-- left behind an incomplete version of the schema.

BEGIN;

CREATE TABLE IF NOT EXISTS public.homepage_agenda (
  id TEXT PRIMARY KEY CHECK (id = 'homepage'),
  events JSONB NOT NULL CHECK (jsonb_typeof(events) = 'array' AND jsonb_array_length(events) = 3),
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.homepage_agenda
  ADD COLUMN IF NOT EXISTS id TEXT,
  ADD COLUMN IF NOT EXISTS events JSONB,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.homepage_agenda
SET id = 'homepage'
WHERE id IS NULL;

UPDATE public.homepage_agenda
SET events = '[
  {"id":"openDay","date":"28 MAI","title":"Journée portes ouvertes"},
  {"id":"companiesForum","date":"05 JUIN","title":"Forum Entreprises & Stages"},
  {"id":"aiConference","date":"12 JUIN","title":"Conférence IA & Société"}
]'::jsonb
WHERE events IS NULL
   OR CASE
        WHEN jsonb_typeof(events) = 'array' THEN jsonb_array_length(events) <> 3
        ELSE TRUE
      END;

UPDATE public.homepage_agenda
SET updated_at = NOW()
WHERE updated_at IS NULL;

ALTER TABLE public.homepage_agenda
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN events SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS homepage_agenda_id_unique_idx
  ON public.homepage_agenda(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.homepage_agenda'::regclass
      AND conname = 'homepage_agenda_id_check'
  ) THEN
    ALTER TABLE public.homepage_agenda
      ADD CONSTRAINT homepage_agenda_id_check CHECK (id = 'homepage');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.homepage_agenda'::regclass
      AND conname = 'homepage_agenda_events_check'
  ) THEN
    ALTER TABLE public.homepage_agenda
      ADD CONSTRAINT homepage_agenda_events_check
      CHECK (jsonb_typeof(events) = 'array' AND jsonb_array_length(events) = 3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.homepage_agenda'::regclass
      AND conname = 'homepage_agenda_updated_by_fkey'
  ) THEN
    ALTER TABLE public.homepage_agenda
      ADD CONSTRAINT homepage_agenda_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES public.app_users(id) ON DELETE SET NULL;
  END IF;
END $$;

GRANT SELECT ON TABLE public.homepage_agenda TO PUBLIC;

COMMIT;
