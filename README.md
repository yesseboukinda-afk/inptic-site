# INPTIC — maquette fonctionnelle

## Installation
1. Installer Node.js 20+.
2. `npm install`
3. Copier `.env.example` vers `.env.local` et renseigner les services.
4. `npm run dev`

## Assistante Sohane

Le bouton Assistant et la page `/chatbot` ouvrent Sohane via `/api/chat`. Elle
répond aux questions générales et sur l'INPTIC, peut être utilisée à la voix,
ouvrir des recherches Web et conserver des souvenirs dans le navigateur de
l'utilisateur. Les souvenirs ne sont pas synchronisés avec le serveur. Les
commandes « souviens-toi que… », « montre ma mémoire » et « oublie tout »
permettent de les gérer. « Cherche sur internet… » ouvre une recherche Google
dans un nouvel onglet. L'ouverture de Chrome et de VS Code est adaptée au Web :
le navigateur ne peut pas lancer des applications installées sur l'appareil.

Le superadmin choisit le fournisseur et le modèle actifs depuis
`/admin/ai-settings`. Pour Sohane avec Ollama, installer Ollama sur le serveur,
télécharger le modèle `llama3.2`, puis sélectionner « Ollama sur le serveur »
et tester/enregistrer la configuration. Le modèle proposé par défaut est
`llama3.2`. `OLLAMA_BASE_URL` est défini uniquement côté serveur (par défaut
`http://127.0.0.1:11434`) ; l'interface refuse une URL HTTP non locale. Ne rendez
pas l'API Ollama publiquement accessible. La disponibilité d'Ollama et les
ressources nécessaires doivent être vérifiées sur l'hébergement avant activation.

La reconnaissance vocale utilise les capacités du navigateur. La lecture vocale
utilise Gemini TTS si `GEMINI_API_KEY` est configurée (`GEMINI_TTS_MODEL` vaut
par défaut `gemini-3.8-flash-tts`) ; sinon, l'interface utilise une voix française
disponible dans le navigateur. Les clés restent côté serveur et ne doivent jamais
être préfixées par `NEXT_PUBLIC_`.

La configuration des fournisseurs est stockée dans PostgreSQL. La table se crée
avec `scripts/00_lws_complete_schema.sql` ou `scripts/13_lws_application_schema.sql` ;
sur une base déjà installée, exécuter `scripts/19_create_ai_provider_settings.sql`.
Configurez aussi `AI_SETTINGS_ENCRYPTION_KEY` avec une clé aléatoire de 32 octets
hexadécimaux (par exemple `openssl rand -hex 32`) dans l'environnement serveur
avant d'enregistrer des identifiants. Conservez cette clé durablement : la changer
rend les clés stockées illisibles. Les fournisseurs pris en charge sont Qwen,
Groq, Claude, Gemini, DeepSeek, OpenAI, OpenRouter et Ollama. Les clés ne sont
jamais renvoyées au navigateur ; chaque nouvelle configuration est testée avant
son activation.

Après la création du schéma applicatif sur une nouvelle base, ou pour mettre à jour
une base existante, exécutez `scripts/20_create_clubs.sql`. Les responsables sont créés depuis
`/admin`, avec le service « Gestion des clubs » et le club qui leur est attribué.
Les étudiants peuvent candidater à un seul sous-club à la fois, parmi les disciplines
sportives ou les activités de création numérique (développement, réseau, infographie
et audiovisuel). Tous les visiteurs peuvent aimer ou ne plus aimer chaque club ; les
clubs sont classés selon le nombre de likes. Le choix est associé à un cookie du
navigateur (et non à un compte utilisateur), donc l'exécution de la migration
`scripts/20_create_clubs.sql` est nécessaire pour activer les likes en production.
Pour activer le fil de photos des clubs, exécutez aussi
`scripts/23_club_news_feed.sql` sur la base PostgreSQL LWS. Les responsables de
club publient une photo JPG, PNG ou WebP (5 Mo maximum) avec une légende
facultative ; les visiteurs peuvent consulter le fil depuis le dossier du club.

L'interface active de l'assistant est maintenue dans
`chatbot/components/inptic-chat-page.tsx` et montée sur `/chatbot` par
`app/chatbot/page.tsx`. Elle utilise les routes API de l'application principale,
notamment `/api/chat`, afin de reprendre le fournisseur choisi dans les réglages
superadmin. Le template autonome conserve ses dépendances et ses composants dans
`chatbot/`, mais ses pages et son authentification ne sont pas lancées comme une
seconde application.

Les artefacts éditables (documents, code et tableurs), les votes et l'historique
persistant restent des fonctionnalités séparées du template source : ils nécessitent
une base de données et un espace d'édition dédiés.

## Authentification PostgreSQL/LWS

Les inscriptions, connexions, sessions et réinitialisations de mot de passe
utilisent PostgreSQL. Les sessions sont des jetons aléatoires hachés en base et
transmis au navigateur uniquement dans un cookie `HttpOnly`, `Secure` en
production et `SameSite=Lax`. Les mots de passe sont hachés avec scrypt. Les
nouveaux comptes doivent confirmer leur adresse e-mail avant de se connecter.

Avant d'activer le parcours :

1. Créer une base PostgreSQL dans le panneau LWS, puis exécuter une seule fois
   `scripts/00_lws_complete_schema.sql` dans cette base.
2. Configurer côté serveur `DATABASE_URL`, `AUTH_SITE_URL` (origine HTTPS du site)
   et les variables SMTP LWS `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
   `SMTP_USER`, `SMTP_PASSWORD` et `SMTP_FROM_EMAIL`. L'adresse expéditrice
   utilisée est `inptic@inptic-ga.org`. Ne pas donner le préfixe `NEXT_PUBLIC_`
   aux secrets SMTP.
3. Pour activer la connexion Google, créer un client OAuth de type application
   Web dans Google Cloud Console, ajouter comme URI de callback
   `https://votre-domaine.tld/api/auth/oauth/callback`, puis configurer les
   identifiants serveur `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`.
   La connexion Google est facultative.
4. Depuis la racine du projet, construire avec `npm run build:next`, puis
   redémarrer l'application Node.js LWS. Cette commande génère les types de
   routes, lance `tsc --noEmit`, puis construit avec Webpack. Le contrôle de
   types séparé évite de relancer le vérificateur interne de Next.js, qui peut
   échouer sur certains hébergements mutualisés limitant la création de processus.
   La version de Next.js est épinglée à celle validée pour ce déploiement ; exécuter
   `npm install` après le transfert pour que l'environnement LWS prenne en compte
   cette version exacte. La configuration de build limite Next.js à un worker et
   active ses optimisations mémoire pour réduire le pic de consommation sur
   l'hébergement mutualisé.

Les comptes de l'ancien hébergement ne sont pas repris. L'inscription publique
ne peut créer que des comptes étudiants. Pour créer un compte administrateur,
utiliser la commande sécurisée ci-dessous depuis le serveur.

Pour créer un compte administrateur sans inscription publique, lancer
`npm run create-admin` depuis le répertoire du projet sur le serveur. La commande
utilise `DATABASE_URL` si elle est disponible dans l'environnement du terminal ;
sinon, elle la demande sans afficher la saisie. Elle demande ensuite l'adresse,
le nom et le mot de passe (saisi et confirmé sans affichage), hache le mot de
passe avec scrypt et crée un compte vérifié de rôle `admin` ou `superadmin`.
Un compte admin doit recevoir un unique service (`scolarite`, `communication`,
`direction_etudes` ou `rh`); seul le superadmin a accès à tous les espaces. Elle
n'écrase jamais un compte existant. Ne pas enregistrer ni partager l'URL de
connexion ou le mot de passe.

Les comptes ayant le rôle `superadmin` sont dirigés vers `/admin`. Ce tableau de
bord permet de créer et supprimer les comptes du personnel, de les rechercher
et de les filtrer par service et rôle. Un admin ne reçoit qu'un service et ne
voit que son espace dans la navigation; les API serveur vérifient également
cette attribution. Seul le superadmin voit tous les liens de gestion et peut
accéder à tous les espaces. La création active l'adresse et stocke uniquement
un hash scrypt du mot de passe. La suppression révoque les sessions en
supprimant le compte d'authentification ; le dernier superadmin et le compte
connecté ne peuvent pas être supprimés depuis l'interface. Les comptes
étudiants ne sont pas gérés dans cette liste.

Tout compte connecté peut ouvrir les paramètres de compte avec l'icône
d'engrenage du bandeau. Le titulaire peut demander un changement d'adresse
e-mail après vérification de son mot de passe actuel ; la nouvelle adresse
reste en attente jusqu'à sa confirmation par e-mail, puis les dossiers liés
sont mis à jour. Le mot de passe peut également être changé après vérification
du mot de passe actuel ; les sessions précédentes sont alors révoquées.

## Migration PostgreSQL vers LWS

`DATABASE_URL` et le module `lib/postgres.ts` fournissent la connexion serveur.
Le script unique `scripts/00_lws_complete_schema.sql` crée toutes les tables et
index PostgreSQL nécessaires à l'application. Il cible PostgreSQL 13 ou plus
récent. Pour ce déploiement neuf, aucune donnée de l'ancien hébergement n'est
importée.

Pour une base existante, exécuter `scripts/14_migrate_rh_direction_service.sql`
avant de déployer la nouvelle version RH. Ce script sépare les anciennes
affectations en direction et service sans supprimer la valeur historique.
Pour retirer les anciennes publications d'exemple et rétablir les droits de
gestion du catalogue sur une base LWS déjà installée, exécuter
`scripts/21_clean_placeholder_publications.sql` après le déploiement.

Pour créer automatiquement la base puis son schéma, le script
`scripts/create-lws-database.sh` requiert `psql` et un compte PostgreSQL ayant le
droit `CREATEDB` :

```sh
export LWS_ADMIN_DATABASE_URL='postgresql://ADMIN:***@HOTE:5432/postgres'
export LWS_DATABASE_URL='postgresql://UTILISATEUR:***@HOTE:5432/NOM_BASE'
export LWS_DATABASE_NAME='NOM_BASE'
# Facultatif : propriétaire de la base (le compte de connexion sinon).
export LWS_DATABASE_OWNER='UTILISATEUR'
bash scripts/create-lws-database.sh
```

Le script crée la base si elle n'existe pas, vérifie que `LWS_DATABASE_URL`
pointe vers le nom demandé, puis applique le schéma complet. Il ne supprime pas
une base existante. Sur une offre LWS qui interdit `CREATEDB` ou la création
d'une base par connexion distante, créer la base dans le panneau LWS puis exécuter
le même script : il ne fera que vérifier la base et installer ses tables. Le
script SQL est PostgreSQL : ne pas le coller dans phpMyAdmin, qui administre
MySQL/MariaDB et ne comprend ni `UUID`, ni `JSONB`, ni `TIMESTAMPTZ`. Utiliser
un outil connecté au serveur PostgreSQL LWS. Les URL et mots de passe ci-dessus
sont des exemples ; ne les commitez pas et ne les envoyez pas dans une conversation.

Les routes métier, l'authentification, les profils candidats, les profils RH et la
newsletter utilisent PostgreSQL. Les fichiers publics et les dossiers candidats
sont stockés sur le disque persistant défini par `PRIVATE_STORAGE_DIR`; leurs
métadonnées sont dans `private_files`. Les dossiers candidats restent privés et
sont servis par une route qui vérifie la session et l'appartenance du document.

Pour une base LWS déjà créée, exécuter `scripts/15_repair_homepage_agenda.sql`,
`scripts/16_alumni_verified_ownership.sql`, `scripts/17_create_site_audit_logs.sql`
puis `scripts/18_grant_lws_audit_runtime.sql` dans PostgreSQL. L'agenda est alors
réparé même si une table incomplète existe déjà. Le dernier script restaure les
droits de lecture et d'écriture limités aux journaux pour le rôle applicatif LWS
vérifié. L'annuaire Alumni est lu depuis
PostgreSQL sur tous les appareils ; publier ou modifier une fiche exige un compte
INPTIC avec une adresse e-mail vérifiée. Les anciennes fiches restent visibles,
mais ne sont pas automatiquement attribuées à un compte.
Le formulaire Alumni permet également de recadrer la photo de profil (zoom et
positionnement) avant de publier ou modifier la fiche.

Pour rendre le message du Directeur éditable, exécuter aussi
`scripts/16_create_homepage_director_message.sql` dans PostgreSQL.

Si la Scolarité voit un candidat mais ne peut pas charger son dossier ou ses
pièces jointes, exécuter `scripts/22_grant_candidate_profile_storage.sql` sur
la base PostgreSQL LWS. Cette migration accorde au compte applicatif les seuls
droits nécessaires sur les profils candidats et les métadonnées des fichiers privés.

Les fichiers publics sont servis par `/api/storage/...`.

## Bibliothèque numérique intégrée

L'ancienne application PHP autonome est remplacée côté site par les pages
Next.js/React `/bibliotheque`, `/bibliotheque/lecture?id=...`,
`/bibliotheque/mon-espace` et `/bibliotheque/admin`. Le menu principal comprend
un accès à la bibliothèque. Le catalogue propose une navigation alphabétique
par titre, la lecture PDF avec prise en charge des requêtes par plage, le
téléchargement, les favoris, les mentions J’aime, les collections personnelles,
la progression de lecture, les profils de bibliothèque et la gestion
administrateur. Les comptes et connexions sont ceux du site INPTIC ; il n'y a
pas de second mot de passe ni de connexion Apple de simulation.

Après `scripts/00_lws_complete_schema.sql`, exécuter
`scripts/25_create_library.sql` sur la base PostgreSQL. Le script
`scripts/create-lws-database.sh` installe désormais aussi ce schéma. Les pages
d'administration sont réservées aux comptes ayant un rôle administrateur du
site et les opérations sensibles sont revérifiées côté serveur.
Pour une base existante, exécuter également `scripts/26_library_guest_likes.sql`
afin d'activer les J’aime sans connexion.

Les PDF disponibles pour React sont présents dans `app/bibliotheque/livres`.
Les couvertures peuvent être placées dans `app/bibliotheque/images` ou
stockées ailleurs en définissant `LIBRARY_COVERS_DIR`. Le lecteur React sert les PDF via une route contrôlée,
plutôt que de les exposer comme des fichiers statiques. En production, vérifier
que ces fichiers sont présents sur le serveur Node après déploiement ; pour les
hébergeurs qui séparent le code construit des médias, définir `LIBRARY_BOOKS_DIR`
et `LIBRARY_COVERS_DIR` avec les chemins absolus vers leurs emplacements
persistants. Les valeurs par défaut sont `app/bibliotheque/livres` et
`app/bibliotheque/images`. Les uploads de livres par l’administration sont
écrits dans ces répertoires ; PostgreSQL conserve leurs métadonnées et les noms
des fichiers. Sur LWS, définir `LIBRARY_BOOKS_DIR` et `LIBRARY_COVERS_DIR` vers
des répertoires persistants accessibles en écriture pour que ces uploads
survivent aux redéploiements. Les livres personnels restent dans le stockage
privé défini par `PRIVATE_STORAGE_DIR`.

Le catalogue public peut aussi lire les métadonnées de
`migration/library_books_from_pdf.csv` sans PostgreSQL : c’est le mode utilisé
par défaut en développement, et il sert de repli en production si la connexion
PostgreSQL est indisponible. Les filtres, la recherche, le tri, la pagination,
les couvertures et la lecture/téléchargement des PDF restent disponibles pour
les ouvrages présents dans ce fichier. Définir `LIBRARY_CATALOG_SOURCE=file`
pour imposer ce mode, `LIBRARY_CATALOG_SOURCE=database` pour imposer PostgreSQL,
ou `LIBRARY_CATALOG_SOURCE=auto` pour essayer PostgreSQL puis utiliser les
fichiers en cas de panne de connexion. Les favoris, les J’aime, la progression
de lecture et l’administration restent des fonctions avec état et nécessitent
PostgreSQL.
En production, laisser ce réglage absent ou choisir `auto` pour privilégier
PostgreSQL ; le mode `file` ne sert qu’un catalogue public en lecture seule.

Le script `scripts/import_legacy_library.mjs` importe les métadonnées des
ouvrages et, si les CSV sont fournis, les profils de bibliothèque, favoris,
mentions J’aime, collections et positions de lecture. Exporter uniquement les
colonnes non secrètes, notamment `utilisateurs.id` et `utilisateurs.email` :
ne pas exporter de mots de passe. Les associations d'un ancien compte sont
reliées à un compte INPTIC existant par adresse e-mail normalisée ; le script
n'invente pas de comptes et indique combien n'ont pas de compte correspondant.
Exemple PowerShell (adapter les chemins, sans mettre les fichiers CSV dans Git) :

```powershell
$env:DATABASE_URL = "URL_DE_CONNEXION_POSTGRESQL"
node scripts\import_legacy_library.mjs --books .\migration\livres.csv --users .\migration\utilisateurs.csv --favorites .\migration\favoris.csv --likes .\migration\likes.csv --collection .\migration\user_livres.csv --progress .\migration\progression_lecture.csv
```

Les fichiers optionnels `--users`, `--favorites`, `--likes`, `--collection` et
`--progress` peuvent être omis. Il faut créer ou associer les comptes du site
avant l'import pour conserver les données personnelles liées aux utilisateurs.
Les anciens mots de passe, profils de connexion Google/Apple et fichiers ne
sont pas importés par ce script. L'application PHP historique n'est pas
nécessaire au fonctionnement de la bibliothèque React.

Un administrateur peut également importer le CSV des livres depuis
`/bibliotheque/admin`. Cette méthode utilise la connexion PostgreSQL du site
et ne demande pas de configurer `DATABASE_URL` sur l'ordinateur de l'administrateur.
Les PDF et couvertures référencés doivent déjà avoir été déployés sur le serveur.
L'import est transactionnel, vérifie les fichiers référencés et met à jour un
livre déjà importé à partir du même nom de PDF sans remettre à zéro ses compteurs.
Un super administrateur ouvre `/bibliotheque/admin` pour ajouter un PDF avec sa
couverture, modifier les métadonnées ou remplacer une couverture, et supprimer
un livre ou une sélection. Les J’aime sont ouverts aux visiteurs et limités à
un par navigateur et par ouvrage ; les favoris, la collection personnelle et
l'enregistrement de la progression de lecture demandent une session.
Le compteur de téléchargements n'augmente qu'à la fin de l'envoi complet du PDF.

Les principales fonctions de l'ancienne API mobile sont disponibles sous
`/api/library/mobile/books` (`type=recent|popular`), `/api/library/mobile/search`
(`q`, `categorie`, `langue`) et `/api/library/mobile/stats`. Ces routes renvoient
les champs de catalogue historiques en JSON, mais les PDF et couvertures passent
par les routes contrôlées du site. Les suggestions de recherche sont fournies par
`/api/library/suggestions`. Les clients authentifiés doivent utiliser les comptes
et sessions INPTIC (`/api/auth/login` et `/api/auth/session`) ; l'ancienne API
PHP d'inscription/connexion n'est pas reprise, car elle utilisait une base
d'utilisateurs distincte et ne créait pas de session INPTIC.

L'administration React inclut aussi la pagination et la suppression groupée
(100 ouvrages maximum par opération). Les paramètres du compte et les changements
de mot de passe restent gérés par l'authentification centrale du site. Les mentions
légales de la bibliothèque sont intégrées à `/bibliotheque/mentions-legales`.

Pour activer la gestion des filières, formations, certifications et photos du site, exécuter
`scripts/24_create_site_content_management.sql` sur PostgreSQL. La page
`/admin/contenus` et ses opérations d'écriture sont réservées aux superadministrateurs.
Les filières, formations qualifiantes et diplômantes, et certifications initiales
sont insérées sans doublons. Les photos remplacées sont
enregistrées dans `PRIVATE_STORAGE_DIR` et servies via le stockage applicatif ;
aucun fichier n’est conservé uniquement dans le navigateur.

Configurer les variables serveur et démarrer l'application. Les profils, pièces jointes,
actualités et autres tables applicatives commenceront vides et seront alimentés
par l'utilisation du nouveau site.

`DATABASE_URL`, `PRIVATE_STORAGE_DIR`, les clés de messagerie et les secrets OAuth
sont des variables serveur ; ne préfixez jamais un secret par `NEXT_PUBLIC_`.

## Publications des annonces

La page `/annonces` est l’espace de gestion du directeur général et du responsable
communication. Les comptes autorisés doivent porter un rôle adéquat dans
`public.app_users.role` ; une adresse e-mail seule ne donne aucun droit privilégié.
Les actualités et annonces sont stockées dans `public.actualites` sur PostgreSQL
LWS. Le script `13_lws_application_schema.sql` crée cette table.

La publication crée ou modifie le contenu dans PostgreSQL. Les boutons de partage
ouvrent WhatsApp, Facebook, LinkedIn ou X avec le lien de l’annonce; ils ne publient
pas automatiquement sur les comptes officiels. La publication automatique exige
des applications développeur et autorisations OAuth propres à chaque plateforme.

Strapi reste utilisé par les pages de formation. Configurer son URL et son jeton
serveur uniquement si ces pages nécessitent l'accès à l'instance Strapi.

## Veille Facebook et newsletter

La veille Facebook et les réponses aux commentaires utilisent les variables
serveur `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` et
`FACEBOOK_GRAPH_API_VERSION`. Le token doit appartenir à la Page INPTIC et
disposer au minimum des autorisations `pages_read_engagement`,
`pages_read_user_content` et `pages_manage_engagement`. Un token qui expire
rapidement doit être renouvelé avant son expiration. La clé API YouTube
(`YOUTUBE_API_KEY`) permet la lecture des commentaires YouTube ; leur réponse
automatique n'est pas intégrée.

Pour activer les inscriptions et envois de newsletter :

1. Exécuter `scripts/11_create_newsletter_subscribers.sql` sur la base
   PostgreSQL LWS. Le schéma applicatif (script 13) crée également ces tables.
2. Configurer les variables SMTP LWS `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
   `SMTP_USER`, `SMTP_PASSWORD` et `SMTP_FROM_EMAIL=INPTIC <inptic@inptic-ga.org>`,
   ainsi que `NEWSLETTER_SITE_URL` avec l'origine HTTPS publique. Ces variables
   doivent être définies dans l'environnement Node.js LWS. Utiliser les valeurs
   exactes du panneau LWS ; le port 465 utilise généralement SSL/TLS et le port
   587 STARTTLS.
3. Après une inscription, le serveur SMTP envoie un courriel de confirmation ; une nouvelle
   actualité publiée pour `actualites` déclenche l'envoi aux abonnés actifs.
   Chaque message comprend un lien de désabonnement confirmé.
4. La revue IT internationale est envoyée chaque vendredi à 17 h (heure du Gabon).
   Elle sélectionne les articles RSS publiés depuis le lundi, priorise les actualités
   technologiques du Gabon puis de l’Afrique, avant l’Asie, l’Europe, l’Inde et
   l’International. La rubrique Gabon est alimentée par Gabon Actu ; les nouvelles
   régionales sont filtrées sur leur sujet technologique. Jusqu’à quatre articles
   par région sont présentés avec résumés, liens sources et images disponibles.
   La sélection dépend de l’historique encore présent dans chaque flux RSS.
5. Pour activer l’envoi planifié, définir `NEWSLETTER_CRON_SECRET` dans
   l’environnement Node.js LWS et comme secret GitHub Actions du même nom
   (GitHub ne peut pas lire directement les variables configurées sur LWS).
   Ajouter la variable de dépôt `NEWSLETTER_DIGEST_URL` contenant l’URL complète
   `https://votre-domaine.tld/api/newsletter/weekly-digest`. Le workflow
   `.github/workflows/weekly-tech-digest.yml` appelle cette route avec le secret
   Bearer le vendredi à 16 h UTC (17 h au Gabon). L’envoi utilise la configuration
   SMTP et la base PostgreSQL du serveur, comme les autres newsletters. Depuis
   l’onglet Actions, un lancement manuel utilise le même envoi hebdomadaire et
   n’est accepté que le vendredi. Les envois sont dédoublonnés pour chaque
   abonné et chaque semaine.
   Pour simplement prévisualiser la revue dans un navigateur, ouvrir
   `https://votre-domaine.tld/api/newsletter/weekly-digest/preview` ; cet aperçu
   récupère les articles de la dernière semaine complète et n’envoie aucun e-mail.

## Connexions prévues
- Frontend: Next.js 16 / React 19 / Tailwind v4.
- CMS: Strapi REST pour les contenus de formation qui y sont encore hébergés.
- Authentification candidats et personnel : PostgreSQL/LWS via `/api/auth/*`
  (le point d'entrée historique `/api/candidat/login` délègue à cette API).
- Recherche: route `/api/search?q=` indexant les pages publiques, les formations et contenus Strapi, ainsi que les actualités, annonces, concours, publications et ressources publiés dans PostgreSQL.
- IA: variable serveur `GEMINI_API_KEY` (ou `GOOGLE_GENERATIVE_AI_API_KEY`).
- Données métier, actualités, profils et authentification: PostgreSQL/LWS via
  `DATABASE_URL`. Aucun client Supabase n'est nécessaire au fonctionnement normal.

## Collections Strapi minimales
`formations`: title, slug, description, level, category, image

Les clés et URL réelles ne sont pas incluses : elles doivent être fournies dans `.env.local`.
