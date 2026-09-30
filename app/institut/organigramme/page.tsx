'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

type CardVariant = 'root' | 'manager' | 'teal' | 'light' | 'mini';

/**
 * Photos pour l'organigramme (silhouette automatique si vide)
 */
const photos: Record<string, string> = {
  board: '/connexion/github.png',
  director: '/banniere/DG.webp',
  deputyDirector: '/banniere/DGA.webp',
  serviceAdminFinancier: '',
  advisors: '',
  controller: '',
  assistant: '',
  chargestudes: '',
  studiesDirector: '',
  continuingDirector: '',
  technicalDirector: '',
  unescoDirector: '',
  secretary: '',
  deptReseaux: '',
  deptManagementCommerce: '',
  deptManagementTIC: '',
  deptAudiovisuel: '',
  serviceStageEmploi: '',
  servicePlanification: '',
  serviceVeilleTech: '',
  centreMaintenance: '',
  serviceRessourcesDoc: '',
  serviceInformatique: '',
  expertPedagogique: '',
  expertTechnique: '',
  serviceScolarite: '',
  serviceCommunication: '',
  serviceLogistique: '',
  serviceSocial: '',
};

// Dégradés par palier hiérarchique
const GRADIENTS: Record<CardVariant, [string, string]> = {
  root: ['#ff8a3d', '#e63963'],
  manager: ['#b155f0', '#7c3aed'],
  teal: ['#7c5ce8', '#c14fd6'],
  light: ['#3b82f6', '#22c1dc'],
  mini: ['#14b8a6', '#0e9bb5'],
};

// Hexagone SVG à coins arrondis
const HEX_OUTER =
  'M33 4 L67 4 Q75 4 78.82 11.03 L96.18 42.97 Q100 50 96.18 57.03 ' +
  'L78.82 88.97 Q75 96 67 96 L33 96 Q25 96 21.18 88.97 L3.82 57.03 ' +
  'Q0 50 3.82 42.97 L21.18 11.03 Q25 4 33 4 Z';

const HEX_INNER =
  'M35 9.52 L65 9.52 Q72 9.52 75.34 15.67 L90.66 43.85 Q94 50 90.66 56.15 ' +
  'L75.34 84.33 Q72 90.48 65 90.48 L35 90.48 Q28 90.48 24.66 84.33 ' +
  'L9.34 56.15 Q6 50 9.34 43.85 L24.66 15.67 Q28 9.52 35 9.52 Z';

function HexPhoto({ id, photoSrc, size }: { id: string; photoSrc: string; size: number }) {
  const gradId = `grad-${id}`;
  const clipId = `clip-${id}`;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="org-hex-svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--gradFrom)" />
          <stop offset="100%" stopColor="var(--gradTo)" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={HEX_INNER} />
        </clipPath>
      </defs>
      <path d={HEX_OUTER} fill={`url(#${gradId})`} />
      <path d={HEX_INNER} fill="#ffffff81" />
      {photoSrc ? (
        <image
          href={photoSrc}
          x="0"
          y="0"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <g clipPath={`url(#${clipId})`}>
          <circle cx="50" cy="37" r="14" fill="#dde1e863" />
          <path d="M20 92 Q50 58 80 92 Z" fill="#dde1e823" />
        </g>
      )}
    </svg>
  );
}

function Bracket({ count = 5, height = 34 }: { count?: number; height?: number }) {
  const centerX = 50;
  const dropY = 9;
  const bottomY = height - 2;
  const spacing = 100 / count;
  const positions = Array.from({ length: count }, (_, i) => (i + 0.5) * spacing);
  const r = Math.min(6, spacing / 2 - 1.5);

  return (
    <svg
      className="org-bracket"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{ height }}
    >
      <line
        x1={centerX} y1={0} x2={centerX} y2={dropY}
        stroke="#000000" strokeWidth={2} vectorEffect="non-scaling-stroke"
      />
      {positions.map((x, i) => {
        if (Math.abs(x - centerX) < 0.01) {
          return (
            <line
              key={i}
              x1={x} y1={dropY} x2={x} y2={bottomY}
              stroke="#000000" strokeWidth={2} vectorEffect="non-scaling-stroke"
            />
          );
        }
        const towardCenter = x < centerX ? 1 : -1;
        const bendX = x + towardCenter * r;
        const d = `M ${centerX} ${dropY} H ${bendX} Q ${x} ${dropY} ${x} ${dropY + r} V ${bottomY}`;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#000000"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

export default function OrganigrammePage() {
  const { t } = useTranslation();

  const attachedRow = [
    { key: 'serviceAdminFinancier', label: 'Chef de Service\nAdministratif & Financier' },
    { key: 'advisors', label: 'Conseillers' },
    { key: 'controller', label: 'Contrôleur\nde Gestion' },
    { key: 'assistant', label: 'Assistante\ndu DG' },
    { key: 'chargestudes', label: 'Chargés\nd’études' },
  ];

  const middleRow = [
    { key: 'studiesDirector', label: 'Directeur des Études\net de la Pédagogie' },
    { key: 'continuingDirector', label: 'Directeur de la\nFormation Continue' },
    { key: 'technicalDirector', label: 'Directeur des Ressources\nTechniques & Innovation' },
    { key: 'unescoDirector', label: 'Directeur du Centre\nAvicenne-UNESCO-INPTIC' },
    { key: 'secretary', label: 'Secrétaire\nGénéral' },
  ];

  const lowerCols = [
    [
      { key: 'deptReseaux', label: 'Chef de Département Réseaux & Systèmes Numériques' },
      { key: 'deptManagementCommerce', label: 'Chef de Département Management & Commerce' },
      { key: 'deptManagementTIC', label: 'Chef de Département Management des TIC' },
      { key: 'deptAudiovisuel', label: 'Chef de Département Audiovisuel' },
    ],
    [
      { key: 'serviceStageEmploi', label: 'Services Stage et Emploi' },
      { key: 'servicePlanification', label: 'Service Planification et Évaluation' },
      { key: 'serviceVeilleTech', label: 'Service Veille Technologique & VAE' },
    ],
    [
      { key: 'centreMaintenance', label: 'Chef du Centre de Maintenance & Assistance' },
      { key: 'serviceRessourcesDoc', label: 'Chef de Centre de Ressources Documentaires' },
      { key: 'serviceInformatique', label: 'Chef de Service Informatique & SI' },
    ],
    [
      { key: 'expertPedagogique', label: 'Expert Pédagogique' },
      { key: 'expertTechnique', label: 'Expert Technique' },
    ],
    [
      { key: 'serviceScolarite', label: 'Chef de Service Scolarité' },
      { key: 'serviceCommunication', label: 'Chef de Service Communication & Relations Extérieures' },
      { key: 'serviceLogistique', label: 'Chef de Service Logistique et Achats' },
      { key: 'serviceSocial', label: 'Chef de Service Social' },
    ],
  ];

  const renderCard = (key: string, label: string, variant: CardVariant) => {
    const photoSrc = photos[key] ?? '';
    const isBig = variant === 'root' || variant === 'manager';
    const size = isBig ? 104 : 88;
    const [gradFrom, gradTo] = GRADIENTS[variant];

    return (
      <div
        className={`org-card org-card-${variant}`}
        style={{ '--gradFrom': gradFrom, '--gradTo': gradTo } as React.CSSProperties}
      >
        <HexPhoto id={key} photoSrc={photoSrc} size={size} />
        <div className="org-pill">
          <div className="org-card-label">
            {label.split('\n').map((part, index, arr) => (
              <span
                key={`${key}-${index}`}
                className={index === 0 ? 'org-label-primary' : 'org-label-secondary'}
              >
                {part}
                {index < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="org-page">
      <div className="org-container">
        {/* Banner header */}
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white md:py-20 rounded-3xl mb-12 shadow-2xl">
          <img
            src="/banniere/1.webp"
            alt=""
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-40"
          />
          <div
            className="absolute inset-0 z-[1]"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(7, 25, 60, 0.94) 0%, rgba(14, 43, 102, 0.88) 55%, rgba(20, 48, 107, 0.75) 100%)',
            }}
          />
          <div className="relative z-10 px-6 text-center max-w-4xl mx-auto">
            <img src="/logoinptic.png" alt="INPTIC" className="mx-auto mb-4 h-10 w-auto object-contain" />
            <h1 className="text-3xl font-black md:text-5xl">Organigramme Institutionnel Officiel</h1>
            <p className="mt-3 text-sm text-slate-200">
              Arborescence hiérarchique complète de la Présidence, la Direction Générale, les Directions Opérationnelles et les Services Spécialisés de l&apos;INPTIC Gabon.
            </p>
          </div>
        </section>

        <div className="org-chart-shell">
          <div className="org-chart-stage">
            {/* 1. Président du Conseil d'Administration */}
            <div className="org-root org-node">
              {renderCard('board', 'Président du Conseil\nd’Administration', 'root')}
            </div>
            <div className="org-line org-line-vertical root-line" />

            {/* 2. Directeur Général */}
            <div className="org-manager org-node">
              {renderCard('director', 'Directeur Général', 'manager')}
            </div>
            <div className="org-line org-line-vertical deputy-line" />

            {/* 3. Services rattachés au DG */}
            <Bracket count={5} />

            <div className="org-row row-top">
              {attachedRow.map((item) => (
                <div key={item.key} className="org-col-item org-node">
                  {renderCard(item.key, item.label, 'teal')}
                </div>
              ))}
            </div>

            <Bracket count={5} />

            {/* 4. Les 5 Grandes Directions */}
            <div className="org-row row-middle">
              {middleRow.map((item) => (
                <div key={item.key} className="org-col-item org-node">
                  {renderCard(item.key, item.label, 'light')}
                </div>
              ))}
            </div>

            <Bracket count={5} />

            {/* 5. Sous-départements & Services */}
            <div className="org-lower-grid">
              {lowerCols.map((col, colIndex) => (
                <div key={`col-${colIndex}`} className="org-lower-col">
                  {col.map((item) => (
                    <div key={item.key} className="org-lower-item org-node">
                      {renderCard(item.key, item.label, 'mini')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .org-page {
          position: relative;
          min-height: 100vh;
          background: #f8f5ec;
          color: #172033;
          padding: 3rem 1rem;
        }

        .org-container {
          position: relative;
          z-index: 2;
          max-width: 1550px;
          margin: 0 auto;
        }

        .org-chart-shell {
          position: relative;
          overflow-x: auto;
          padding: 2.5rem 1.5rem 3rem;
          -webkit-overflow-scrolling: touch;
        }

        .org-chart-stage {
          position: relative;
          min-width: 1200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 0 0.75rem;
        }

        .org-node { position: relative; z-index: 5; }

        .root-line,
        .deputy-line {
          width: 2px;
          height: 34px;
          background: #000000;
        }

        .org-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 180px;
          text-align: center;
        }

        .org-hex-svg {
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 8px 10px rgba(45, 51, 70, 0.25));
        }

        .org-pill {
          width: 100%;
          margin-top: -10px;
          padding: 20px 0.75rem 0.9rem;
          border-radius: 60px !important;
          background: linear-gradient(160deg, var(--gradFrom), var(--gradTo));
          box-shadow: 0 12px 20px rgba(1, 1, 3, 0.18);
        }

        .org-card-root .org-pill,
        .org-card-manager .org-pill {
          margin-top: -12px;
          padding-top: 24px;
          border-radius: 60px !important;
        }

        .org-card-label {
          width: 100%;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .org-card-root .org-card-label,
        .org-card-manager .org-card-label {
          font-size: 0.9rem;
          font-weight: 800;
        }

        .org-label-primary {
          font-weight: 800;
        }

        .org-label-secondary {
          display: inline;
          font-weight: 500;
          opacity: 0.88;
          font-size: 0.94em;
        }

        .org-bracket {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 0 1rem;
        }

        .org-row {
          position: relative;
          display: grid;
          width: 100%;
          gap: 1.35rem;
          justify-items: center;
          padding: 0 1rem;
        }

        .row-top,
        .row-middle {
          grid-template-columns: repeat(5, minmax(170px, 1fr));
        }

        .org-lower-grid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(5, minmax(170px, 1fr));
          width: 100%;
          margin-top: 0;
          padding: 0 1rem;
        }

        .org-lower-col {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }

        .org-lower-item {
          display: flex;
          justify-content: center;
        }

        .org-lower-item:not(:last-child)::after {
          position: absolute;
          top: 100%;
          left: 50%;
          width: 2px;
          height: 1rem;
          background: #000000;
          content: '';
          transform: translateX(-50%);
        }

        @media (max-width: 900px) {
          .org-page { padding: 2.5rem 0.5rem; }
          .org-chart-shell { padding: 2rem 0.5rem 2.5rem; }
          .org-chart-stage { min-width: 1050px; }
        }

        @media (max-width: 540px) {
          .org-chart-stage { min-width: 980px; }
          .org-card { width: 158px; }
        }
      `}</style>
    </main>
  );
}
