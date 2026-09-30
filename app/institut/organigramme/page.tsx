'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

type CardVariant = 'root' | 'manager' | 'teal' | 'light' | 'mini';

const photos: Record<string, string> = {
  board: '/connexion/github.png',
  director: '/banniere/DG.webp',
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

const GRADIENTS: Record<CardVariant, [string, string]> = {
  root: ['#ff8a3d', '#e63963'],
  manager: ['#b155f0', '#7c3aed'],
  teal: ['#7c5ce8', '#c14fd6'],
  light: ['#3b82f6', '#22c1dc'],
  mini: ['#14b8a6', '#0e9bb5'],
};

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

export default function OrganigrammePage() {
  const { t } = useTranslation();

  const renderCard = (key: string, label: string, variant: CardVariant, cardWidth = 170) => {
    const photoSrc = photos[key] ?? '';
    const isBig = variant === 'root' || variant === 'manager';
    const size = isBig ? 100 : 76;
    const [gradFrom, gradTo] = GRADIENTS[variant];

    return (
      <div
        className={`org-card org-card-${variant}`}
        style={{ width: cardWidth, '--gradFrom': gradFrom, '--gradTo': gradTo } as React.CSSProperties}
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
              Arborescence hiérarchique officielle de la Présidence, la Direction Générale, les Services Rattachés et les 5 Directions Opérationnelles de l&apos;INPTIC Gabon.
            </p>
          </div>
        </section>

        <div className="org-chart-shell">
          <div className="org-chart-stage">

            {/* 1. Président du Conseil d'Administration */}
            <div className="org-node">
              {renderCard('board', 'Président du Conseil\nd’Administration', 'root', 260)}
            </div>
            <div className="v-line" />

            {/* 2. Directeur Général */}
            <div className="org-node">
              {renderCard('director', 'Directeur Général', 'manager', 240)}
            </div>
            <div className="v-line" />

            {/* 3. Services Rattachés au DG (Spine centrale à 2 colonnes) */}
            <div className="relative border-2 border-slate-400 bg-white/60 p-4 rounded-2xl backdrop-blur-sm space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-500 block text-center">Services &amp; Staff rattachés au DG</span>

              <div className="flex gap-4 items-center justify-center">
                {renderCard('serviceAdminFinancier', 'Chef de Service\nAdministratif & Financier', 'teal', 160)}
                <div className="h-full w-0.5 bg-slate-300" />
                {renderCard('advisors', 'Conseillers', 'teal', 160)}
              </div>

              <div className="flex gap-4 items-center justify-center">
                {renderCard('controller', 'Contrôleur\nde Gestion', 'teal', 160)}
                <div className="h-full w-0.5 bg-slate-300" />
                {renderCard('assistant', 'Assistante\ndu DG', 'teal', 160)}
              </div>

              <div className="flex justify-center pt-1">
                {renderCard('chargestudes', 'Chargés d’études', 'teal', 200)}
              </div>
            </div>

            {/* Connecting line to the 5 Directions */}
            <div className="v-line" />
            <div className="h-1 bg-slate-400 w-[92%]" />

            {/* 4. Les 5 Colonnes des Grandes Directions Opérationnelles */}
            <div className="grid grid-cols-5 gap-6 w-full pt-4 items-start">

              {/* COLONNE 1 : DEP */}
              <div className="flex flex-col items-center space-y-4">
                {renderCard('studiesDirector', 'Directeur des Études\net de la Pédagogie', 'light', 200)}
                <div className="v-line" />
                <div className="grid grid-cols-2 gap-2 w-full">
                  {renderCard('deptReseaux', 'Chef de Département Réseaux &\nSystèmes Numériques', 'mini', 125)}
                  {renderCard('deptManagementCommerce', 'Chef de Département Management &\nCommerce', 'mini', 125)}
                  {renderCard('deptManagementTIC', 'Chef de Département Management\ndes TIC', 'mini', 125)}
                  {renderCard('deptAudiovisuel', 'Chef de Département\nAudiovisuel', 'mini', 125)}
                </div>
              </div>

              {/* COLONNE 2 : Formation Continue */}
              <div className="flex flex-col items-center space-y-4">
                {renderCard('continuingDirector', 'Directeur de la\nFormation Continue', 'light', 200)}
                <div className="v-line" />
                <div className="grid grid-cols-2 gap-2 w-full">
                  {renderCard('serviceStageEmploi', 'Services Stage\net Emploi', 'mini', 125)}
                  {renderCard('servicePlanification', 'Service Planification\net Évaluation', 'mini', 125)}
                  <div className="col-span-2 flex justify-center">
                    {renderCard('serviceVeilleTech', 'Service Veille Technologique\n& Accompagnement VAE', 'mini', 180)}
                  </div>
                </div>
              </div>

              {/* COLONNE 3 : Ressources Techniques & Innovation */}
              <div className="flex flex-col items-center space-y-4">
                {renderCard('technicalDirector', 'Directeur des Ressources\nTechniques & Innovation', 'light', 210)}
                <div className="v-line" />
                <div className="grid grid-cols-2 gap-2 w-full">
                  {renderCard('centreMaintenance', 'Chef du Centre de\nMaintenance & Assistance', 'mini', 125)}
                  {renderCard('serviceRessourcesDoc', 'Chef de Centre de\nRessources Documentaires', 'mini', 125)}
                  <div className="col-span-2 flex justify-center">
                    {renderCard('serviceInformatique', 'Chef de Service Informatique &\nGestion du SI', 'mini', 180)}
                  </div>
                </div>
              </div>

              {/* COLONNE 4 : Centre Avicenne UNESCO */}
              <div className="flex flex-col items-center space-y-4">
                {renderCard('unescoDirector', 'Directeur du Centre\nAvicenne-UNESCO-INPTIC', 'light', 200)}
                <div className="v-line" />
                <div className="grid grid-cols-2 gap-2 w-full">
                  {renderCard('expertPedagogique', 'Expert\nPédagogique', 'mini', 125)}
                  {renderCard('expertTechnique', 'Expert\nTechnique', 'mini', 125)}
                </div>
              </div>

              {/* COLONNE 5 : Secrétaire Général */}
              <div className="flex flex-col items-center space-y-4">
                {renderCard('secretary', 'Secrétaire\nGénéral', 'light', 200)}
                <div className="v-line" />
                <div className="grid grid-cols-2 gap-2 w-full">
                  {renderCard('serviceScolarite', 'Chef de Service\nScolarité', 'mini', 125)}
                  {renderCard('serviceCommunication', 'Chef de Service Communication\n& Relations Extérieures', 'mini', 125)}
                  {renderCard('serviceLogistique', 'Chef de Service\nLogistique & Achats', 'mini', 125)}
                  {renderCard('serviceSocial', 'Chef de Service\nSocial', 'mini', 125)}
                </div>
              </div>

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
          max-width: 1600px;
          margin: 0 auto;
        }

        .org-chart-shell {
          position: relative;
          overflow-x: auto;
          padding: 2rem 1rem;
          -webkit-overflow-scrolling: touch;
        }

        .org-chart-stage {
          position: relative;
          min-width: 1380px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .org-node { position: relative; z-index: 5; }

        .v-line {
          width: 2px;
          height: 24px;
          background: #000000;
        }

        .org-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .org-hex-svg {
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 6px 8px rgba(45, 51, 70, 0.22));
        }

        .org-pill {
          width: 100%;
          margin-top: -8px;
          padding: 16px 0.5rem 0.75rem;
          border-radius: 50px !important;
          background: linear-gradient(160deg, var(--gradFrom), var(--gradTo));
          box-shadow: 0 10px 18px rgba(1, 1, 3, 0.18);
        }

        .org-card-root .org-pill,
        .org-card-manager .org-pill {
          margin-top: -10px;
          padding-top: 20px;
          border-radius: 50px !important;
        }

        .org-card-label {
          width: 100%;
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1.25;
        }

        .org-card-root .org-card-label,
        .org-card-manager .org-card-label {
          font-size: 0.88rem;
          font-weight: 800;
        }

        .org-label-primary {
          font-weight: 800;
        }

        .org-label-secondary {
          display: inline;
          font-weight: 500;
          opacity: 0.9;
          font-size: 0.92em;
        }

        @media (max-width: 900px) {
          .org-page { padding: 2rem 0.5rem; }
          .org-chart-shell { padding: 1rem 0.25rem; }
        }
      `}</style>
    </main>
  );
}
