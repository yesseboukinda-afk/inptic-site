'use client';

type MaintenanceNoticeProps = {
  retry: () => void;
};

export default function MaintenanceNotice({ retry }: MaintenanceNoticeProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
      }}
    >
      <section style={{ width: '100%', maxWidth: '520px' }} aria-labelledby="maintenance-title">
        <p style={{ margin: '0 0 12px', color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.08em' }}>
          INPTIC
        </p>
        <h1 id="maintenance-title" style={{ margin: '0 0 12px', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)' }}>
          Site momentanément indisponible
        </h1>
        <p style={{ margin: '0 auto 24px', maxWidth: '440px', color: '#475569', lineHeight: 1.6 }}>
          Une intervention est en cours pour rétablir le service. Veuillez réessayer dans quelques instants.
        </p>
        <button
          type="button"
          onClick={retry}
          style={{
            border: 0,
            padding: '12px 20px',
            background: '#1d4ed8',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </section>
    </main>
  );
}
