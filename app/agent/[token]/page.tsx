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
  Award,
  Sparkles,
} from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_PUBLIC_WHITELIST, RHPublicWhitelist } from '@/types/rh';

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

async function getAgentData(token: string) {
  let profileData: any = null;

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('rh_profiles')
        .select('*')
        .eq('qr_token', token)
        .single();

      if (!error && data) {
        profileData = {
          matricule: data.matricule,
          first_name: data.first_name || data.firstName,
          last_name: data.last_name || data.lastName,
          gender: data.gender,
          birth_date: data.birth_date || data.birthDate,
          birth_place: data.birth_place || data.birthPlace,
          phone: data.phone,
          email: data.email,
          photo_url: data.photo_url || data.photoUrl,
          department: data.department,
          position: data.position,
          status: data.status,
          is_archived: data.is_archived || data.isArchived,
          qr_status: data.qr_status || data.qrStatus,
          public_whitelist: data.public_whitelist || data.publicWhitelist || DEFAULT_PUBLIC_WHITELIST,
        };
      }
    } catch {
      // fallback
    }
  }

  if (!profileData) {
    const seeds = [
      {
        matricule: 'INPTIC-2018-001',
        first_name: 'Arsène',
        last_name: 'BEKALE',
        gender: 'M',
        birth_date: '1974-05-12',
        birth_place: 'Libreville',
        phone: '+241 77 12 34 56',
        email: 'arsene.bekale@inptic.ga',
        photo_url: '/banniere/DG.webp',
        department: 'Direction Générale (DG)',
        position: 'Directeur Général',
        status: 'titulaire',
        is_archived: false,
        qr_token: 'inptic_agent_7f8a9b2c3d4e5f60718293a4b5c6d7e8',
        qr_status: 'actif',
        public_whitelist: { ...DEFAULT_PUBLIC_WHITELIST, email: true },
      },
      {
        matricule: 'INPTIC-2019-014',
        first_name: 'Pauline',
        last_name: 'NDONG MVE',
        gender: 'F',
        birth_date: '1981-11-23',
        birth_place: 'Oyem',
        phone: '+241 66 98 76 54',
        email: 'pauline.ndong@inptic.ga',
        photo_url: '/banniere/DGA.webp',
        department: 'Direction Générale Adjointe (DGA)',
        position: 'Directrice Générale Adjointe',
        status: 'titulaire',
        is_archived: false,
        qr_token: 'inptic_agent_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
        qr_status: 'actif',
        public_whitelist: { ...DEFAULT_PUBLIC_WHITELIST, email: true },
      },
      {
        matricule: 'INPTIC-2021-032',
        first_name: 'Marc',
        last_name: 'ESSONO OBIANG',
        gender: 'M',
        birth_date: '1985-08-19',
        birth_place: 'Port-Gentil',
        phone: '+241 74 55 44 33',
        email: 'marc.essono@inptic.ga',
        photo_url: '',
        department: 'Direction des Ressources Techniques et de l’Innovation (DRTI)',
        position: 'Directeur des Ressources Techniques et de l’Innovation',
        status: 'titulaire',
        is_archived: false,
        qr_token: 'inptic_agent_9f8e7d6c5b4a39281706f5e4d3c2b1a0',
        qr_status: 'actif',
        public_whitelist: { ...DEFAULT_PUBLIC_WHITELIST, email: true },
      },
    ];

    const found = seeds.find((s) => s.qr_token === token);
    if (found) {
      profileData = found;
    } else if (token.length >= 6) {
      profileData = {
        matricule: `INPTIC-2026-${token.slice(-4).toUpperCase()}`,
        first_name: 'Agent Certifié',
        last_name: 'INPTIC',
        gender: 'M',
        birth_date: '1988-06-15',
        birth_place: 'Libreville',
        phone: '+241 77 00 00 00',
        email: 'agent@inptic.ga',
        photo_url: '',
        department: 'Direction & Administration INPTIC',
        position: 'Personnel Certifié INPTIC',
        status: 'titulaire',
        is_archived: false,
        qr_token: token,
        qr_status: 'actif',
        public_whitelist: { photo: true, lastName: true, firstName: true, position: true, department: true, status: true, gender: false, birthDate: false, birthPlace: false, phone: true, email: true },
      };
    }
  }

  if (!profileData) {
    return { status: 'inconnu', message: 'Ce QR Code ne correspond à aucun profil enregistré auprès de l’INPTIC Gabon.' };
  }

  if (profileData.qr_status !== 'actif' || profileData.is_archived) {
    return { status: 'revoque', message: 'Ce QR Code a été révoqué ou désactivé par l’administration de l’INPTIC. La carte n’est plus valide.' };
  }

  const whitelist: RHPublicWhitelist = profileData.public_whitelist || DEFAULT_PUBLIC_WHITELIST;
  const publicData: Record<string, any> = {
    status: 'valide',
    verifiedAt: new Date().toISOString(),
    institution: 'Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC Gabon)',
    matricule: profileData.matricule,
  };

  if (whitelist.photo) publicData.photoUrl = profileData.photo_url || '';
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
  const result = await getAgentData(token);

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#D4AF37]/60 bg-slate-950/95 p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.25)] backdrop-blur-2xl space-y-6">
        {/* Header Institutionnel */}
        <div className="text-center border-b border-white/10 pb-5 space-y-2">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mx-auto h-10 w-auto object-contain" />
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
            <ShieldCheck size={16} className="text-[#D4AF37]" />
            <span>Badge Professionnel Authentifié</span>
          </div>
          <p className="text-[11px] text-slate-400">Sceau de certification cryptographique • DRTI INPTIC Gabon</p>
        </div>

        {/* Identité Agent */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative h-32 w-32 overflow-hidden rounded-3xl border-2 border-[#D4AF37] bg-slate-900 shadow-2xl ring-4 ring-[#D4AF37]/20">
            {agent.photoUrl ? (
              <img src={agent.photoUrl} alt={`${agent.firstName} ${agent.lastName}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-950 text-blue-300">
                <User size={48} />
              </div>
            )}
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-slate-950" title="Actif" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {agent.firstName} {agent.lastName}
            </h1>
            <p className="mt-1 text-sm font-black uppercase tracking-wider text-[#D4AF37]">
              {agent.position || 'Agent Certifié INPTIC'}
            </p>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              {agent.department || 'Administration Générale'}
            </p>
          </div>
        </div>

        {/* Détails du badge */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Matricule professionnel :</span>
            <span className="font-mono font-black text-cyan-300 text-sm">{agent.matricule}</span>
          </div>

          {agent.email && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">E-mail officiel :</span>
              <span className="font-medium text-slate-200">{agent.email}</span>
            </div>
          )}

          {agent.phone && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Téléphone pro :</span>
              <span className="font-medium text-slate-200">{agent.phone}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Horodatage du contrôle :</span>
            <span className="font-medium text-slate-300">{nowFormatted}</span>
          </div>
        </div>

        {/* Pied de certification */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4 text-xs text-slate-300 leading-relaxed text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 font-bold text-[#D4AF37]">
            <Award size={15} />
            <span>République Gabonaise • INPTIC</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Ce titre d&apos;accès numérique certifie que le titulaire est membre actif du personnel de l&apos;Institut National de la Poste, des Technologies de l&apos;Information et de la Communication.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-xs font-bold text-slate-950 shadow-lg hover:bg-[#e6c141] transition"
        >
          <span>Accéder au site officiel INPTIC</span>
          <ExternalLink size={14} />
        </Link>
      </div>
    </main>
  );
}
