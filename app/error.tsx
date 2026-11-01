'use client';

import { useEffect } from 'react';
import MaintenanceNotice from '@/components/MaintenanceNotice';

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('Erreur de rendu de page :', error);
  }, [error]);

  return <MaintenanceNotice retry={retry} />;
}
