-- Run after scripts/12_lws_auth_storage_foundation.sql.
-- Stores provider settings server-side; API keys are AES-256-GCM encrypted by the app.
BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  provider TEXT PRIMARY KEY
    CHECK (provider IN ('qwen', 'groq', 'claude', 'gemini', 'deepseek', 'openai', 'openrouter', 'ollama')),
  model TEXT NOT NULL CHECK (length(model) BETWEEN 1 AND 120),
  api_key_encrypted TEXT,
  thinking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_provider_settings_one_active_idx
  ON public.ai_provider_settings(is_active)
  WHERE is_active = TRUE;

COMMIT;
