export const CLUBS = [
  {
    slug: 'club-sportif',
    name: 'Club sportif',
    description: 'Bouger, progresser et représenter l’INPTIC dans différentes disciplines.',
    icon: 'trophy',
    subclubs: [
      { slug: 'football', name: 'Football', description: 'Entraînements collectifs, technique et participation aux rencontres sportives.' },
      { slug: 'taekwondo', name: 'Taekwondo', description: 'Discipline, maîtrise de soi et apprentissage des techniques de taekwondo.' },
      { slug: 'boxe', name: 'Boxe', description: 'Préparation physique, apprentissage des bases et respect des règles de sécurité.' },
      { slug: 'karate', name: 'Karaté', description: 'Travail des techniques, de la concentration et des valeurs du karaté.' },
      { slug: 'basketball', name: 'Basketball', description: 'Jeu collectif, entraînements et participation aux rencontres de basketball.' },
    ],
  },
  {
    slug: 'club-creation-numerique',
    name: 'Club de création numérique',
    description: 'Imaginer et réaliser des projets numériques, créatifs et technologiques.',
    icon: 'sparkles',
    subclubs: [
      { slug: 'developpement', name: 'Développement', description: 'Conception de sites, applications et projets logiciels en équipe.' },
      { slug: 'reseau', name: 'Réseau', description: 'Découverte, conception et expérimentation autour des réseaux et télécommunications.' },
      { slug: 'infographie', name: 'Infographie', description: 'Création visuelle, design graphique et production de contenus numériques.' },
      { slug: 'audiovisuel', name: 'Audiovisuel', description: 'Réalisation, prise de vue, son et montage de productions audiovisuelles.' },
    ],
  },
] as const;

export type Club = (typeof CLUBS)[number];
export type ClubSlug = Club['slug'];
export type ClubSubclub = Club['subclubs'][number];

export function findClub(slug: unknown): Club | undefined {
  return typeof slug === 'string' ? CLUBS.find((club) => club.slug === slug) : undefined;
}

export function findClubSubclub(clubSlug: unknown, subclubSlug: unknown): ClubSubclub | undefined {
  const club = findClub(clubSlug);
  return typeof subclubSlug === 'string'
    ? club?.subclubs.find((subclub) => subclub.slug === subclubSlug)
    : undefined;
}
