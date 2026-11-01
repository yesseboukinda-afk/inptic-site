BEGIN;

DELETE FROM public.publications
WHERE slug IN (
  'deploiement-resilience-iot-foret-equatoriale-gabon',
  'cybersecurite-souveraine-si-administrations-publiques',
  'optimisation-routage-fibre-ftth-libreville',
  'apprentissage-automatique-langues-nationales-gabon'
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.publications
TO "c1668531c_inptic-site";

COMMIT;
