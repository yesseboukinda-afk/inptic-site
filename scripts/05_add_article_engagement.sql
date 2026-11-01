-- Statistiques d'engagement des actualites et annonces publiques.
CREATE TABLE IF NOT EXISTS public.actualites_engagement_counters (
  article_slug TEXT PRIMARY KEY,
  views_count BIGINT NOT NULL DEFAULT 0,
  likes_count BIGINT NOT NULL DEFAULT 0,
  shares_count BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.actualites_engagement_visitors (
  article_slug TEXT NOT NULL,
  visitor_id UUID NOT NULL,
  liked BOOLEAN NOT NULL DEFAULT false,
  shared BOOLEAN NOT NULL DEFAULT false,
  last_viewed_on DATE,
  PRIMARY KEY (article_slug, visitor_id)
);

ALTER TABLE public.actualites_engagement_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actualites_engagement_visitors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.actualites_engagement_counters FROM anon, authenticated;
REVOKE ALL ON public.actualites_engagement_visitors FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.actualites_engagement_counters TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.actualites_engagement_visitors TO service_role;

CREATE OR REPLACE FUNCTION public.track_actualites_engagement(
  p_article_slug TEXT,
  p_visitor_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  visitor actualites_engagement_visitors%ROWTYPE;
  counters actualites_engagement_counters%ROWTYPE;
BEGIN
  IF p_article_slug IS NULL OR length(p_article_slug) = 0 OR length(p_article_slug) > 200 THEN
    RAISE EXCEPTION 'Invalid article slug';
  END IF;
  IF p_action NOT IN ('view', 'like', 'share') THEN
    RAISE EXCEPTION 'Invalid engagement action';
  END IF;

  INSERT INTO actualites_engagement_counters (article_slug)
  VALUES (p_article_slug)
  ON CONFLICT (article_slug) DO NOTHING;

  INSERT INTO actualites_engagement_visitors (article_slug, visitor_id)
  VALUES (p_article_slug, p_visitor_id)
  ON CONFLICT (article_slug, visitor_id) DO NOTHING;

  SELECT * INTO visitor
  FROM actualites_engagement_visitors
  WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id
  FOR UPDATE;

  IF p_action = 'view' AND visitor.last_viewed_on IS DISTINCT FROM CURRENT_DATE THEN
    UPDATE actualites_engagement_visitors
    SET last_viewed_on = CURRENT_DATE
    WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
    UPDATE actualites_engagement_counters
    SET views_count = views_count + 1
    WHERE article_slug = p_article_slug;
  ELSIF p_action = 'like' THEN
    UPDATE actualites_engagement_visitors
    SET liked = NOT visitor.liked
    WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
    UPDATE actualites_engagement_counters
    SET likes_count = GREATEST(0, likes_count + CASE WHEN visitor.liked THEN -1 ELSE 1 END)
    WHERE article_slug = p_article_slug;
  ELSIF p_action = 'share' AND NOT visitor.shared THEN
    UPDATE actualites_engagement_visitors
    SET shared = true
    WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
    UPDATE actualites_engagement_counters
    SET shares_count = shares_count + 1
    WHERE article_slug = p_article_slug;
  END IF;

  SELECT * INTO visitor
  FROM actualites_engagement_visitors
  WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
  SELECT * INTO counters
  FROM actualites_engagement_counters
  WHERE article_slug = p_article_slug;

  RETURN jsonb_build_object(
    'views', counters.views_count,
    'likes', counters.likes_count,
    'shares', counters.shares_count,
    'liked', visitor.liked
  );
END;
$$;

REVOKE ALL ON FUNCTION public.track_actualites_engagement(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_actualites_engagement(TEXT, UUID, TEXT) TO service_role;