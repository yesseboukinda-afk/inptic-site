'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-8">
          <TechVeilleFeed accessToken={accessToken} />
          {canViewReputation && <EReputationDashboard accessToken={accessToken} />}
        </div>
      </div>
    </main>
  );
}
