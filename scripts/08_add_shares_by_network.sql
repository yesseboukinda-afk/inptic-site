-- Migration : détail des partages par réseau social
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter les colonnes par réseau sur la table des compteurs
ALTER TABLE public.actualites_engagement_counters
  ADD COLUMN IF NOT EXISTS shares_whatsapp BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_facebook BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_linkedin BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_youtube  BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_mail     BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_tiktok   BIGINT NOT NULL DEFAULT 0;

-- 2. Ajouter les colonnes réseau chez les visiteurs pour éviter les doublons
ALTER TABLE public.actualites_engagement_visitors
  ADD COLUMN IF NOT EXISTS shared_whatsapp BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_facebook BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_linkedin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_youtube  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_mail     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_tiktok   BOOLEAN NOT NULL DEFAULT false;

-- 3. Remplacer la fonction RPC
CREATE OR REPLACE FUNCTION public.track_actualites_engagement(
  p_article_slug TEXT,
  p_visitor_id   UUID,
  p_action       TEXT,
  p_network      TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  visitor  actualites_engagement_visitors%ROWTYPE;
  counters actualites_engagement_counters%ROWTYPE;
  v_already_shared BOOLEAN;
BEGIN
  IF p_article_slug IS NULL OR length(p_article_slug) = 0 OR length(p_article_slug) > 200 THEN
    RAISE EXCEPTION 'Invalid article slug';
  END IF;
  IF p_action NOT IN ('view', 'like', 'share') THEN
    RAISE EXCEPTION 'Invalid engagement action';
  END IF;
  IF p_action = 'share' AND p_network IS NOT NULL
     AND p_network NOT IN ('whatsapp', 'facebook', 'linkedin', 'youtube', 'mail', 'tiktok') THEN
    RAISE EXCEPTION 'Invalid share network';
  END IF;

  INSERT INTO actualites_engagement_counters (article_slug)
    VALUES (p_article_slug) ON CONFLICT (article_slug) DO NOTHING;
  INSERT INTO actualites_engagement_visitors (article_slug, visitor_id)
    VALUES (p_article_slug, p_visitor_id) ON CONFLICT (article_slug, visitor_id) DO NOTHING;

  SELECT * INTO visitor FROM actualites_engagement_visitors
    WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id FOR UPDATE;

  IF p_action = 'view' AND visitor.last_viewed_on IS DISTINCT FROM CURRENT_DATE THEN
    UPDATE actualites_engagement_visitors SET last_viewed_on = CURRENT_DATE
      WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
    UPDATE actualites_engagement_counters SET views_count = views_count + 1
      WHERE article_slug = p_article_slug;

  ELSIF p_action = 'like' THEN
    UPDATE actualites_engagement_visitors SET liked = NOT visitor.liked
      WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
    UPDATE actualites_engagement_counters
      SET likes_count = GREATEST(0, likes_count + CASE WHEN visitor.liked THEN -1 ELSE 1 END)
      WHERE article_slug = p_article_slug;

  ELSIF p_action = 'share' THEN
    v_already_shared := CASE p_network
      WHEN 'whatsapp' THEN visitor.shared_whatsapp
      WHEN 'facebook' THEN visitor.shared_facebook
      WHEN 'linkedin' THEN visitor.shared_linkedin
      WHEN 'youtube'  THEN visitor.shared_youtube
      WHEN 'mail'     THEN visitor.shared_mail
      WHEN 'tiktok'   THEN visitor.shared_tiktok
      ELSE visitor.shared
    END;

    IF NOT v_already_shared THEN
      IF p_network = 'whatsapp' THEN
        UPDATE actualites_engagement_visitors SET shared_whatsapp = true, shared = true
          WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
        UPDATE actualites_engagement_counters
          SET shares_count = shares_count + 1, shares_whatsapp = shares_whatsapp + 1
          WHERE article_slug = p_article_slug;
      ELSIF p_network = 'facebook' THEN
        UPDATE actualites_engagement_visitors SET shared_facebook = true, shared = true
          WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
        UPDATE actualites_engagement_counters
          SET shares_count = shares_count + 1, shares_facebook = shares_facebook + 1
          WHERE article_slug = p_article_slug;
      ELSIF p_network = 'linkedin' THEN
        UPDATE actualites_engagement_visitors SET shared_linkedin = true, shared = true
          WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
        UPDATE actualites_engagement_counters
          SET shares_count = shares_count + 1, shares_linkedin = shares_linkedin + 1
          WHERE article_slug = p_article_slug;
      ELSIF p_network = 'youtube' THEN
        UPDATE actualites_engagement_visitors SET shared_youtube = true, shared = true
          WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
        UPDATE actualites_engagement_counters
          SET shares_count = shares_count + 1, shares_youtube = shares_youtube + 1
          WHERE article_slug = p_article_slug;
      ELSIF p_network = 'mail' THEN
        UPDATE actualites_engagement_visitors SET shared_mail = true, shared = true
          WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
        UPDATE actualites_engagement_counters
          SET shares_count = shares_count + 1, shares_mail = shares_mail + 1
          WHERE article_slug = p_article_slug;
      ELSIF p_network = 'tiktok' THEN
        UPDATE actualites_engagement_visitors SET shared_tiktok = true, shared = true
          WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
        UPDATE actualites_engagement_counters
          SET shares_count = shares_count + 1, shares_tiktok = shares_tiktok + 1
          WHERE article_slug = p_article_slug;
      ELSE
        IF NOT visitor.shared THEN
          UPDATE actualites_engagement_visitors SET shared = true
            WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
          UPDATE actualites_engagement_counters SET shares_count = shares_count + 1
            WHERE article_slug = p_article_slug;
        END IF;
      END IF;
    END IF;
  END IF;

  SELECT * INTO visitor FROM actualites_engagement_visitors
    WHERE article_slug = p_article_slug AND visitor_id = p_visitor_id;
  SELECT * INTO counters FROM actualites_engagement_counters
    WHERE article_slug = p_article_slug;

  RETURN jsonb_build_object(
    'views',           counters.views_count,
    'likes',           counters.likes_count,
    'shares',          counters.shares_count,
    'shares_whatsapp', counters.shares_whatsapp,
    'shares_facebook', counters.shares_facebook,
    'shares_linkedin', counters.shares_linkedin,
    'shares_youtube',  counters.shares_youtube,
    'shares_mail',     counters.shares_mail,
    'shares_tiktok',   counters.shares_tiktok,
    'liked',           visitor.liked
  );
END;
$$;

REVOKE ALL ON FUNCTION public.track_actualites_engagement(TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_actualites_engagement(TEXT, UUID, TEXT, TEXT) TO service_role;
