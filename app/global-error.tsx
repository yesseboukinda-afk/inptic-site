'use client';

import { useEffect } from 'react';
import MaintenanceNotice from '@/components/MaintenanceNotice';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('Erreur globale de rendu :', error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <MaintenanceNotice retry={retry} />
      </body>
    </html>
  );
}
