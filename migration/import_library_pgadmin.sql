-- Bibliotheque INPTIC : import idempotent de 57 PDF deja deployes sur le serveur.
-- Dans pgAdmin, choisir la base PostgreSQL du site puis executer tout le fichier (F5).
-- Le script ajoute/met a jour les metadonnees; il ne copie pas les fichiers PDF.

BEGIN;

SELECT pg_advisory_xact_lock(3412025110);

CREATE TEMP TABLE library_books_import_stage (
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  edition TEXT NOT NULL,
  page_count INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  cover_name TEXT,
  PRIMARY KEY (file_name)
) ON COMMIT DROP;

INSERT INTO library_books_import_stage
  (title, author, description, category, language, edition, page_count, file_name, cover_name)
VALUES
  ('Apprenez-a-programmer-en-c', '', '', '', '', '', 409, '14189-apprenez-a-programmer-en-c.pdf', '14189-apprenez-a-programmer-en-c.jpg'),
  ('Administration système réseaux: bases de l''administration (French Edition)', 'Alain MOUHLI', '', '', '', '', 51, 'Administration_systA____me_rA____seaux-_bases_de_la______administration_--_Alain_MOUHLI_--___WeLib.org__.pdf', 'Administration_systA____me_rA____seaux-_bases_de_la______administration_--_Alain_MOUHLI_--___WeLib.org__.jpg'),
  ('Administrez vos bases de données avec MySQL', 'Chantal & GRIBAUMONT', '', '', '', '', 588, 'Administrez_vos_bases_de_donnA____es_avec_MySQ.pdf', 'Administrez_vos_bases_de_donnA____es_avec_MySQ.jpg'),
  ('Applications mathématiques avec Matlab 1. Algèbre linéaire et géométrie', 'Luc Jolivet Rabah Labbas', '', '', '', '', 320, 'algebre_lineaire_et_geometrie_-_rappel_de_cours_et_exercices_corriges.pdf', 'algebre_lineaire_et_geometrie_-_rappel_de_cours_et_exercices_corriges.jpg'),
  ('Algorithmique et programmation en Java - 3e édition', 'Granet', '', '', '', '', 416, 'Algorithmique_et_programmation_en_Java_-_3A____me_A____dition_-_--_Vincent_Granet_--___WeLib.org__.pdf', 'Algorithmique_et_programmation_en_Java_-_3A____me_A____dition_-_--_Vincent_Granet_--___WeLib.org__.jpg'),
  ('Apprendre SQL avec MySQL', 'Soutou, Christian.', '', '', '', '', 418, 'apprendre_sql_avec_mysql.pdf', 'apprendre_sql_avec_mysql.jpg'),
  ('Apprenez le fonctionnement des réseaux TCP/IP', 'Eric Lalitte', '', '', '', '', 348, 'Apprenez_.pdf', 'Apprenez_.jpg'),
  ('Apprenez à  programmer en Python Ed. 4', 'Le Goff, Vincent', '', '', '', '', 516, 'Apprenez_la_programmer_en_Python.pdf', NULL),
  ('Architectures rA parties en Java - middleware Java services -- Fron Annick', '', '', '', '', '', 314, 'Architectures_rA____parties_en_Java_-_middleware_Java__services_--_Fron__Annick_.pdf', 'Architectures_rA____parties_en_Java_-_middleware_Java__services_--_Fron__Annick_.jpg'),
  ('Arduino: Manuel pour apprendre a programmer Arduino (French Edition)', 'Alves, Claudia', '', '', '', '', 128, 'Arduino-_Manuel_pour_apprendre_a_programmer_Arduino__French_--_Alves__Claudia_--___WeLib.org__.pdf', 'Arduino-_Manuel_pour_apprendre_a_programmer_Arduino__French_--_Alves__Claudia_--___WeLib.org__.jpg'),
  ('Les bases d''un réseau informatique | Hypertec SP', 'Josselin ONDO', '', '', '', '', 4, 'BASE-INFO-RESEAU.pdf', 'BASE-INFO-RESEAU.jpg'),
  ('Bases de données', 'Georges Gardarin', '', '', '', '', 826, 'bases_de_donnees.pdf', 'bases_de_donnees.jpg'),
  ('Bases de données sous Linux', 'GregB', '', '', '', '', 510, 'bases_de_donnees_sous_linux.pdf', 'bases_de_donnees_sous_linux.jpg'),
  ('Big data - 30 projets concrets', '', '', '', '', '', 48, 'big_data_-_30_projets_concrets.pdf', 'big_data_-_30_projets_concrets.jpg'),
  ('CISCO-la sécurité des réseaux', '', '', '', '', '', 140, 'CISCO-la_sécurité_des_réseaux.pdf', NULL),
  ('Cisco_Essentiel', 'Administrateur', '', '', '', '', 68, 'Cisco_Essentiel_CCNA_Module_1.pdf', NULL),
  ('CompTIA PenTest+ Study Guide: Exam PT0-001', '', '', '', '', '', 521, 'CompTIA_PenTest__Study_Guide_.pdf', NULL),
  ('Cours', '', '', '', '', '', 15, 'cours.pdf', 'cours.jpg'),
  ('WEB TV :                   DE LA CONCEPTION A LA REALISATION', 'Par Marvel nzenguet', '', '', '', '', 18, 'Cours_WebTV_Marvel_ND_MMi_L2_2023.pdf', 'Cours_WebTV_Marvel_ND_MMi_L2_2023.jpg'),
  ('Des applications ultra-rapides avec Node.js', 'Mathieu & Nebra', '', '', '', '', 112, 'Des_applications_ultra-rapides_avec_Node.js_--_Nebra__Mathieu___--___WeLib.org__.pdf', 'Des_applications_ultra-rapides_avec_Node.js_--_Nebra__Mathieu___--___WeLib.org__.jpg'),
  ('Dive Into Python 3', 'Mark Pilgrim', '', '', '', '', 488, 'Dive-into-Pyhon-3-.pdf', 'Dive-into-Pyhon-3-.jpg'),
  ('Développez votre site web avec le framework Django', '', '', '', '', '', 208, 'Développez_votre_site_web_avec_le_framework_Django.pdf', NULL),
  ('FLUTTER REVOLUTION', '', '', '', '', '', 47, 'ebook-flutter-revolution.pdf', NULL),
  ('Spinoza, Ethique', 'David Bosman', '', '', '', '', 228, 'ethique.pdf', 'ethique.jpg'),
  ('Spinoza, Ethique', 'David Bosman', '', '', '', '', 228, 'ethique_1769155207_1.pdf', NULL),
  ('Spinoza, Ethique', 'David Bosman', '', '', '', '', 228, 'ethique_1769155233_1.pdf', NULL),
  ('Excel® 2010 Fonctions et Formules', 'PREMIUM CONSULTANTS', '', '', '', '', 419, 'Excel_2010_-_fonctions_et_formules_-_maiI____trisez_les_--_Premium_consultants_--___WeLib.org__.pdf', 'Excel_2010_-_fonctions_et_formules_-_maiI____trisez_les_--_Premium_consultants_--___WeLib.org__.jpg'),
  ('Formation word', 'Stéphane Bally', '', '', '', '', 71, 'formation_word.pdf', 'formation_word.jpg'),
  ('Hacking sur le Web 2.0', 'Rich Cannings', '', '', '', '', 302, 'Hacking_sur_le_Web_2.0_-_VulnA____rabilitA_____du_Web_et_solutions_--_Richard_Cannings__Humanshu_Dwivedi__Zane_Lackey_--___WeLib.org__.pdf', 'Hacking_sur_le_Web_2.0_-_VulnA____rabilitA_____du_Web_et_solutions_--_Richard_Cannings__Humanshu_Dwivedi__Zane_Lackey_--___WeLib.org__.jpg'),
  ('Html5 Et Css3 - Ma trisez Les Standards Des Applications Web -- Van Lancker Luc', '', '', '', '', '', 411, 'Html5_Et_Css3_-_Ma_______trisez_Les_Standards_Des_Applications_Web_--_Van_Lancker__Luc_--___WeLib.org__.pdf', 'Html5_Et_Css3_-_Ma_______trisez_Les_Standards_Des_Applications_Web_--_Van_Lancker__Luc_--___WeLib.org__.jpg'),
  ('Initiation à l''algorithmique et à la programmation en C', 'Rémy Malgouyres, Rita Zrour, Fabien Feschet', '', '', '', '', 335, 'Initiation_A_____lalgorithmique_et_A_____la_programmation_en_C.pdf', 'Initiation_A_____lalgorithmique_et_A_____la_programmation_en_C.jpg'),
  ('Introduction à l''algorithmique', '', '', '', '', '', 1176, 'Introduction______lalgorithmique_-_Cours_et_exercices_--_Thomas_H._Cormen__Leiserson__Ronald_L._Rivest_--___WeLib.org__.pdf', 'Introduction______lalgorithmique_-_Cours_et_exercices_--_Thomas_H._Cormen__Leiserson__Ronald_L._Rivest_--___WeLib.org__.jpg'),
  ('Conception des bases de données I : Introduction aux bases de données relationnelles', '', '', '', '', '', 112, 'introduction_aux_bases_de_donnees_relationnelles.pdf', 'introduction_aux_bases_de_donnees_relationnelles.jpg'),
  ('Introduction_Reseau', 'Aicha', '', '', '', '', 58, 'Introduction_Reseau-MMI.pdf', 'Introduction_Reseau-MMI.jpg'),
  ('JavaScript - Des fondamentaux aux concepts avanc s -- Emmanuel Gutierrez', '', '', '', '', '', 189, 'JavaScript_-_Des_fondamentaux_aux_concepts_avanc_______s_--_Emmanuel_Gutierrez_--___WeLib.org__.pdf', 'JavaScript_-_Des_fondamentaux_aux_concepts_avanc_______s_--_Emmanuel_Gutierrez_--___WeLib.org__.jpg'),
  ('JavaScript pour les Nuls grand format, 2e édition', 'Eva Holland & Chris Minnick', '', '', '', '', 517, 'JavaScript_Pour_les_Nuls_French_Edition_Minnick__Chris__Holland.pdf', 'JavaScript_Pour_les_Nuls_French_Edition_Minnick__Chris__Holland.jpg'),
  ('KALI LINUX HACKING ÉTHIQUE Édition 2024: Un Guide Complet pour Étudiants et Professionnels (French Edition)', 'Rodrigues, Diego', '', '', '', '', 162, 'KALI-LINUX-HACKING-A____THIQUE-Un-Guide-Complet-pour-Diego-Rodriguez.pdf', 'KALI-LINUX-HACKING-A____THIQUE-Un-Guide-Complet-pour-Diego-Rodriguez.jpg'),
  ('Bazaar', 'King', '', '', '', '', 799, 'king_stephen_1991_bazaar_needfulthings_2.pdf', 'king_stephen_1991_bazaar_needfulthings_2.jpg'),
  ('L encyclopedie big data', '', '', '', '', '', 202, 'l_encyclopedie_big_data.pdf', 'l_encyclopedie_big_data.jpg'),
  ('Laravel 4 Cookbook', '', '', '', '', '', 386, 'Laravel_4_Cookbook.pdf', 'Laravel_4_Cookbook.jpg'),
  ('L''ART DE MAITRISER EXCEL: Tout ce qu''il te faut pour être AUTONOME et PRODUCTIF avec Microsoft Excel (French Edition)', 'BOH, Fabrice', '', '', '', '', 126, 'LART-DE-MAITRISER-EXCEL-Tout-ce-quil-te-faut-pour-A____tre-BOH_-Fabrice-_-WeLib.org-_.pdf', 'LART-DE-MAITRISER-EXCEL-Tout-ce-quil-te-faut-pour-A____tre-BOH_-Fabrice-_-WeLib.org-_.jpg'),
  ('Les bases du hacking (Référence) (French Edition)', 'Engebretson, Patrick', '', '', '', '', 369, 'Les_bases_du_hacking__RA____fA____rence___French_Edition__--_Engebretson__Patrick_--___WeLib.org__.pdf', 'Les_bases_du_hacking__RA____fA____rence___French_Edition__--_Engebretson__Patrick_--___WeLib.org__.jpg'),
  ('Les capteurs pour Arduino et Raspberry Pi - Tutoriels et -- Karvinen Kimmo Karvinen Tero Maniez Dominique', '', '', '', '', '', 297, 'Les_capteurs_pour_Arduino_et_Raspberry_Pi_-_Tutoriels_et_--_Karvinen__Kimmo__Karvinen__Tero__Maniez__Dominique__--___WeLib.org__.pdf', 'Les_capteurs_pour_Arduino_et_Raspberry_Pi_-_Tutoriels_et_--_Karvinen__Kimmo__Karvinen__Tero__Maniez__Dominique__--___WeLib.org__.jpg'),
  ('Linux - maitrisez ladministration du syst me 2e dition -- S bastien Rohaut', '', '', '', '', '', 489, 'Linux_-_maitrisez_ladministration_du_syst____me__2e________dition__--__S_______bastien_Rohaut__--___WeLib.org__.pdf', 'Linux_-_maitrisez_ladministration_du_syst____me__2e________dition__--__S_______bastien_Rohaut__--___WeLib.org__.jpg'),
  ('Microsoft Word - Cours d''Algorithme.doc', 'Perso', '', '', '', '', 248, 'Microsoft__dAlgorithme.doc_--_Perso_--.pdf', 'Microsoft__dAlgorithme.doc_--_Perso_--.jpg'),
  ('Programmation en PL/SQL Oracle', 'RAYD HAMZA', '', '', '', '', 47, 'PL_SQL_Oracle.pdf', 'PL_SQL_Oracle.jpg'),
  ('Powerpoint', 'Stéphane Bally', '', '', '', '', 47, 'powerpoint.pdf', 'powerpoint.jpg'),
  ('Formation PowerPoint', '', '', '', '', '', 55, 'powerpoint_new-edit.pdf', 'powerpoint_new-edit.jpg'),
  ('Pratique de MySQL et PHP', 'Rigaux', '', '', '', '', 557, 'Pratique_de_MySQL_et_PHP_-_Conception_et_realisation_de_--_Philippe_Rigaux_--___WeLib.org__.pdf', 'Pratique_de_MySQL_et_PHP_-_Conception_et_realisation_de_--_Philippe_Rigaux_--___WeLib.org__.jpg'),
  ('Prenez en main Bootstrap -- Maurice Chavelli', '', '', '', '', '', 317, 'Prenez_en_main_Bootstrap_--_Maurice_Chavelli_--___WeLib.org__.pdf', 'Prenez_en_main_Bootstrap_--_Maurice_Chavelli_--___WeLib.org__.jpg'),
  ('Programmer sous access', '', '', '', '', '', 235, 'programmer_sous_access.pdf', 'programmer_sous_access.jpg'),
  ('RAPPORT Ffinal', '', '', '', '', '', 46, 'RAPPORT_Ffinal_.pdf', 'RAPPORT_Ffinal_.jpg'),
  ('Réseaux et télécoms', '', '', '', '', '', 837, 'Reseaux_et_telecom.pdf', 'Reseaux_et_telecom.jpg'),
  ('Sécurité Du Périmètre Réseau: Bases de la sécurité réseau (French Edition)', 'Alain MOUHLI', '', '', '', '', 65, 'SA____curitA_____Du_PA____rimA____tre_RA____seau-_Bases_de_la_sA____curitA____.pdf', 'SA____curitA_____Du_PA____rimA____tre_RA____seau-_Bases_de_la_sA____curitA____.jpg'),
  ('Shells Linux et Unix par la pratique', 'Christophe Blaess', '', '', '', '', 275, 'Shells_Linux_et_Unix_par_la_pratique__EYROLLES__--_Christophe_Blaess_.pdf', 'Shells_Linux_et_Unix_par_la_pratique__EYROLLES__--_Christophe_Blaess_.jpg'),
  ('S''initier à la programmation', 'Claude Delannoy', '', '', '', '', 370, 'SINITIER_A_LA_PROGRAMMATION._AVEC_DES_EXEMPLES_EN_C__C____--_Claude_Delannoy_--___WeLib.org__.pdf', 'SINITIER_A_LA_PROGRAMMATION._AVEC_DES_EXEMPLES_EN_C__C____--_Claude_Delannoy_--___WeLib.org__.jpg'),
  ('Microsoft PowerPoint - CLIENT_1_HTML.ppt', 'nlt', '', '', '', '', 28, 'xhtml.pdf', 'xhtml.jpg');

DO $$
BEGIN
  IF to_regclass('public.library_books') IS NULL THEN
    RAISE EXCEPTION 'La table public.library_books est absente. Appliquez d abord scripts/25_create_library.sql.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_temp.library_books_import_stage
    WHERE btrim(title) = '' OR length(title) > 300
       OR file_name = '' OR position('/' IN file_name) > 0 OR position(chr(92) IN file_name) > 0
       OR lower(right(file_name, 4)) <> '.pdf'
       OR length(author) > 200 OR length(description) > 12000
       OR length(category) > 120 OR length(language) > 80 OR length(edition) > 120
       OR page_count < 0 OR page_count > 100000
       OR (cover_name IS NOT NULL AND (
            position('/' IN cover_name) > 0 OR position(chr(92) IN cover_name) > 0
            OR NOT (lower(right(cover_name, 4)) IN ('.jpg', '.png', '.webp') OR lower(right(cover_name, 5)) = '.jpeg')
       ))
  ) THEN
    RAISE EXCEPTION 'Une ligne contient des metadonnees ou un nom de fichier invalide.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_temp.library_books_import_stage
    GROUP BY lower(file_name) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Le CSV contient plusieurs fois le meme nom de PDF.';
  END IF;

  IF EXISTS (
    SELECT s.file_name FROM pg_temp.library_books_import_stage s
    JOIN public.library_books b ON b.legacy_file_name = s.file_name AND b.file_path IS NULL
    GROUP BY s.file_name HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Plusieurs livres existants utilisent le meme nom de PDF; aucun changement effectue.';
  END IF;
END $$;

CREATE TEMP TABLE library_books_import_existing ON COMMIT DROP AS
SELECT s.file_name
FROM pg_temp.library_books_import_stage s
JOIN public.library_books b ON b.legacy_file_name = s.file_name AND b.file_path IS NULL;

UPDATE public.library_books b
SET title = s.title,
    author = COALESCE(NULLIF(s.author, ''), b.author),
    description = COALESCE(NULLIF(s.description, ''), b.description),
    category = COALESCE(NULLIF(s.category, ''), b.category),
    language = COALESCE(NULLIF(s.language, ''), b.language),
    edition = COALESCE(NULLIF(s.edition, ''), b.edition),
    page_count = CASE WHEN s.page_count > 0 THEN s.page_count ELSE b.page_count END,
    legacy_cover_name = COALESCE(s.cover_name, b.legacy_cover_name),
    is_public = TRUE,
    updated_at = NOW()
FROM pg_temp.library_books_import_stage s
WHERE b.legacy_file_name = s.file_name AND b.file_path IS NULL;

INSERT INTO public.library_books
  (title, author, description, category, language, edition, page_count,
   legacy_file_name, legacy_cover_name, is_public)
SELECT s.title, s.author, s.description, s.category, s.language, s.edition, s.page_count,
       s.file_name, s.cover_name, TRUE
FROM pg_temp.library_books_import_stage s
WHERE NOT EXISTS (
  SELECT 1 FROM public.library_books b
  WHERE b.legacy_file_name = s.file_name AND b.file_path IS NULL
);

SELECT
  (SELECT count(*) FROM pg_temp.library_books_import_stage) AS total,
  (SELECT count(*) FROM pg_temp.library_books_import_existing) AS updated,
  (SELECT count(*) FROM pg_temp.library_books_import_stage)
    - (SELECT count(*) FROM pg_temp.library_books_import_existing) AS inserted;

COMMIT;
