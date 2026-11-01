-- Grant only the audit-table permissions needed by the verified LWS runtime role.
-- Run this script on the c1668531c_inptic_pwa PostgreSQL database.

GRANT SELECT, INSERT, UPDATE
ON TABLE public.site_audit_logs
TO "c1668531c_inptic-site";

GRANT SELECT, INSERT
ON TABLE public.rh_audit_logs
TO "c1668531c_inptic-site";

ALTER TABLE public.rh_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rh_audit_logs'
      AND policyname = 'LWS application can read RH audit logs'
  ) THEN
    CREATE POLICY "LWS application can read RH audit logs"
      ON public.rh_audit_logs
      FOR SELECT
      TO "c1668531c_inptic-site"
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rh_audit_logs'
      AND policyname = 'LWS application can insert RH audit logs'
  ) THEN
    CREATE POLICY "LWS application can insert RH audit logs"
      ON public.rh_audit_logs
      FOR INSERT
      TO "c1668531c_inptic-site"
      WITH CHECK (true);
  END IF;
END $$;
