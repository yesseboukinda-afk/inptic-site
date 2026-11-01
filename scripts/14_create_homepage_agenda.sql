-- Persistent, staff-editable agenda displayed on the public homepage.
-- Safe to run on an existing application database.

CREATE TABLE IF NOT EXISTS public.homepage_agenda (
  id TEXT PRIMARY KEY CHECK (id = 'homepage'),
  events JSONB NOT NULL CHECK (jsonb_typeof(events) = 'array' AND jsonb_array_length(events) = 3),
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT ON TABLE public.homepage_agenda TO PUBLIC;
