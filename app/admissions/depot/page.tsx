'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Depot() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('inptic_user');
    router.replace(storedUser ? '/admissions/suivi' : '/candidat');
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
      <p>Redirection vers votre espace de candidature…</p>
    </main>
  );
}
