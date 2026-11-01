-- Persistent activity log for successful and rejected API mutation attempts.
-- Run once on databases created before site_audit_logs was added to the schema.

CREATE TABLE IF NOT EXISTS public.site_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  service TEXT NOT NULL,
  direction TEXT NOT NULL,
  action TEXT NOT NULL,
  http_method TEXT NOT NULL,
  route TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'en_cours'
    CHECK (outcome IN ('en_cours', 'succes', 'echec')),
  response_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS site_audit_logs_created_at_idx
  ON public.site_audit_logs(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS site_audit_logs_actor_id_idx
  ON public.site_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS site_audit_logs_service_idx
  ON public.site_audit_logs(service, created_at DESC);
