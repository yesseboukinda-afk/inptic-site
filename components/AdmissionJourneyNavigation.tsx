'use client';

import Link from 'next/link';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getCurrentAdmissionConcours,
  AdmissionWorkflowProfile,
  hasCompleteAdmissionDossier,
  hasCompletedAdmissionPreRegistration,
} from '@/lib/admissionsWorkflow';

const steps = [
  { id: 'account', label: 'Créer le compte candidat', href: '/candidat' },
  { id: 'opening', label: 'Ouverture de la session', href: '/concours' },
  { id: 'contest', label: 'Session sélectionnée automatiquement', href: '/concours' },
  { id: 'preRegistration', label: 'Se préinscrire', href: '/admissions/depot' },
  { id: 'dossier', label: 'Déposer le dossier (100 %)', href: '/admissions/depot' },
  { id: 'payment', label: 'Payer les frais', href: '/admissions/paiement' },
] as const;

type AdmissionStep = (typeof steps)[number]['id'];
type NavigationProfile = AdmissionWorkflowProfile & { paymentStatus?: string };
type InferredJourney = {
  current?: AdmissionStep;
  completed: AdmissionStep[];
  paymentUnlocked: boolean;
};

export default function AdmissionJourneyNavigation({
  current,
  completed,
  paymentUnlocked,
}: {
  current?: AdmissionStep;
  completed?: AdmissionStep[];
  paymentUnlocked?: boolean;
}) {
  const [inferredJourney, setInferredJourney] = useState<InferredJourney | null>(null);

  useEffect(() => {
    if (completed !== undefined && paymentUnlocked !== undefined) return;
    let active = true;

    Promise.all([
      fetch('/api/candidat/profile', { cache: 'no-store' }),
      fetch('/api/concours', { cache: 'no-store' }),
    ])
      .then(async ([profileResponse, concoursResponse]) => {
        if (!profileResponse.ok) return null;
        const [profilePayload, concoursPayload] = await Promise.all([
          profileResponse.json() as Promise<{ profiles?: NavigationProfile[] }>,
          concoursResponse.ok
            ? concoursResponse.json() as Promise<{ data?: Parameters<typeof getCurrentAdmissionConcours>[0] }>
            : Promise.resolve({ data: [] }),
        ]);
        const profile = Array.isArray(profilePayload.profiles) ? profilePayload.profiles[0] : null;
        if (!profile) return null;

        const isRegistrationOpen = Boolean(
          Array.isArray(concoursPayload.data) && getCurrentAdmissionConcours(concoursPayload.data),
        );
        const isPreRegistered = hasCompletedAdmissionPreRegistration(profile);
        const isDossierComplete = hasCompleteAdmissionDossier(profile);
        const isPaid = profile.paymentStatus === 'paid';
        const completedSteps: AdmissionStep[] = [
          'account',
          ...(isRegistrationOpen || isPreRegistered ? ['opening', 'contest'] as const : []),
          ...(isPreRegistered ? ['preRegistration'] as const : []),
          ...(isDossierComplete ? ['dossier'] as const : []),
          ...(isPaid ? ['payment'] as const : []),
        ];
        const inferredCurrent = !isRegistrationOpen
          ? 'opening'
          : !isPreRegistered
          ? 'preRegistration'
          : !isDossierComplete
              ? 'dossier'
              : !isPaid
                ? 'payment'
                : undefined;

        if (active) {
          setInferredJourney({
            current: inferredCurrent,
            completed: completedSteps,
            paymentUnlocked: isDossierComplete,
          });
        }
      })
      .catch(() => {
        if (active) setInferredJourney(null);
      });

    return () => {
      active = false;
    };
  }, [completed, paymentUnlocked]);

  const completedSteps = completed ?? inferredJourney?.completed ?? [];
  const isPaymentUnlocked = paymentUnlocked ?? inferredJourney?.paymentUnlocked ?? false;
  const currentStep = current ?? inferredJourney?.current;

  return (
    <nav aria-label="Étapes de l’inscription au concours" className="mx-auto max-w-6xl px-4 md:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const isComplete = completedSteps.includes(step.id);
            const isCurrent = !isComplete && step.id === currentStep;
            const isLocked = step.id === 'payment' && !isPaymentUnlocked;
            return (
              <li key={step.id}>
                {isLocked ? (
                  <div
                    aria-disabled="true"
                    className="flex min-h-14 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500"
                    title="Le paiement se débloque lorsque le dossier est complet à 100 %."
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black">{index + 1}</span>
                    <span className="min-w-0 flex-1">{step.label}</span>
                    <LockKeyhole size={15} aria-hidden="true" />
                  </div>
                ) : (
                  <Link
                    href={step.href}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      isComplete
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300'
                        : isCurrent
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      isComplete ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-white/20' : 'bg-white'
                    }`}>
                      {isComplete ? <CheckCircle2 size={15} aria-label="Étape terminée" /> : index + 1}
                    </span>
                    <span>{step.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
        {!isPaymentUnlocked && (
          <p className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <LockKeyhole size={14} aria-hidden="true" />
            Le paiement est la dernière étape et s’ouvre uniquement lorsque le dossier est complet à 100 %.
          </p>
        )}
      </div>
    </nav>
  );
}
