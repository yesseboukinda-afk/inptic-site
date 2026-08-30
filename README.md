# INPTIC — maquette fonctionnelle

## Installation
1. Installer Node.js 20+.
2. `npm install`
3. Copier `.env.example` vers `.env.local` et renseigner les services.
4. `npm run dev`

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
