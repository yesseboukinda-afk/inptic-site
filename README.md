# INPTIC — maquette fonctionnelle

## Installation
1. Installer Node.js 20+.
2. `npm install`
3. Copier `.env.example` vers `.env.local` et renseigner les services.
4. `npm run dev`

## Déploiement et comptes

Les comptes ne sont pas partagés par le navigateur : en local, un compte créé sans
Supabase est enregistré dans `localStorage`, alors qu'en production les identifiants
sont vérifiés par Supabase Auth. Pour la production :

1. Ajouter `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et
	`SUPABASE_SERVICE_ROLE_KEY` dans les variables d'environnement du fournisseur de
	déploiement, pour l'environnement **Production**, avant le build.
2. Créer ou inviter les comptes dans le projet Supabase de production, dans
	**Authentication > Users**. Les comptes créés uniquement en local ne peuvent pas
	fonctionner en production.
3. Vérifier que l'URL de production est autorisée dans **Authentication > URL
	Configuration** de Supabase.
4. Relancer un déploiement après toute modification des variables d'environnement.

La clé `SUPABASE_SERVICE_ROLE_KEY` est utilisée uniquement par les routes serveur et
ne doit jamais être préfixée par `NEXT_PUBLIC_`.

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
