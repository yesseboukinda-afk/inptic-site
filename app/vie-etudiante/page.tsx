'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ConcoursStudentPage() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    router.replace('/admissions/suivi');
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
      <p>{t('pages.redirecting', 'Redirection vers l\'espace candidat...')}</p>
    </main>
  );
}
