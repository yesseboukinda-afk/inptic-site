-- Student applications to INPTIC clubs.
CREATE TABLE IF NOT EXISTS public.club_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  club_slug TEXT NOT NULL,
  subclub_slug TEXT,
  activity TEXT NOT NULL,
  motivation TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  decision_note TEXT,
  decided_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.club_applications
  ADD COLUMN IF NOT EXISTS subclub_slug TEXT;

ALTER TABLE public.club_applications
  ADD COLUMN IF NOT EXISTS candidate_name TEXT,
  ADD COLUMN IF NOT EXISTS candidate_email TEXT;

UPDATE public.club_applications AS applications
SET candidate_name = COALESCE(
      NULLIF(BTRIM(users.user_metadata->>'full_name'), ''),
      NULLIF(BTRIM(users.user_metadata->>'name'), ''),
      SPLIT_PART(users.email, '@', 1)
    ),
    candidate_email = users.email
FROM public.app_users AS users
WHERE users.id = applications.user_id
  AND (applications.candidate_name IS NULL OR applications.candidate_email IS NULL);

ALTER TABLE public.club_applications
  ALTER COLUMN candidate_name SET NOT NULL,
  ALTER COLUMN candidate_email SET NOT NULL;

ALTER TABLE public.club_applications
  DROP CONSTRAINT IF EXISTS club_applications_club_slug_check;
ALTER TABLE public.club_applications
  DROP CONSTRAINT IF EXISTS club_applications_subclub_slug_check;

UPDATE public.club_applications
SET club_slug = 'club-creation-numerique'
WHERE club_slug = 'club-robotique';

UPDATE public.club_applications
SET subclub_slug = CASE
  WHEN club_slug = 'club-sportif' AND lower(activity) = 'football' THEN 'football'
  WHEN club_slug = 'club-sportif' AND lower(activity) = 'taekwondo' THEN 'taekwondo'
  WHEN club_slug = 'club-sportif' AND lower(activity) = 'boxe' THEN 'boxe'
  WHEN club_slug = 'club-sportif' AND lower(activity) IN ('karate', 'karaté') THEN 'karate'
  WHEN club_slug = 'club-sportif' AND lower(activity) IN ('basketball', 'basket-ball') THEN 'basketball'
  WHEN club_slug = 'club-creation-numerique' AND lower(activity) IN ('développement', 'developpement') THEN 'developpement'
  WHEN club_slug = 'club-creation-numerique' AND lower(activity) IN ('réseau', 'reseau', 'réseaux', 'reseaux') THEN 'reseau'
  WHEN club_slug = 'club-creation-numerique' AND lower(activity) = 'infographie' THEN 'infographie'
  WHEN club_slug = 'club-creation-numerique' AND lower(activity) = 'audiovisuel' THEN 'audiovisuel'
  ELSE subclub_slug
END
WHERE subclub_slug IS NULL;

ALTER TABLE public.club_applications
  ADD CONSTRAINT club_applications_club_slug_check
    CHECK (club_slug IN ('club-sportif', 'club-creation-numerique')),
  ADD CONSTRAINT club_applications_subclub_slug_check
    CHECK (
      subclub_slug IS NULL
      OR (club_slug = 'club-sportif' AND subclub_slug IN ('football', 'taekwondo', 'boxe', 'karate', 'basketball'))
      OR (club_slug = 'club-creation-numerique' AND subclub_slug IN ('developpement', 'reseau', 'infographie', 'audiovisuel'))
    );

UPDATE public.app_users
SET user_metadata = jsonb_set(user_metadata, '{clubSlug}', '"club-creation-numerique"'::jsonb, TRUE),
    updated_at = NOW()
WHERE user_metadata->>'clubSlug' = 'club-robotique';

CREATE UNIQUE INDEX IF NOT EXISTS club_applications_one_active_per_student_idx
  ON public.club_applications(user_id)
  WHERE status IN ('pending', 'accepted');

CREATE INDEX IF NOT EXISTS club_applications_club_status_created_idx
  ON public.club_applications(club_slug, status, created_at DESC);

CREATE INDEX IF NOT EXISTS club_applications_user_created_idx
  ON public.club_applications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE
ON TABLE public.club_applications
TO "c1668531c_inptic-site";

CREATE TABLE IF NOT EXISTS public.club_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_slug TEXT NOT NULL CHECK (club_slug IN ('club-sportif', 'club-creation-numerique')),
  voter_token_hash TEXT NOT NULL CHECK (voter_token_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_slug, voter_token_hash)
);

CREATE INDEX IF NOT EXISTS club_likes_club_created_idx
  ON public.club_likes(club_slug, created_at DESC);

GRANT SELECT, INSERT, DELETE
ON TABLE public.club_likes
TO "c1668531c_inptic-site";
