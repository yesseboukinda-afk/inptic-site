# INPTIC — maquette fonctionnelle

## Installation
1. Installer Node.js 20+.
2. `npm install`
3. Copier `.env.example` vers `.env.local` et renseigner les services.
4. `npm run dev`

## Chatbot INPTIC

Le bouton Assistant utilise maintenant une intégration native dans l'application
principale. Le moteur AI SDK et le provider Gateway sont utilisés par
`/api/chat`, avec le contexte documentaire et les liens internes de l'INPTIC.
Le moteur conserve l'historique de la conversation, peut exécuter des outils
bornés comme la météo, puis rédiger la réponse finale en français.

Pour activer le modèle Gateway, renseigner `AI_GATEWAY_API_KEY` dans `.env.local`.
Sans cette clé, l'assistant conserve son fallback local ; `OPENAI_API_KEY` reste
également accepté comme solution de compatibilité.

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
	Configuration** de Supabase.
4. Vérifier que `NEXT_PUBLIC_SITE_URL` contient exactement l'URL publique du site,
	par exemple `https://votre-domaine.tld`, puis ajouter
	`https://votre-domaine.tld/reset-password` dans les **Redirect
	URLs** Supabase. En local, utiliser `http://localhost:3000/reset-password`.
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

## Connexions prévues
- Frontend: Next.js 15 / React 19 / Tailwind v4.
- CMS: Strapi REST (`/formations`, `/actualites`).
- Auth candidat: Supabase Auth via `/api/candidat/login`.
- Recherche: route `/api/search?q=` interrogeant Strapi.
- IA: variable `OPENAI_API_KEY` réservée au serveur pour ajouter INPTIC-Bot/RAG.
- PostgreSQL: à brancher derrière Strapi ou Supabase selon l'architecture retenue.

## Collections Strapi minimales
`formations`: title, slug, description, level, category, image
`actualites`: title, slug, excerpt, image, category, publishedAt
`evenements`: title, date, location, description
`offres`: title, company, type, location, description

Les clés et URL réelles ne sont pas incluses : elles doivent être fournies dans `.env.local`.
