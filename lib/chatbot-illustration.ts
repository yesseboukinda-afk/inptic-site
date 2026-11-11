const trainingAreas = [
  { title: 'Management des TIC', color: '#2563eb', icon: 'M' },
  { title: 'Réseaux & systèmes', color: '#0891b2', icon: 'R' },
  { title: 'Génie informatique', color: '#7c3aed', icon: 'G' },
  { title: 'Audiovisuel', color: '#db2777', icon: 'A' },
  { title: 'Télécommunications', color: '#0284c7', icon: 'T' },
  { title: 'Cybersécurité', color: '#059669', icon: 'C' },
  { title: 'Monétique', color: '#d97706', icon: '€' },
  { title: 'Poste & logistique', color: '#4f46e5', icon: 'P' },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createINPTICIllustration() {
  const cards = trainingAreas.map((area, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 104 + column * 506;
    const y = 316 + row * 112;
    return `<g><rect x="${x}" y="${y}" width="462" height="88" rx="18" fill="#ffffff"/><rect x="${x}" y="${y}" width="8" height="88" rx="4" fill="${area.color}"/><circle cx="${x + 54}" cy="${y + 44}" r="23" fill="${area.color}" fill-opacity=".12"/><text x="${x + 54}" y="${y + 52}" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" font-weight="700" fill="${area.color}">${escapeXml(area.icon)}</text><text x="${x + 94}" y="${y + 52}" font-family="Arial,sans-serif" font-size="22" font-weight="600" fill="#172554">${escapeXml(area.title)}</text></g>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-labelledby="title description"><title id="title">INPTIC — les domaines de formation</title><desc id="description">Illustration des huit principaux domaines de formation présentés par l’INPTIC au Gabon.</desc><defs><linearGradient id="header" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#123b82"/><stop offset="1" stop-color="#0e7490"/></linearGradient><radialGradient id="glow"><stop stop-color="#93c5fd" stop-opacity=".35"/><stop offset="1" stop-color="#93c5fd" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="900" rx="36" fill="#f3f7fc"/><rect x="28" y="28" width="1144" height="250" rx="28" fill="url(#header)"/><circle cx="1070" cy="64" r="220" fill="url(#glow)"/><path d="M75 91h8v88h-8zM93 91h8v88h-8zM111 91h8v88h-8zM75 84h44v8H75zM75 179h44v8H75z" fill="#fff"/><text x="146" y="139" font-family="Arial,sans-serif" font-size="56" font-weight="700" letter-spacing="3" fill="#fff">INPTIC</text><text x="76" y="224" font-family="Arial,sans-serif" font-size="21" fill="#e0f2fe">Institut National de la Poste, des Technologies de l’Information et de la Communication</text><text x="104" y="306" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="2" fill="#475569">LES DOMAINES DE FORMATION</text>${cards}<text x="104" y="806" font-family="Arial,sans-serif" font-size="18" fill="#64748b">Gabon · Numérique · Innovation · Formation</text><path d="M104 829h992" stroke="#dbe4ef" stroke-width="2"/><text x="1096" y="864" text-anchor="end" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8">Illustration vectorielle informative</text></svg>`;

  return new TextEncoder().encode(svg);
}
