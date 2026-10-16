# INPTIC — maquette fonctionnelle

## Installation
1. Installer Node.js 20+.
2. `npm install`
3. Copier `.env.example` vers `.env.local` et renseigner les services.
4. `npm run dev`

## Chatbot INPTIC

Le bouton Assistant et la page `/chatbot` utilisent `/api/chat`, qui appelle
Google Gemini côté serveur. Configurez `GEMINI_API_KEY` dans `.env.local` pour
le développement et dans les variables d'environnement du déploiement. La clé
ne doit jamais être préfixée par `NEXT_PUBLIC_`. Le modèle par défaut est
`gemini-3.1-pro-preview`; `GEMINI_MODEL` permet de le remplacer. La recherche Google
groundée et l'exécution Python sont activées pour aider aux recherches récentes
et aux calculs. Les sources Web renvoyées par Google sont affichées dans les
réponses. Le modèle Pro et ces outils peuvent répondre plus lentement et entraîner
des coûts supérieurs à Gemini Flash.

Pour le déploiement LWS, renseigner `GEMINI_API_KEY` dans les variables
d'environnement du serveur Node.js, avec `GEMINI_MODEL=gemini-3.1-pro-preview` et
`GEMINI_TTS_MODEL=gemini-3.8-flash-tts` si ces modèles sont disponibles pour la
clé et le projet Google utilisés. La même clé sert aux réponses textuelles et
à la génération vocale. Ne jamais copier la clé dans Git, une variable
`NEXT_PUBLIC_*` ou un message.

La lecture vocale est générée côté serveur par Gemini TTS (`GEMINI_TTS_MODEL`,
par défaut `gemini-3.8-flash-tts`) avec la voix Achernar et un style français
féminin, doux, humain et posé. Elle utilise la même clé serveur `GEMINI_API_KEY` et le
quota Gemini. Si le serveur ne peut pas joindre Google, l'interface essaie une
voix française féminine installée dans le navigateur et signale ce mode de secours.

En l'absence de clé Gemini, les anciens fournisseurs restent disponibles en
repli avec `OPENAI_API_KEY` ou `OPENROUTER_API_KEY`.

Le superadmin peut choisir le fournisseur et le modèle actifs depuis
`/admin/ai-settings`. La table se crée avec `scripts/00_lws_complete_schema.sql`
ou `scripts/13_lws_application_schema.sql` ; sur une base déjà installée, exécuter
`scripts/19_create_ai_provider_settings.sql`. Configurez aussi
`AI_SETTINGS_ENCRYPTION_KEY` avec une clé aléatoire de 32 octets hexadécimaux
(par exemple `openssl rand -hex 32`) dans l'environnement serveur avant d'enregistrer
des identifiants. Conservez cette clé durablement : la changer rend les clés stockées
illisibles. Les fournisseurs pris en charge sont Qwen, Groq, Claude, Gemini,
DeepSeek, OpenAI, OpenRouter et Ollama local. Les clés ne sont jamais renvoyées au
navigateur ; chaque nouvelle configuration est testée avant son activation.

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

Pour rendre le message du Directeur éditable, exécuter aussi
`scripts/16_create_homepage_director_message.sql` dans PostgreSQL.

Les fichiers publics sont servis par `/api/storage/...`.

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

## Connexions prévues
- Frontend: Next.js 16 / React 19 / Tailwind v4.
- CMS: Strapi REST pour les contenus de formation qui y sont encore hébergés.
- Authentification candidats et personnel : PostgreSQL/LWS via `/api/auth/*`
  (le point d'entrée historique `/api/candidat/login` délègue à cette API).
- Recherche: route `/api/search?q=` interrogeant Strapi.
- IA: variable serveur `GEMINI_API_KEY` (ou `GOOGLE_GENERATIVE_AI_API_KEY`).
- Données métier, actualités, profils et authentification: PostgreSQL/LWS via
  `DATABASE_URL`. Aucun client Supabase n'est nécessaire au fonctionnement normal.

## Collections Strapi minimales
`formations`: title, slug, description, level, category, image

Les clés et URL réelles ne sont pas incluses : elles doivent être fournies dans `.env.local`.
