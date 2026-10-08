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
`gemini-2.5-pro`; `GEMINI_MODEL` permet de le remplacer. La recherche Google
groundée et l'exécution Python sont activées pour aider aux recherches récentes
et aux calculs. Les sources Web renvoyées par Google sont affichées dans les
réponses. Le modèle Pro et ces outils peuvent répondre plus lentement et entraîner
des coûts supérieurs à Gemini Flash.

La lecture vocale est générée côté serveur par Gemini TTS (`GEMINI_TTS_MODEL`,
par défaut `gemini-3.8-flash-tts`) avec la voix féminine Kore et un style français
chaleureux et naturel. Elle utilise la même clé serveur `GEMINI_API_KEY` et le
quota Gemini. Si le serveur ne peut pas joindre Google, l'interface essaie une
voix française féminine installée dans le navigateur et signale ce mode de secours.

En l'absence de clé Gemini, les anciens fournisseurs restent disponibles en
repli avec `OPENAI_API_KEY` ou `OPENROUTER_API_KEY`.

Le dossier `chatbot/` conserve le template open source complet comme référence pour
les futures évolutions (historique, authentification, outils et artefacts), mais il
n'est plus nécessaire de lancer une seconde application pour utiliser l'assistant
du site.

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
2. Configurer côté serveur `DATABASE_URL`, `AUTH_SITE_URL` (origine HTTPS du site),
   `RESEND_API_KEY` et `AUTH_FROM_EMAIL`. L'expéditeur doit être vérifié dans
   Resend. Ces secrets ne doivent pas avoir le préfixe `NEXT_PUBLIC_`.
3. Dans Google/Facebook Developer Console, ajouter comme URI de callback
   `https://votre-domaine.tld/api/auth/oauth/callback`, puis configurer les
   identifiants serveur `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `FACEBOOK_APP_ID` et `FACEBOOK_APP_SECRET` selon les fournisseurs activés.
   L'authentification sociale est facultative.
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
passe avec scrypt et crée un compte vérifié de rôle `admin`. Elle n'écrase jamais
un compte existant. Ne pas enregistrer ni partager l'URL de connexion ou le
mot de passe.

Les comptes ayant le rôle `superadmin` sont dirigés vers `/admin`. Ce tableau de
bord permet de créer et supprimer les comptes du personnel, de les rechercher
et de les filtrer par direction/service et rôle, puis d'accéder aux espaces de
gestion. La création d'un compte active l'adresse et stocke uniquement un hash
scrypt du mot de passe. La suppression révoque les sessions en supprimant le
compte d'authentification ; le dernier superadmin et le compte connecté ne
peuvent pas être supprimés depuis l'interface. Les comptes étudiants ne sont
pas gérés dans cette liste.

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
2. Configurer `RESEND_API_KEY`, `NEWSLETTER_FROM_EMAIL` avec une adresse d'un
   domaine vérifié dans Resend, et `NEWSLETTER_SITE_URL` avec l'origine HTTPS
   publique. Ces variables doivent être définies dans l'environnement Node.js LWS.
3. Après une inscription, Resend envoie un courriel de confirmation ; une nouvelle
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
