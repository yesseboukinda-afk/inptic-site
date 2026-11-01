import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Lottie } from 'lottie-react';
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  Mail,
  Phone,
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
  if (whitelist.department) {
    publicData.direction = profileData.direction || '';
    publicData.service = profileData.service || '';
    publicData.department =
      [publicData.direction, publicData.service].filter(Boolean).join(' / ') || profileData.department;
  }
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
  const organizationLabel = [agent.direction, agent.service]
    .filter((value: string | undefined) => Boolean(value?.trim()))
    .join(' / ') || agent.department;
  const hasPublicIdentity = Boolean(
    agent.photoUrl || fullName || agent.position || organizationLabel
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0c3540] px-4 py-8 text-slate-900 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-16 h-72 w-72 border-[28px] border-[#1d6970]/30" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 border-[36px] border-[#55a88f]/20" />

      <article className="relative w-full max-w-md overflow-hidden border-[6px] border-[#104e58] bg-[#e5f3eb] shadow-[0_28px_80px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between gap-4 border-b-[5px] border-[#104e58] bg-[#d5ebdf] px-4 py-4 sm:px-6">
          <img
            src="/logoinptic.ico"
            alt="Logo de l’Institut INPTIC"
            className="h-10 w-auto max-w-[68%] object-contain object-left"
          />
          <Image
            src="/rh/gabon-emblem.png"
            alt="Emblème de la République gabonaise"
            width={473}
            height={319}
            className="h-12 w-[4.5rem] border border-[#b8d1c5] bg-white p-1 object-contain"
          />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#b7dfcf] via-[#d8eee3] to-[#9bcbb8] px-5 pb-5 pt-4 sm:px-6">
          <div aria-hidden="true" className="absolute -right-14 top-5 h-32 w-32 rotate-45 border-[18px] border-white/20" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#315b5c]">
                <Sparkles size={12} aria-hidden="true" />
                République gabonaise • INPTIC
              </p>
              <h1 className="mt-1 text-xl font-black tracking-[0.12em] text-[#123f49] sm:text-2xl">
                DIGITAL ID
              </h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#38686a]">
                Badge professionnel numérique
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-white bg-white shadow-lg ring-2 ring-[#2a8756]">
              <Lottie
                src="/icons8-check-50.json"
                autoplay
                loop={false}
                className="h-full w-full"
                aria-label="Badge authentifié"
              />
            </div>
          </div>
          <div className="relative mt-4 inline-flex items-center gap-2 border border-[#258452]/30 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#17613d]">
            <ShieldCheck size={14} aria-hidden="true" />
            Identité authentifiée
          </div>
        </div>

        <div className="border-b-[5px] border-[#104e58] bg-[#f3faf5] p-4 sm:p-5">
          {hasPublicIdentity ? (
            <div className="flex items-center gap-4">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden border-[3px] border-[#1a5c63] bg-[#c5e0d3] shadow-md">
                {agent.photoUrl ? (
                  <img
                    src={agent.photoUrl}
                    alt={fullName ? `Photo de ${fullName}` : 'Photo de l’agent'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl font-black uppercase text-[#1a5c63]">
                    {fullName.split(/\s+/).map((part: string) => part[0]).slice(0, 2).join('') || 'IN'}
                  </span>
                )}
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 border-2 border-white bg-[#38a96b]" title="Profil actif" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#578178]">Titulaire du badge</p>
                {fullName && (
                  <h2 className="mt-1 break-words text-xl font-black uppercase leading-tight text-[#123f49] sm:text-2xl">
                    {fullName}
                  </h2>
                )}
                {agent.position && (
                  <p className="mt-2 break-words border-l-[3px] border-[#3d9d79] pl-2 text-xs font-extrabold uppercase leading-snug text-[#266c66]">
                    {agent.position}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-sm font-semibold text-[#315b5c]">
              Les informations d’identité ne sont pas autorisées à l’affichage public.
            </div>
          )}
        </div>

        <div className="space-y-2.5 bg-[#e5f3eb] px-4 py-4 sm:px-5">
          {agent.matricule && (
            <div className="flex items-center justify-between gap-3 border-b border-[#bdd8ca] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#54766b]">Matricule</span>
              <span className="text-right font-mono text-sm font-black text-[#123f49]">{agent.matricule}</span>
            </div>
          )}
          {agent.direction && (
            <div className="flex items-start gap-3 border-b border-[#bdd8ca] pb-2">
              <Building2 size={15} className="mt-0.5 shrink-0 text-[#26796b]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#54766b]">Direction</p>
                <p className="mt-0.5 break-words text-xs font-bold text-[#123f49]">{agent.direction}</p>
              </div>
            </div>
          )}
          {agent.service && (
            <div className="flex items-start gap-3 border-b border-[#bdd8ca] pb-2">
              <Building2 size={15} className="mt-0.5 shrink-0 text-[#26796b]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#54766b]">Service</p>
                <p className="mt-0.5 break-words text-xs font-bold text-[#123f49]">{agent.service}</p>
              </div>
            </div>
          )}
          {!agent.direction && !agent.service && agent.department && (
            <div className="flex items-start gap-3 border-b border-[#bdd8ca] pb-2">
              <Building2 size={15} className="mt-0.5 shrink-0 text-[#26796b]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#54766b]">Affectation</p>
                <p className="mt-0.5 break-words text-xs font-bold text-[#123f49]">{agent.department}</p>
              </div>
            </div>
          )}
          {agent.agentStatus && (
            <div className="flex items-center justify-between gap-3 border-b border-[#bdd8ca] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#54766b]">Statut</span>
              <span className="border border-[#3e9c6e]/30 bg-[#d7f0df] px-2 py-1 text-[10px] font-black uppercase text-[#17613d]">
                {agent.agentStatus}
              </span>
            </div>
          )}
          {agent.gender && (
            <div className="flex items-center justify-between gap-3 border-b border-[#bdd8ca] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#54766b]">Genre</span>
              <span className="text-xs font-semibold text-[#123f49]">
                {agent.gender === 'F' ? 'Féminin' : agent.gender === 'M' ? 'Masculin' : agent.gender}
              </span>
            </div>
          )}
          {birthDateFormatted && (
            <div className="flex items-center justify-between gap-3 border-b border-[#bdd8ca] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#54766b]">Date de naissance</span>
              <span className="text-right text-xs font-semibold text-[#123f49]">{birthDateFormatted}</span>
            </div>
          )}
          {agent.birthPlace && (
            <div className="flex items-center justify-between gap-3 border-b border-[#bdd8ca] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#54766b]">Lieu de naissance</span>
              <span className="text-right text-xs font-semibold text-[#123f49]">{agent.birthPlace}</span>
            </div>
          )}
          {agent.email && (
            <div className="flex items-start justify-between gap-3 border-b border-[#bdd8ca] pb-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#54766b]">
                <Mail size={13} aria-hidden="true" /> E-mail
              </span>
              <span className="break-all text-right text-xs font-semibold text-[#123f49]">{agent.email}</span>
            </div>
          )}
          {agent.phone && (
            <div className="flex items-center justify-between gap-3 border-b border-[#bdd8ca] pb-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#54766b]">
                <Phone size={13} aria-hidden="true" /> Téléphone
              </span>
              <span className="text-right text-xs font-semibold text-[#123f49]">{agent.phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#54766b]">Vérifié le</span>
            <span className="text-right text-[10px] font-semibold text-[#315b5c]">{nowFormatted}</span>
          </div>
        </div>

        <div className="bg-[#103f49] px-5 py-4 text-center text-[#d7eee4]">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white">
            <Award size={16} aria-hidden="true" />
            <span>Certification officielle INPTIC</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#c2ded2]">
            Ce badge numérique confirme que son titulaire est membre actif du personnel de l’Institut National de la Poste, des Technologies de l’Information et de la Communication.
          </p>
          <p className="mt-3 border-t border-white/15 pt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#9ec9b8]">
            Contrôle enregistré • DRTI
          </p>
        </div>

        <div className="bg-[#0c3540] px-4 py-3 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-[#a7d8c2]/50 bg-[#1c5960] px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-[#26736d]"
          >
            <span>Site officiel INPTIC</span>
            <ExternalLink size={13} aria-hidden="true" />
          </Link>
        </div>
      </article>
    </main>
  );
}
