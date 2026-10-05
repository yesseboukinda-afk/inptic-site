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

## Déploiement et comptes

Les comptes ne sont pas partagés par le navigateur : en local, un compte créé sans
Supabase est enregistré dans `localStorage`, alors qu'en production les identifiants
sont vérifiés par Supabase Auth. Pour la production :

1. Ajouter `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et
	`SUPABASE_SERVICE_ROLE_KEY` dans les variables d'environnement du fournisseur de
	déploiement, pour l'environnement **Production**, avant le build.
2. Créer ou inviter les comptes dans le projet Supabase de production, dans
	**Authentication > Users**. Les comptes créés uniquement en local ne peuvent pas
	fonctionner en production.
3. Vérifier que l'URL de production est autorisée dans **Authentication > URL
	Configuration** de Supabase, notamment `https://votre-domaine.tld/reset-password`
	dans les **Redirect URLs** (et `http://localhost:3000/reset-password` en local).
4. Le formulaire demande à Supabase de revenir sur `/reset-password` du domaine
	actuellement ouvert. Configurer l'URL du site Supabase avec la racine du domaine
	public, par exemple `https://votre-domaine.tld`.
5. Relancer un déploiement après toute modification des variables d'environnement.

Depuis `/candidat`, le lien **Mot de passe oublié** envoie un email Supabase. Le
lien ouvre `/reset-password`, où l'utilisateur définit et confirme son nouveau mot
de passe.

La clé `SUPABASE_SERVICE_ROLE_KEY` est utilisée uniquement par les routes serveur et
ne doit jamais être préfixée par `NEXT_PUBLIC_`.

## Publications des annonces

La page `/annonces` est l’espace de gestion du directeur général et du responsable
communication. Le compte DG reconnu par le site est `directeur@inptic.ga`; les
autres comptes doivent avoir le rôle `communication` ou un rôle DG dans les
`app_metadata` Supabase. Le rôle `user_metadata` n’est pas accepté pour autoriser
les écritures. Dans Strapi, la collection `actualites` est définie sous
`strapi/src/api/actualite` avec les champs `title`, `slug`, `excerpt`, `category`
et Draft & Publish. Installer les dépendances depuis `strapi/` avec `npm install`,
puis démarrer le CMS avec `npm run strapi:dev` depuis la racine. Au premier
démarrage, créer le compte administrateur Strapi dans l’interface.

Dans Strapi, créer un API Token personnalisé avec accès `find`, `findOne`,
`create` et `update` pour `Actualite`. Pour la lecture publique, ouvrir **Settings
> Users & Permissions Plugin > Roles > Public** et autoriser `Actualite: find` et
`findOne`. Renseigner `NEXT_PUBLIC_STRAPI_URL` et `STRAPI_API_TOKEN` dans `.env`
local et dans les variables serveur de production. La valeur locale de l’URL est
`http://localhost:1337/api`; le déploiement doit utiliser l’URL publique de
l’instance Strapi. Ne jamais préfixer le jeton par `NEXT_PUBLIC_`.

La publication crée ou modifie le contenu dans Strapi. Les boutons de partage
ouvrent WhatsApp, Facebook, LinkedIn ou X avec le lien de l’annonce; ils ne publient
pas automatiquement sur les comptes officiels. La publication automatique exige
des applications développeur et autorisations OAuth propres à chaque plateforme.

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

1. Exécuter `scripts/11_create_newsletter_subscribers.sql` dans le SQL Editor du
   projet Supabase de production. Ce script crée uniquement le schéma ; il
   n'insère aucun abonné.
2. Configurer `RESEND_API_KEY`, `NEWSLETTER_FROM_EMAIL` avec une adresse d'un
   domaine vérifié dans Resend,
   `NEWSLETTER_SITE_URL=https://inptic-site.vercel.app`,
   `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans
   **Vercel > Project Settings > Environment Variables**, pour **Production**.
   Les valeurs secrètes restent côté serveur. Ne jamais les préfixer par
   `NEXT_PUBLIC_`.
3. Vérifier que le domaine `inptic-site.vercel.app` est bien rattaché au projet
   Vercel qui exécute les routes Next.js. La configuration actuelle doit servir notamment
   `/api/ereputation` et `/api/newsletter` sur ce domaine ; un 404 sur ces
   routes signifie que le domaine pointe vers un hébergement qui ne sert pas
   l'application Next.js.
4. Relancer un déploiement Production après l'ajout des variables. Pour les
   installations existantes, réexécuter le script SQL afin d'ajouter la colonne
   `confirmation_sent_at`. Après une inscription enregistrée, Resend envoie un
   courriel de confirmation ; en cas d'échec, le formulaire affiche une erreur
   et permet de réessayer. Une nouvelle actualité publiée et ciblée sur `actualites`
   déclenche son envoi aux abonnés actifs ; les modifications d'une actualité
   déjà publiée ne relancent pas un envoi. Chaque courriel contient le logo,
   l'image si elle est fournie dans l'annonce, un résumé, le lien et un
   désabonnement avec confirmation.

## Connexions prévues
- Frontend: Next.js 15 / React 19 / Tailwind v4.
- CMS: Strapi REST (`/formations`, `/actualites`).
- Auth candidat: Supabase Auth via `/api/candidat/login`.
- Recherche: route `/api/search?q=` interrogeant Strapi.
- IA: variable serveur `GEMINI_API_KEY` (ou `GOOGLE_GENERATIVE_AI_API_KEY`).
- PostgreSQL: à brancher derrière Strapi ou Supabase selon l'architecture retenue.

## Collections Strapi minimales
`formations`: title, slug, description, level, category, image
`actualites`: title, slug, excerpt, image, category, publishedAt
`evenements`: title, date, location, description
`offres`: title, company, type, location, description

Les clés et URL réelles ne sont pas incluses : elles doivent être fournies dans `.env.local`.
