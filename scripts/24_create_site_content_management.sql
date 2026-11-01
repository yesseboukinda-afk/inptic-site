BEGIN;

CREATE TABLE IF NOT EXISTS public.site_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 140),
  presentation TEXT NOT NULL CHECK (length(trim(presentation)) BETWEEN 10 AND 3000),
  opportunities JSONB NOT NULL CHECK (
    jsonb_typeof(opportunities) = 'array'
    AND jsonb_array_length(opportunities) BETWEEN 1 AND 20
  ),
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS site_tracks_name_normalized_idx
  ON public.site_tracks (lower(trim(name)));

CREATE TABLE IF NOT EXISTS public.site_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 180),
  presentation TEXT NOT NULL CHECK (length(trim(presentation)) BETWEEN 10 AND 3000),
  issuer TEXT CHECK (issuer IS NULL OR length(trim(issuer)) <= 180),
  duration TEXT CHECK (duration IS NULL OR length(trim(duration)) <= 120),
  website TEXT CHECK (website IS NULL OR website ~* '^https?://'),
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS site_certifications_name_normalized_idx
  ON public.site_certifications (lower(trim(name)));

CREATE TABLE IF NOT EXISTS public.site_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 180),
  category TEXT NOT NULL CHECK (category IN ('diplomante', 'qualifiante')),
  track_id UUID REFERENCES public.site_tracks(id) ON DELETE RESTRICT,
  presentation TEXT NOT NULL CHECK (length(trim(presentation)) BETWEEN 10 AND 3000),
  opportunities JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (
    jsonb_typeof(opportunities) = 'array'
    AND jsonb_array_length(opportunities) <= 20
  ),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_trainings_track_required CHECK (category <> 'diplomante' OR track_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS site_trainings_name_normalized_idx
  ON public.site_trainings (lower(trim(name)));

CREATE TABLE IF NOT EXISTS public.site_media (
  slot TEXT PRIMARY KEY,
  storage_path TEXT NOT NULL UNIQUE,
  updated_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_media_slot_format CHECK (
    slot ~ '^(banniere|formations|institut)/[A-Za-z0-9._-]+$'
  )
);

INSERT INTO public.site_tracks (name, presentation, opportunities)
VALUES
  (
    'Management des TIC',
    'Des profils orientés gestion, marketing, commerce et transformation digitale.',
    '["Chargé de marketing digital","Chef de projet transformation numérique","Commercial TIC / gestionnaire de comptes","Responsable e-commerce et CRM","Consultant en innovation digitale"]'::jsonb
  ),
  (
    'Réseaux et Systèmes Numériques',
    'Des compétences techniques dans les systèmes, les données, les réseaux et la cybersécurité.',
    '["Administrateur système et réseau","Spécialiste support infrastructure","Analyste sécurité informatique","Administrateur de bases de données","Développeur applications réparties"]'::jsonb
  ),
  (
    'Génie informatique',
    'Des compétences en développement logiciel, applications réparties, systèmes d’information et bases de données.',
    '["Développeur logiciel","Développeur d’applications réparties","Administrateur de bases de données","Analyste-programmeur","Ingénieur en systèmes d’information"]'::jsonb
  ),
  (
    'Audiovisuel',
    'Des métiers liés à la création audiovisuelle, à l’image, au son et à la production.',
    '["Monteur vidéo","Cadreur / chef opérateur","Assistant réalisateur","Technicien du son","Producteur audiovisuel et gestionnaire de contenu"]'::jsonb
  ),
  (
    'Monétique et Systèmes Transactionnels',
    'Une filière consacrée aux systèmes de paiement électronique, aux transactions et aux services financiers numériques.',
    '["Technicien monétique","Gestionnaire de systèmes de paiement","Intégrateur de solutions transactionnelles","Support aux services financiers numériques"]'::jsonb
  ),
  (
    'Cybersécurité',
    'Une spécialisation sur la protection des systèmes, réseaux et données numériques.',
    '["Analyste en sécurité informatique","Administrateur sécurité réseau","Technicien sécurité des systèmes d’information","Assistant conformité sécurité"]'::jsonb
  ),
  (
    'E-learning',
    'Une filière orientée vers la conception, la mise en œuvre et l’accompagnement de dispositifs de formation à distance.',
    '["Concepteur de contenus pédagogiques numériques","Administrateur de plateforme e-learning","Formateur aux outils numériques","Assistant ingénierie pédagogique"]'::jsonb
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.site_trainings (name, category, track_id, presentation)
SELECT item.name, 'diplomante', track.id,
       'Formation diplômante de l’INPTIC : ' || item.name || '.'
FROM (VALUES
  ('Management des TIC', 'Licence Professionnelle Techniques de Commercialisation des TIC'),
  ('Management des TIC', 'Licence Professionnelle E-commerce & Marketing Digital'),
  ('Management des TIC', 'Licence Professionnelle Technologies de l’Information et de la Communication (TIC)'),
  ('Réseaux et Systèmes Numériques', 'Licence Professionnelle Réseaux et Télécommunications'),
  ('Réseaux et Systèmes Numériques', 'Licence Professionnelle Administration et Sécurité des Réseaux'),
  ('Génie informatique', 'Licence Professionnelle Développement d’Applications Réparties'),
  ('Génie informatique', 'Licence Professionnelle Systèmes d''Information et Bases de Données'),
  ('Audiovisuel', 'Licence Professionnelle en Son'),
  ('Audiovisuel', 'Licence Professionnelle en Image'),
  ('Audiovisuel', 'Licence Professionnelle en Montage'),
  ('Audiovisuel', 'Licence Professionnelle Réalisation / Production / Script')
) AS item(track_name, name)
JOIN public.site_tracks AS track ON track.name = item.track_name
ON CONFLICT DO NOTHING;

INSERT INTO public.site_trainings (name, category, track_id, presentation)
VALUES
  ('Internet des Objets (IoT) et réseaux de capteurs', 'qualifiante', NULL, 'Formation qualifiante en Internet des Objets et réseaux de capteurs.'),
  ('Cybersécurité et protection des infrastructures télécoms', 'qualifiante', NULL, 'Formation qualifiante en cybersécurité et protection des infrastructures télécoms.'),
  ('Formation à l’usage des TIC', 'qualifiante', NULL, 'Formation qualifiante consacrée à l’usage professionnel des TIC.'),
  ('Infographie et montage vidéo', 'qualifiante', NULL, 'Formation qualifiante en infographie et montage vidéo.'),
  ('Marketing numérique', 'qualifiante', NULL, 'Formation qualifiante en marketing numérique.'),
  ('Cybersécurité', 'qualifiante', NULL, 'Formation qualifiante en cybersécurité.'),
  ('Intelligence Artificielle', 'qualifiante', NULL, 'Formation qualifiante en intelligence artificielle.'),
  ('Développement Web', 'qualifiante', NULL, 'Formation qualifiante en développement web.'),
  ('Journaliste Reporter d’Images (JRI)', 'qualifiante', NULL, 'Formation qualifiante au journalisme et au reportage d’images.')
ON CONFLICT DO NOTHING;

INSERT INTO public.site_certifications (name, presentation)
VALUES
  (
    'Intelligence Artificielle',
    'Certification orientée vers l’analyse de données, la modélisation et l’automatisation.'
  ),
  (
    'Internet des Objets (AET/IoT)',
    'Certification sur les objets connectés et la gestion intelligente des réseaux.'
  ),
  (
    'Big Data',
    'Des compétences sur la collecte, l’analyse et l’exploitation des données massives.'
  ),
  (
    'Cybersécurité',
    'Une spécialisation sur la protection des systèmes, réseaux et données numériques.'
  ),
  (
    'Cloud Computing',
    'Des compétences en migration, administration et sécurisation des services cloud.'
  )
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'c1668531c_inptic-site') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE
      ON TABLE public.site_tracks, public.site_certifications, public.site_trainings, public.site_media
      TO "c1668531c_inptic-site";
    GRANT SELECT, INSERT, DELETE
      ON TABLE public.private_files
      TO "c1668531c_inptic-site";
  END IF;
END $$;

COMMIT;
