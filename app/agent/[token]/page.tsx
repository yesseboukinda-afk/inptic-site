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

  // Cas 1 : Token inconnu ou erreur de requête
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

  // Cas 3 : Carte valide & vérifiée
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-white">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck size={22} />
            <span className="text-xs font-bold uppercase tracking-wider">Badge Officiel Certifié</span>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/20">
            {agent.agentStatus || 'Actif'}
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-slate-950 shadow-xl">
            {agent.photoUrl ? (
              <img src={agent.photoUrl} alt={`${agent.firstName} ${agent.lastName}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-950 text-blue-300">
                <User size={40} />
              </div>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-black text-white">
            {agent.firstName} {agent.lastName}
          </h1>

          <p className="mt-1 text-sm font-bold text-[#D4AF37]">
            {agent.position || 'Agent INPTIC'}
          </p>

          <p className="text-xs text-slate-400 mt-0.5">
            {agent.department || 'Administration INPTIC'}
          </p>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Matricule professionnel</span>
            <span className="font-mono font-bold text-cyan-300">{agent.matricule}</span>
          </div>

          {agent.email && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">E-mail officiel</span>
              <span className="font-medium text-slate-200">{agent.email}</span>
            </div>
          )}

          {agent.phone && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Téléphone professionnel</span>
              <span className="font-medium text-slate-200">{agent.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 text-left text-xs text-slate-300 leading-relaxed">
          <p className="font-bold text-blue-300 flex items-center gap-1.5 mb-1">
            <Building2 size={14} />
            <span>Établissement émetteur</span>
          </p>
          <p className="text-[11px] text-slate-400">{agent.institution}</p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-3 text-xs font-bold text-white transition hover:bg-slate-700"
        >
          <span>Retour au site officiel</span>
          <ExternalLink size={13} />
        </Link>
      </div>
    </main>
  );
}
