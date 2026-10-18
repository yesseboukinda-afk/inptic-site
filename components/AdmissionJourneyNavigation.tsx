import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const steps = [
  { id: 'guide', label: 'Guide d’admission', href: '/admissions/guide' },
  { id: 'concours', label: 'Concours', href: '/concours' },
  { id: 'results', label: 'Résultats', href: '/concours?tab=resultats' },
  { id: 'deposit', label: 'Dépôt de dossier', href: '/admissions/depot' },
  { id: 'tracking', label: 'Suivi', href: '/admissions/suivi' },
] as const;

export default function AdmissionJourneyNavigation({ current }: { current: (typeof steps)[number]['id'] }) {
  const currentIndex = steps.findIndex((step) => step.id === current);
  const nextStep = steps[currentIndex + 1];

  return (
    <nav aria-label="Progression de l’admission" className="mx-auto max-w-6xl px-4 md:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => {
            const isCurrent = step.id === current;
            return (
              <li key={step.id}>
                <Link
                  href={step.href}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    isCurrent
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${isCurrent ? 'bg-white/20' : 'bg-white'}`}>{index + 1}</span>
                  <span>{step.label}</span>
                </Link>
              </li>
            );
          })}
        </ol>
        {nextStep && (
          <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
            <Link
              href={nextStep.href}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Étape suivante : {nextStep.label}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
