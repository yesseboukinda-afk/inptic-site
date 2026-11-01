-- Split the legacy department field into direction and service.
ALTER TABLE public.rh_profiles
  ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service TEXT NOT NULL DEFAULT '';

UPDATE public.rh_profiles
SET
  direction = CASE
    WHEN btrim(direction) <> '' THEN direction
    WHEN department ~* '^service([[:space:]]|$)' THEN ''
    ELSE department
  END,
  service = CASE
    WHEN btrim(service) <> '' THEN service
    WHEN department ~* '^service([[:space:]]|$)' THEN department
    ELSE ''
  END
WHERE btrim(direction) = '' OR btrim(service) = '';
