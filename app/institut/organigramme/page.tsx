export default function OrganigrammePage() {
  const topRow = [
    'Chargés\nd’études',
    'Controleur\nde Gestion',
    'Chef de\nService',
    'Conseillers',
    'Assistante\ndu DG',
  ];

  const middleRow = [
    'Directeur des\nEtudes et de la\nPédagogie',
    'Directeur de la\nFormation\nContinue',
    'Directeur des\nRessources techniques\net de l’innovation',
    'Directeur du\nCentre\nUNESCO-INPTIC',
    'Secrétaire\nGénérale',
  ];

  const lowerCols = [
    [
      'Chef de Département\nRéseaux et Systèmes\nNumériques',
      'Chef de département\nManagement et\nCommerce',
      'Chef de département\nManagement des TIC',
      'Chef de Département\nAudiovisuel',
    ],
    [
      'Services Stage et\nEmploi',
      'Service Planification\net Evaluation',
      'Service Veille\nTechnologique et\nAccompagnement VAE',
    ],
    [
      'Chef du Centre de\nMaintenance et\nAssistance Technique',
      'Chef de Service\nRessources\nDocumentaires',
      'Chef de Service\nInformatique et\nGestion du Système\nd’information',
    ],
    [
      'Expert pédagogique',
      'Expert Technique',
    ],
    [
      'Chef de Service\nScolarité',
      'Chef de Service\nLogistique et Achat',
      'Chef de Service\nSocial',
      'Chef de Service\nCommunication et\nRelations Extérieures',
    ],
  ];

  const renderMultiline = (label: string, variant: 'root' | 'manager' | 'teal' | 'light' | 'mini') => {
    const baseStyle = {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      border: '2px solid rgba(15, 23, 42, 0.8)',
      boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      animation: 'floatIn 0.6s ease-out both',
      lineHeight: 1.2,
    };

    const variants = {
      root: {
        width: 'min(88vw, 540px)',
        minHeight: '92px',
        borderRadius: '0.85rem',
        background: 'linear-gradient(135deg, #0e9f57, #0c8e4d)',
        color: 'white',
        fontWeight: 900,
        fontSize: 'clamp(1.05rem, 1.8vw, 2rem)',
        padding: '1rem 1.2rem',
      },
      manager: {
        width: 'min(72vw, 360px)',
        minHeight: '76px',
        borderRadius: '0.75rem',
        background: 'linear-gradient(135deg, #b6e3c3, #a2d6b3)',
        color: '#0f172a',
        fontWeight: 900,
        fontSize: 'clamp(1rem, 1.7vw, 1.8rem)',
        padding: '0.8rem 1rem',
      },
      teal: {
        width: '100%',
        minHeight: '86px',
        borderRadius: '0.7rem',
        background: 'linear-gradient(135deg, #5dd3d8, #4ad0d2)',
        color: 'white',
        fontWeight: 800,
        fontSize: 'clamp(0.8rem, 1vw, 1.1rem)',
        padding: '0.9rem 0.6rem',
      },
      light: {
        width: '100%',
        minHeight: '88px',
        borderRadius: '0.7rem',
        background: 'linear-gradient(135deg, #dfeef6, #dfe8f0)',
        color: '#0f172a',
        fontWeight: 700,
        fontSize: 'clamp(0.72rem, 0.9vw, 1rem)',
        padding: '0.8rem 0.5rem',
      },
      mini: {
        width: '100%',
        minHeight: '82px',
        borderRadius: '0.7rem',
        background: 'linear-gradient(135deg, #f6f7f8, #edf1f4)',
        color: '#0f172a',
        fontWeight: 600,
        fontSize: 'clamp(0.68rem, 0.8vw, 0.9rem)',
        padding: '0.7rem 0.45rem',
        borderColor: 'rgba(15, 23, 42, 0.55)',
      },
    } as const;

    return (
      <div key={label} style={{ ...baseStyle, ...variants[variant] }}>
        {label.split('\n').map((part, index) => (
          <span key={`${label}-${index}`}>
            {part}
            {index < label.split('\n').length - 1 ? <br /> : null}
          </span>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-16 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">INPTIC</p>
          <h1 className="mt-4 text-3xl font-black md:text-5xl">Organigramme</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
            Structure organisationnelle de l’Institut National de la Poste, des Technologies de l’Information et de la Communication.
          </p>
        </div>

        <div
          className="org-chart-shell"
          style={{
            overflowX: 'auto',
            borderRadius: '1.5rem',
            border: '1px solid #e2e8f0',
            background: 'rgba(255, 255, 255, 0.82)',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            padding: '2rem 1rem',
          }}
        >
          <div
            className="org-chart-stage"
            style={{
              position: 'relative',
              minWidth: '1040px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 0 0.5rem',
            }}
          >
            <div className="org-root">{renderMultiline('Président du conseil\nd’Administration', 'root')}</div>
            <div className="org-connector short" />
            <div className="org-manager">{renderMultiline('Directeur Général', 'manager')}</div>
            <div className="org-connector short" />

            <div className="org-row row-top">
              {topRow.map((label) => (
                <div key={label} className="org-col-item">
                  {renderMultiline(label, 'teal')}
                </div>
              ))}
            </div>

            <div className="org-connector mid" />

            <div className="org-row row-middle">
              {middleRow.map((label) => (
                <div key={label} className="org-col-item">
                  {renderMultiline(label, 'light')}
                </div>
              ))}
            </div>

            <div className="org-lower-grid">
              {lowerCols.map((col, colIndex) => (
                <div key={`col-${colIndex}`} className="org-lower-col">
                  {col.map((label) => (
                    <div key={label} className="org-lower-item">
                      {renderMultiline(label, 'mini')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .org-root,
        .org-manager,
        .org-col-item,
        .org-lower-item {
          position: relative;
          z-index: 1;
        }

        .org-root::after,
        .org-manager::after,
        .org-col-item::after,
        .org-lower-item::after {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          background: rgba(15, 23, 42, 0.8);
          z-index: 0;
        }

        .org-root::after {
          top: calc(100% + 4px);
          height: 18px;
        }

        .org-manager::after {
          top: calc(100% + 4px);
          height: 22px;
        }

        .org-col-item::after {
          top: calc(100% + 10px);
          height: 30px;
        }

        .org-lower-item::before {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: -12px;
          width: 2px;
          height: 12px;
          background: rgba(15, 23, 42, 0.8);
          z-index: 0;
        }

        .org-lower-col::before {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: -18px;
          width: 2px;
          height: 18px;
          background: rgba(15, 23, 42, 0.8);
        }

        .org-connector {
          position: relative;
          width: 2px;
          background: rgba(15, 23, 42, 0.8);
          z-index: 0;
        }

        .org-connector.short {
          height: 20px;
        }

        .org-connector.mid {
          height: 40px;
        }

        .org-row {
          display: grid;
          width: 100%;
          gap: 1rem;
          justify-items: center;
          padding: 0 1.25rem;
        }

        .org-chart-shell {
          -webkit-overflow-scrolling: touch;
        }

        .org-row,
        .org-lower-grid {
          width: 100%;
        }

        .row-top {
          grid-template-columns: repeat(5, minmax(180px, 1fr));
          margin-top: 0.5rem;
        }

        .row-middle {
          grid-template-columns: repeat(5, minmax(170px, 1fr));
          margin-top: 0.15rem;
        }

        .org-lower-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(170px, 1fr));
          width: 100%;
          gap: 1rem;
          margin-top: 1rem;
          padding: 0 1.25rem 0.5rem;
        }

        .org-lower-col {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          align-items: stretch;
        }

        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 900px) {
          .org-chart-shell {
            padding: 1.25rem 0.5rem;
          }

          .org-chart-stage {
            min-width: 800px;
          }
        }

        @media (max-width: 640px) {
          .org-chart-shell {
            padding: 0.75rem 0.25rem;
          }

          .org-chart-stage {
            min-width: 700px;
          }

          .org-root::after {
            top: calc(100% + 3px);
            height: 14px;
          }

          .org-manager::after {
            top: calc(100% + 3px);
            height: 18px;
          }

          .org-col-item::after {
            top: calc(100% + 8px);
            height: 22px;
          }

          .org-connector.short {
            height: 14px;
          }

          .org-connector.mid {
            height: 24px;
          }

          .row-top,
          .row-middle,
          .org-lower-grid {
            gap: 0.55rem;
            padding-left: 0.2rem;
            padding-right: 0.2rem;
          }
        }

        @media (max-width: 480px) {
          .org-chart-stage {
            min-width: 620px;
          }

          .org-root,
          .org-manager {
            max-width: 90vw;
          }

          .row-top,
          .row-middle,
          .org-lower-grid {
            grid-template-columns: repeat(5, minmax(100px, 1fr));
          }
        }
      `}</style>
    </main>
  );
}
