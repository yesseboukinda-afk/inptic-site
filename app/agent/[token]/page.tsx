import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vérification d’Agent • INPTIC Gabon',
  description: 'Portail officiel d’authentification des cartes professionnelles INPTIC.',
  robots: {
    index: false,
    follow: false,
  },
};

type AgentPageProps = {
  params: Promise<{ token: string }>;
};

export default async function AgentPublicPage({ params }: AgentPageProps) {
  const { token } = await params;

  let result: any = null;
  let hasError = false;

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${siteUrl}/api/agent/${token}`, {
      cache: 'no-store',
    });
    result = await res.json();
    if (!res.ok && res.status !== 200) {
      hasError = true;
    }
  } catch (err) {
    hasError = true;
  }

  // Cas 1 : Token inconnu ou erreur de requête
  if (hasError || !result || result.status === 'inconnu') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-white">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-red-500/30 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <XCircle size={36} />
          </div>

          <h1 className="mt-5 text-xl font-black text-white">Carte Non Reconnue</h1>

          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {result?.message || 'Ce QR Code ne correspond à aucun profil enregistré auprès des services de l’INPTIC Gabon.'}
          </p>

          <div className="mt-6 rounded-2xl border border-white/5 bg-slate-950 p-4 text-left text-xs text-slate-400">
            <p className="font-semibold text-slate-300">Que faire ?</p>
            <p className="mt-1">
              Si vous êtes en possession de ce badge, veuillez contacter la Direction des Ressources Techniques et de l’Innovation (DRTI).
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-800 py-3 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            Retour au site officiel
          </Link>
        </div>
      </main>
    );
  }

  // Cas 2 : Token révoqué ou désactivé
  if (result.status === 'revoque') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-white">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <AlertTriangle size={36} />
          </div>

          <h1 className="mt-5 text-xl font-black text-white">Carte Révoquée / Invalide</h1>

          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {result.message}
          </p>

          {result.matricule && (
            <p className="mt-3 text-xs font-mono text-slate-500">Matricule : {result.matricule}</p>
          )}

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-amber-300">
            Ce titre d’accès a été invalidé. Tout usage frauduleux est passible de sanctions administratives.
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-800 py-3 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            Retour au site officiel
          </Link>
        </div>
      </main>
    );
  }

  const agent = result.data;

  // Cas 3 : Carte valide & vérifiée
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white">
      {/* Carte d'identification mobile */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-blue-400/30 bg-slate-950/95 p-6 shadow-[0_0_50px_rgba(59,130,246,0.3)] backdrop-blur-2xl sm:p-8">
        {/* Bandeau supérieur officiel INPTIC */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-[#D4AF37]" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logoinptic.png"
              alt="Logo INPTIC"
              width={100}
              height={36}
              className="h-7 w-auto object-contain brightness-110"
              priority
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={13} />
            <span>Vérifié</span>
          </div>
        </div>

        {/* Photo et Nom de l'agent */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-[#D4AF37] blur-xs" />
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-950 bg-slate-800">
              {agent.photoUrl ? (
                <img
                  src={agent.photoUrl}
                  alt={`${agent.firstName} ${agent.lastName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-900/40 text-blue-300">
                  <User size={42} />
                </div>
              )}
            </div>
          </div>

          <h1 className="mt-4 text-xl font-black tracking-tight text-white">
            {agent.firstName} {agent.lastName}
          </h1>

          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-cyan-400">
            {agent.position}
          </p>

          <span className="mt-1.5 inline-block rounded-md bg-slate-800/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-300 border border-white/5">
            {agent.matricule}
          </span>
        </div>

        {/* Fiche des champs vérifiés (selon la liste blanche) */}
        <div className="mt-6 space-y-2.5 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs">
          {agent.department && (
            <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
              <span className="text-slate-400 shrink-0">Direction / Service</span>
              <span className="font-semibold text-right text-slate-200">{agent.department}</span>
            </div>
          )}

          {agent.agentStatus && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Statut administratif</span>
              <span className="font-semibold capitalize text-emerald-400">{agent.agentStatus}</span>
            </div>
          )}

          {agent.gender && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Genre</span>
              <span className="font-semibold text-slate-200">{agent.gender === 'F' ? 'Féminin' : 'Masculin'}</span>
            </div>
          )}

          {agent.birthDate && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Date de naissance</span>
              <span className="font-semibold text-slate-200">
                {new Date(agent.birthDate).toLocaleDateString('fr-FR')}
                {agent.birthPlace ? ` à ${agent.birthPlace}` : ''}
              </span>
            </div>
          )}

          {agent.email && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Courriel pro</span>
              <a href={`mailto:${agent.email}`} className="font-semibold text-cyan-400 hover:underline">
                {agent.email}
              </a>
            </div>
          )}

          {agent.phone && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Téléphone pro</span>
              <a href={`tel:${agent.phone}`} className="font-semibold text-cyan-400 hover:underline">
                {agent.phone}
              </a>
            </div>
          )}
        </div>

        {/* Cachet et signature électronique */}
        <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-950/30 p-3 text-center">
          <p className="text-[10px] font-semibold text-blue-300">
            Attestation d’appartenance émise par l’INPTIC Gabon
          </p>
          <p className="mt-0.5 text-[9px] text-slate-400">
            Vérification cryptographique DRTI-CDC-2026-001 • Horodatage certifié
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="text-[11px] font-semibold text-slate-400 hover:text-white transition"
          >
            ← Accéder au portail web INPTIC
          </Link>
        </div>
      </div>
    </main>
  );
}
