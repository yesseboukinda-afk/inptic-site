'use client';

import { useEffect, useState } from 'react';
import type { PublicSiteContent, SiteCertification } from '@/lib/site-content';

export default function PublicCertifications({
  title = 'Certifications proposées',
  description = 'Les certifications actuellement enregistrées par l’INPTIC.',
  sectionClassName = '',
  gridClassName = 'md:grid-cols-2 xl:grid-cols-3',
}: {
  title?: string;
  description?: string;
  sectionClassName?: string;
  gridClassName?: string;
}) {
  const [items, setItems] = useState<SiteCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void fetch('/api/site-content', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Les certifications ne sont pas disponibles.');
        if (active) setItems((result.data as PublicSiteContent).certifications);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Les certifications ne sont pas disponibles.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className={`mx-auto max-w-6xl px-4 py-16 md:px-8 ${sectionClassName}`} aria-labelledby="site-certifications-title">
      <h2 id="site-certifications-title" className="text-3xl font-black text-slate-900">{title}</h2>
      <p className="mt-3 text-slate-600">{description}</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>}
      {loading && <p className="mt-5 text-sm text-slate-500">Chargement des certifications…</p>}
      {!loading && !error && items.length === 0 && <p className="mt-5 text-sm text-slate-500">Aucune certification n’est publiée pour le moment.</p>}
      <div className={`mt-7 grid gap-5 ${gridClassName}`}>
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.presentation}</p>
            {(item.issuer || item.duration) && <p className="mt-4 text-xs font-semibold text-slate-500">{[item.issuer, item.duration].filter(Boolean).join(' · ')}</p>}
            {item.website && <a href={item.website} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-blue-700 underline">Site officiel</a>}
          </article>
        ))}
      </div>
    </section>
  );
}
