-- Persistent, staff-editable director message displayed on the institute page.
-- Safe to run on an existing application database.

CREATE TABLE IF NOT EXISTS public.homepage_director_message (
  id TEXT PRIMARY KEY CHECK (id = 'homepage'),
  content JSONB NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON TABLE public.homepage_director_message TO PUBLIC;