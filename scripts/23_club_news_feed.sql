CREATE TABLE IF NOT EXISTS public.club_news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_slug TEXT NOT NULL
    CHECK (club_slug IN ('club-sportif', 'club-creation-numerique')),
  caption TEXT NOT NULL DEFAULT '' CHECK (char_length(caption) <= 500),
  storage_bucket TEXT NOT NULL DEFAULT 'club-news'
    CHECK (storage_bucket = 'club-news'),
  image_path TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (storage_bucket, image_path)
    REFERENCES public.private_files(bucket, path)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS club_news_posts_club_created_idx
  ON public.club_news_posts(club_slug, created_at DESC);

GRANT SELECT, INSERT, DELETE
ON TABLE public.club_news_posts
TO "c1668531c_inptic-site";

GRANT SELECT, INSERT, DELETE
ON TABLE public.private_files
TO "c1668531c_inptic-site";
