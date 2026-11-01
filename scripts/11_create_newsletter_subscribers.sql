-- Run this script on the LWS PostgreSQL database before enabling newsletter signups.
CREATE TABLE IF NOT EXISTS public.subscribers (
  email TEXT PRIMARY KEY,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  confirmation_sent_at TIMESTAMPTZ
);

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_unique
  ON public.subscribers (email);

CREATE UNIQUE INDEX IF NOT EXISTS subscribers_unsubscribe_token_unique
  ON public.subscribers (unsubscribe_token);

CREATE TABLE IF NOT EXISTS public.newsletter_deliveries (
  publication_id TEXT NOT NULL,
  subscriber_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'failed')),
  resend_email_id TEXT,
  error_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (publication_id, subscriber_email)
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active
  ON public.subscribers (email)
  WHERE is_active = TRUE;
