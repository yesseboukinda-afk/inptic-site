'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function Depot() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('inptic_user');
    router.replace(storedUser ? '/admissions/suivi' : '/candidat');
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
      <p>{t('pages.redirecting')}</p>
    </main>
  );
}
