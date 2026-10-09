import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Award,
  Sparkles,
} from 'lucide-react';
import { getPostgresPool } from '@/lib/postgres';
import { normalizeRHPublicWhitelist, RHPublicWhitelist } from '@/types/rh';
import { logRHCardScan } from '@/lib/rh-card-audit';

export const dynamic = 'force-dynamic';

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

async function getAgentData(token: string, requestHeaders: Pick<Headers, 'get'>) {
  const { rows } = await getPostgresPool().query(
    'SELECT * FROM public.rh_profiles WHERE qr_token = $1 LIMIT 1',
    [token],
  );
  const profileData = rows[0];

  if (!profileData) {
    return { status: 'inconnu', message: 'Ce QR Code ne correspond à aucun profil enregistré auprès de l’INPTIC Gabon.' };
  }

  try {
    await logRHCardScan(profileData, requestHeaders);
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la journalisation du scan de carte RH:', {
      profileId: String(profileData.id),
      code: error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN_ERROR',
    });
    return {
      status: 'journal_indisponible',
      message: 'La vérification n’a pas été finalisée, car le scan n’a pas pu être enregistré dans le journal officiel. Veuillez réessayer.',
    };
  }

  if (profileData.qr_status !== 'actif' || profileData.is_archived) {
    return { status: 'revoque', message: 'Ce QR Code a été révoqué ou désactivé par l’administration de l’INPTIC. La carte n’est plus valide.' };
  }

  const whitelist: RHPublicWhitelist = normalizeRHPublicWhitelist(profileData.public_whitelist);
  const publicData: Record<string, any> = {
    status: 'valide',
    verifiedAt: new Date().toISOString(),
    institution: 'Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC Gabon)',
  };

  if (whitelist.photo) publicData.photoUrl = profileData.photo_url || '';
  if (whitelist.matricule) publicData.matricule = profileData.matricule;
  if (whitelist.lastName) publicData.lastName = profileData.last_name;
  if (whitelist.firstName) publicData.firstName = profileData.first_name;
  if (whitelist.position) publicData.position = profileData.position;
  if (whitelist.department) publicData.department = profileData.department;
  if (whitelist.status) publicData.agentStatus = profileData.status;

  if (whitelist.gender) publicData.gender = profileData.gender;
  if (whitelist.birthDate) publicData.birthDate = profileData.birth_date;
  if (whitelist.birthPlace) publicData.birthPlace = profileData.birth_place;
  if (whitelist.phone) publicData.phone = profileData.phone;
  if (whitelist.email) publicData.email = profileData.email;

  return { status: 'valide', data: publicData };
}

export default async function AgentPublicPage({ params }: AgentPageProps) {
  const { token } = await params;
  const result = await getAgentData(token, await headers());

  if (!result || result.status === 'inconnu') {
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

  if (result.status === 'journal_indisponible') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12 text-slate-900">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-amber-300 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle size={36} />
          </div>
          <h1 className="mt-5 text-xl font-black text-slate-900">Vérification indisponible</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{result.message}</p>
          <Link href="/" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-700">
            Retour au site officiel
          </Link>
        </div>
      </main>
    );
  }

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

  const agent = result?.data;
  if (!agent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-white">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-red-500/30 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <XCircle size={36} />
          </div>
          <h1 className="mt-5 text-xl font-black text-white">Carte Non Reconnue</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">Données agent introuvables.</p>
          <Link href="/" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-800 py-3 text-xs font-bold text-white transition hover:bg-slate-700">
            Retour au site officiel
          </Link>
        </div>
      </main>
    );
  }

  const nowFormatted = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const birthDate = agent.birthDate ? new Date(`${agent.birthDate}T00:00:00`) : null;
  const birthDateFormatted = birthDate && !Number.isNaN(birthDate.getTime())
    ? birthDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const fullName = [agent.firstName, agent.lastName].filter(Boolean).join(' ');
  const hasPublicIdentity = Boolean(
    agent.photoUrl || fullName || agent.position || agent.department
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-blue-900 via-blue-700 to-cyan-500" />

        <div className="bg-gradient-to-br from-slate-50 to-blue-50/70 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <Image
              src="/logoinptic.png"
              alt="Logo INPTIC"
              width={320}
              height={100}
              className="h-10 w-auto object-contain object-left"
            />
            <Image
              src="/rh/gabon-emblem.png"
              alt="Emblème de la République gabonaise"
              width={473}
              height={319}
              className="h-12 w-20 rounded-md border border-slate-200 bg-white p-1 object-contain"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              République gabonaise • INPTIC
            </p>
            <h1 className="mt-1 text-lg font-black tracking-wide text-slate-900">
              BADGE PROFESSIONNEL
            </h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-emerald-800">
              <ShieldCheck size={15} className="text-emerald-700" />
              <span>Badge authentifié</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Certification numérique • DRTI INPTIC Gabon
            </p>
          </div>
        </div>

        {/* Identité Agent */}
        {hasPublicIdentity && (
          <div className="flex flex-col items-center px-6 pt-6 text-center sm:px-8">
            {agent.photoUrl && (
              <div className="relative h-32 w-32 overflow-hidden rounded-xl border-2 border-blue-800 bg-slate-100 shadow-lg ring-4 ring-blue-100">
                <img
                  src={agent.photoUrl}
                  alt={fullName ? `Photo de ${fullName}` : 'Photo de l’agent'}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" title="Actif" />
              </div>
            )}

            <div>
              {fullName && (
                <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {fullName}
                </h2>
              )}
              {agent.position && (
                <p className="mt-1 text-sm font-black uppercase tracking-wider text-blue-800">
                  {agent.position}
                </p>
              )}
              {agent.department && (
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {agent.department}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Détails du badge */}
        <div className="mx-5 my-6 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:mx-7">
          {agent.matricule && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <span className="text-slate-500">Matricule professionnel :</span>
              <span className="text-right font-mono text-sm font-black text-blue-900">{agent.matricule}</span>
            </div>
          )}

          {agent.agentStatus && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <span className="text-slate-500">Statut professionnel :</span>
              <span className="font-medium capitalize text-slate-800">{agent.agentStatus}</span>
            </div>
          )}

          {agent.gender && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <span className="text-slate-500">Genre :</span>
              <span className="font-medium text-slate-800">
                {agent.gender === 'F' ? 'Féminin' : agent.gender === 'M' ? 'Masculin' : agent.gender}
              </span>
            </div>
          )}

          {birthDateFormatted && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <span className="text-slate-500">Date de naissance :</span>
              <span className="font-medium text-slate-800">{birthDateFormatted}</span>
            </div>
          )}

          {agent.birthPlace && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <span className="text-slate-500">Lieu de naissance :</span>
              <span className="text-right font-medium text-slate-800">{agent.birthPlace}</span>
            </div>
          )}

          {agent.email && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <span className="text-slate-500">E-mail officiel :</span>
              <span className="break-all text-right font-medium text-slate-800">{agent.email}</span>
            </div>
          )}

          {agent.phone && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <span className="text-slate-500">Téléphone pro :</span>
              <span className="font-medium text-slate-800">{agent.phone}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Horodatage du contrôle :</span>
            <span className="text-right font-medium text-slate-700">{nowFormatted}</span>
          </div>
        </div>

        {/* Pied de certification */}
        <div className="mx-5 mb-5 rounded-xl bg-slate-900 p-4 text-center text-xs leading-relaxed text-slate-200 sm:mx-7">
          <div className="inline-flex items-center gap-1.5 font-bold text-white">
            <Award size={15} />
            <span>République Gabonaise • INPTIC</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            Ce titre d&apos;accès numérique certifie que le titulaire est membre actif du personnel de l&apos;Institut National de la Poste, des Technologies de l&apos;Information et de la Communication.
          </p>
        </div>

        <Link
          href="/"
          className="mx-5 mb-6 inline-flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-blue-800 sm:mx-7 sm:w-[calc(100%-3.5rem)]"
        >
          <span>Accéder au site officiel INPTIC</span>
          <ExternalLink size={14} />
        </Link>
      </div>
    </main>
  );
}
