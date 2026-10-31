'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, RadioTower } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { canAccessStaffService } from '@/lib/roles';
import TechVeilleFeed from '@/components/TechVeilleFeed';
import EReputationDashboard from '@/components/EReputationDashboard';

export default function VeilleClient() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState('');
  const [canViewReputation, setCanViewReputation] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    let active = true;
    void authClient.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      const session = data.session;
      if (error || !session) {
        router.replace('/candidat');
        return;
      }

      const role = session.user.app_metadata?.role ?? session.user.app_metadata?.roles;
      const assignedService = session.user.user_metadata?.service ?? session.user.user_metadata?.department;
      if (!canAccessStaffService(role, 'announcements', assignedService)) {
        router.replace('/candidat');
        return;
      }

      setAccessToken(session.access_token);
      setCanViewReputation(canAccessStaffService(role, 'reputation', assignedService));
      setCheckingAccess(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (checkingAccess) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
          <LoaderCircle size={18} className="animate-spin" /> Vérification de votre accès…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-lg sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400 text-slate-950">
              <RadioTower size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">INPTIC · Espace professionnel</p>
              <h1 className="text-2xl font-black sm:text-3xl">Veille</h1>
              <p className="mt-1 text-sm text-slate-300">Veille technologique et suivi de l’e-réputation.</p>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} aria-hidden="true" /> Accueil
          </Link>
        </header>

        <div className="grid items-start gap-8 xl:grid-cols-2">
          <TechVeilleFeed accessToken={accessToken} />
          {canViewReputation && <EReputationDashboard accessToken={accessToken} />}
        </div>
      </div>
    </main>
  );
}
