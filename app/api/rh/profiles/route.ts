import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import {
  isAdminAccountEmail,
  isAdminRole,
  isDirectorAccountEmail,
  isDirectorRole,
  isRHAccountEmail,
  normalizeRole,
} from '@/lib/roles';
import {
  DEFAULT_PUBLIC_WHITELIST,
  RHProfile,
  RHStaffStatus,
  RHContractType,
  RHGender,
  RHQRStatus,
  RHAuditLog,
} from '@/types/rh';

// Graine de profils du personnel INPTIC Gabon issue de l'organigramme officiel
const SEED_PROFILES: RHProfile[] = [
  {
    id: 'prof-001',
    matricule: 'INPTIC-2018-001',
    firstName: 'Arsène',
    lastName: 'BEKALE',
    gender: 'M',
    birthDate: '1974-05-12',
    birthPlace: 'Libreville',
    phone: '+241 77 12 34 56',
    email: 'arsene.bekale@inptic.ga',
    photoUrl: '/banniere/DG.webp',
    department: 'Direction Générale (DG)',
    position: 'Directeur Général',
    status: 'titulaire',
    contractType: 'Fonction Publique',
    hireDate: '2018-09-01',
    seniorityYears: 8,
    jobDescription: 'Direction stratégique, représentation légale et gouvernance générale de l’Institut National de la Poste, des Technologies de l’Information et de la Communication.',
    isArchived: false,
    qrToken: 'inptic_agent_7f8a9b2c3d4e5f60718293a4b5c6d7e8',
    qrStatus: 'actif',
    qrGeneratedAt: '2026-01-10T08:00:00Z',
    publicWhitelist: { ...DEFAULT_PUBLIC_WHITELIST, email: true },
    history: [
      {
        id: 'hist-001',
        changedAt: '2026-01-10T08:00:00Z',
        changedBy: 'Système RH',
        action: 'Création du profil',
        details: 'Initialisation du profil Directeur Général et émission du QR Code dynamique.',
      },
    ],
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'prof-002',
    matricule: 'INPTIC-2019-014',
    firstName: 'Pauline',
    lastName: 'NDONG MVE',
    gender: 'F',
    birthDate: '1981-11-23',
    birthPlace: 'Oyem',
    phone: '+241 66 98 76 54',
    email: 'pauline.ndong@inptic.ga',
    photoUrl: '/banniere/DGA.webp',
    department: 'Direction Générale Adjointe (DGA)',
    position: 'Directrice Générale Adjointe',
    status: 'titulaire',
    contractType: 'Fonction Publique',
    hireDate: '2019-03-15',
    seniorityYears: 7,
    jobDescription: 'Supervision de la coordination opérationnelle des départements académiques et appui au pilotage institutionnel.',
    isArchived: false,
    qrToken: 'inptic_agent_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    qrStatus: 'actif',
    qrGeneratedAt: '2026-01-12T09:30:00Z',
    publicWhitelist: { ...DEFAULT_PUBLIC_WHITELIST, email: true },
    history: [
      {
        id: 'hist-002',
        changedAt: '2026-01-12T09:30:00Z',
        changedBy: 'Système RH',
        action: 'Création du profil',
        details: 'Profil DGA créé et badge dynamique émis.',
      },
    ],
    createdAt: '2026-01-12T09:30:00Z',
    updatedAt: '2026-01-12T09:30:00Z',
  },
  {
    id: 'prof-003',
    matricule: 'INPTIC-2021-032',
    firstName: 'Marc',
    lastName: 'ESSONO OBIANG',
    gender: 'M',
    birthDate: '1985-08-19',
    birthPlace: 'Port-Gentil',
    phone: '+241 74 55 44 33',
    email: 'marc.essono@inptic.ga',
    photoUrl: '',
    department: 'Direction des Ressources Techniques et de l’Innovation (DRTI)',
    position: 'Directeur des Ressources Techniques et de l’Innovation',
    status: 'titulaire',
    contractType: 'Fonction Publique',
    hireDate: '2021-02-01',
    seniorityYears: 5,
    jobDescription: 'Pilotage des infrastructures SI, de l’innovation technologique, de la cybersécurité et de la transformation numérique de l’INPTIC.',
    isArchived: false,
    qrToken: 'inptic_agent_9f8e7d6c5b4a39281706f5e4d3c2b1a0',
    qrStatus: 'actif',
    qrGeneratedAt: '2026-01-15T11:00:00Z',
    publicWhitelist: { ...DEFAULT_PUBLIC_WHITELIST, phone: false, email: true },
    history: [
      {
        id: 'hist-003',
        changedAt: '2026-01-15T11:00:00Z',
        changedBy: 'Système RH',
        action: 'Création du profil',
        details: 'Enregistrement DRTI & émission badge professionnel.',
      },
    ],
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'prof-004',
    matricule: 'INPTIC-2022-058',
    firstName: 'Christelle',
    lastName: 'MBOUMBA',
    gender: 'F',
    birthDate: '1990-03-14',
    birthPlace: 'Mouila',
    phone: '+241 62 11 22 33',
    email: 'christelle.mboumba@inptic.ga',
    photoUrl: '',
    department: 'Service Informatique et SI (SRSIAT)',
    position: 'Responsable Systèmes, Réseaux et Sécurité',
    status: 'contractuel',
    contractType: 'CDI',
    hireDate: '2022-07-01',
    seniorityYears: 4,
    jobDescription: 'Administration système Linux/Cloud, gestion des serveurs, supervision réseau et contrôle d’accès aux plateformes institutionnelles.',
    isArchived: false,
    qrToken: 'inptic_agent_a1b2c3d4e5f67890abcdef1234567890',
    qrStatus: 'actif',
    qrGeneratedAt: '2026-02-01T10:00:00Z',
    publicWhitelist: { ...DEFAULT_PUBLIC_WHITELIST },
    history: [
      {
        id: 'hist-004',
        changedAt: '2026-02-01T10:00:00Z',
        changedBy: 'Système RH',
        action: 'Création du profil',
        details: 'Initialisation du profil ingénieur SRSIAT.',
      },
    ],
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'prof-005',
    matricule: 'INPTIC-2023-089',
    firstName: 'Franck',
    lastName: 'KOUMBA',
    gender: 'M',
    birthDate: '1993-09-28',
    birthPlace: 'Tchibanga',
    phone: '+241 77 99 88 77',
    email: 'franck.koumba@inptic.ga',
    photoUrl: '',
    department: 'Service Scolarité',
    position: 'Gestionnaire des Admissions et Dossiers Étudiants',
    status: 'contractuel',
    contractType: 'CDI',
    hireDate: '2023-01-15',
    seniorityYears: 3,
    jobDescription: 'Gestion des inscriptions administratives, suivi des candidatures et délivrance des attestations et relevés de notes.',
    isArchived: false,
    qrToken: 'inptic_agent_fedcba0987654321fedcba0987654321',
    qrStatus: 'actif',
    qrGeneratedAt: '2026-02-05T14:20:00Z',
    publicWhitelist: { ...DEFAULT_PUBLIC_WHITELIST },
    history: [
      {
        id: 'hist-005',
        changedAt: '2026-02-05T14:20:00Z',
        changedBy: 'Système RH',
        action: 'Création du profil',
        details: 'Enregistrement de l’agent de scolarité.',
      },
    ],
    createdAt: '2026-02-05T14:20:00Z',
    updatedAt: '2026-02-05T14:20:00Z',
  },
];

// In-Memory store pour continuité sans Supabase
let inMemoryProfiles = [...SEED_PROFILES];
let inMemoryAuditLogs: RHAuditLog[] = [];

function generateSecureToken(): string {
  const rand = crypto.randomBytes(16).toString('hex');
  return `inptic_agent_${rand}`;
}

async function verifyRHAuthorization(request: NextRequest, requireWrite = false) {
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }

  if (!supabaseAdmin || accessToken === 'local-admin-token') {
    // Mode local dev ou fallback staff storage si Supabase absent / token local
    return {
      user: {
        id: 'dev-rh-user',
        email: 'rh-admin@inptic.ga',
        role: 'rh_admin',
      },
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: 'Session expirée ou invalide.' }, { status: 401 }) };
  }

  const rawRole =
    data.user.app_metadata?.role ??
    data.user.app_metadata?.roles ??
    data.user.user_metadata?.role ??
    data.user.user_metadata?.roles;
  const role = normalizeRole(rawRole);
  const email = data.user.email || '';

  const isDirecteur = isDirectorRole(role) || isDirectorAccountEmail(email);
  const isAdmin = isAdminRole(role) || isAdminAccountEmail(email) || isRHAccountEmail(email);
  const isRHAdmin = role === 'rh_admin' || role === 'rh' || role === 'drh' || isRHAccountEmail(email);
  const isRHGestionnaire = role === 'rh_gestionnaire';
  const isRHConsultation = role === 'rh_consultation';

  const hasAccess = isDirecteur || isAdmin || isRHAdmin || isRHGestionnaire || isRHConsultation || isRHAccountEmail(email);

  if (!hasAccess) {
    return {
      error: NextResponse.json(
        { error: 'Accès refusé. Cette section est réservée à la DRH et aux gestionnaires habilités DRTI.' },
        { status: 403 }
      ),
    };
  }

  if (requireWrite && isRHConsultation && !isAdmin && !isDirecteur && !isRHAdmin && !isRHGestionnaire) {
    return {
      error: NextResponse.json(
        { error: 'Action non autorisée. Votre rôle est limité à la consultation des profils.' },
        { status: 403 }
      ),
    };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email || 'rh@inptic.ga',
      role: isDirecteur || isAdmin || isRHAdmin ? 'rh_admin' : isRHGestionnaire ? 'rh_gestionnaire' : 'rh_consultation',
    },
  };
}

async function logAuditAction(
  userId: string,
  userEmail: string,
  action: string,
  targetId?: string,
  targetName?: string,
  details?: string,
  ipAddress?: string
) {
  const log: RHAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    action,
    targetId,
    targetName,
    details,
    ipAddress,
  };

  inMemoryAuditLogs.unshift(log);

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('rh_audit_logs').insert([
        {
          user_id: userId,
          user_email: userEmail,
          action,
          target_id: targetId,
          target_name: targetName,
          details,
          ip_address: ipAddress,
        },
      ]);
    } catch {
      // ignore
    }
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyRHAuthorization(request, false);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('archived') === '1';
  const department = searchParams.get('department');
  const query = searchParams.get('q');
  const getAuditLogs = searchParams.get('logs') === '1';

  // Consultation du journal d'audit
  if (getAuditLogs) {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('rh_audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(data) && data.length > 0) {
          return NextResponse.json({
            logs: data.map((d) => ({
              id: String(d.id),
              timestamp: d.timestamp,
              userId: d.user_id,
              userEmail: d.user_email,
              action: d.action,
              targetId: d.target_id,
              targetName: d.target_name,
              details: d.details,
              ipAddress: d.ip_address,
            })),
          });
        }
      } catch {
        // fallback in memory
      }
    }
    return NextResponse.json({ logs: inMemoryAuditLogs });
  }

  // Lecture des profils
  let profiles: RHProfile[] = [];

  if (supabaseAdmin) {
    try {
      const q = supabaseAdmin.from('rh_profiles').select('*').order('created_at', { ascending: false });
      const { data, error } = await q;
      if (!error && Array.isArray(data) && data.length > 0) {
        profiles = data.map((d: any) => ({
          id: String(d.id),
          matricule: d.matricule,
          firstName: d.first_name,
          lastName: d.last_name,
          gender: d.gender,
          birthDate: d.birth_date,
          birthPlace: d.birth_place || '',
          phone: d.phone || '',
          email: d.email || '',
          photoUrl: d.photo_url || '',
          department: d.department,
          position: d.position,
          status: d.status,
          contractType: d.contract_type,
          hireDate: d.hire_date,
          seniorityYears: Math.floor(
            (Date.now() - new Date(d.hire_date).getTime()) / (365.25 * 24 * 3600 * 1000)
          ),
          jobDescription: d.job_description || '',
          isArchived: Boolean(d.is_archived),
          archivedAt: d.archived_at,
          archiveReason: d.archive_reason,
          qrToken: d.qr_token,
          qrStatus: d.qr_status,
          qrGeneratedAt: d.qr_generated_at,
          qrRevokedAt: d.qr_revoked_at,
          publicWhitelist: d.public_whitelist || DEFAULT_PUBLIC_WHITELIST,
          history: Array.isArray(d.history) ? d.history : [],
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch {
      // Table fallback
    }
  }

  if (profiles.length === 0) {
    profiles = inMemoryProfiles;
  }

  // Filtrage
  if (!includeArchived) {
    profiles = profiles.filter((p) => !p.isArchived);
  }

  if (department && department !== 'all') {
    profiles = profiles.filter((p) => p.department.toLowerCase() === department.toLowerCase());
  }

  if (query && query.trim()) {
    const q = query.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.matricule.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ data: profiles, count: profiles.length });
}

export async function POST(request: NextRequest) {
  const auth = await verifyRHAuthorization(request, true);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body || !body.firstName || !body.lastName || !body.matricule || !body.department || !body.position) {
    return NextResponse.json(
      { error: 'Nom, prénom, matricule, direction et fonction sont obligatoires.' },
      { status: 400 }
    );
  }

  const qrToken = generateSecureToken();
  const now = new Date().toISOString();

  const newProfile: RHProfile = {
    id: `prof-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    matricule: body.matricule.trim().toUpperCase(),
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim().toUpperCase(),
    gender: body.gender === 'F' ? 'F' : 'M',
    birthDate: body.birthDate || '1995-01-01',
    birthPlace: body.birthPlace || '',
    phone: body.phone || '',
    email: body.email || '',
    photoUrl: body.photoUrl || '',
    department: body.department,
    position: body.position,
    status: body.status || 'contractuel',
    contractType: body.contractType || 'CDI',
    hireDate: body.hireDate || now.slice(0, 10),
    jobDescription: body.jobDescription || '',
    isArchived: false,
    qrToken,
    qrStatus: 'actif',
    qrGeneratedAt: now,
    publicWhitelist: body.publicWhitelist || DEFAULT_PUBLIC_WHITELIST,
    history: [
      {
        id: `hist-${Date.now()}`,
        changedAt: now,
        changedBy: auth.user!.email,
        action: 'Création du profil',
        details: `Profil créé par ${auth.user!.email} avec QR token initial.`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('rh_profiles')
        .insert([
          {
            matricule: newProfile.matricule,
            first_name: newProfile.firstName,
            last_name: newProfile.lastName,
            gender: newProfile.gender,
            birth_date: newProfile.birthDate,
            birth_place: newProfile.birthPlace,
            phone: newProfile.phone,
            email: newProfile.email,
            photo_url: newProfile.photoUrl,
            department: newProfile.department,
            position: newProfile.position,
            status: newProfile.status,
            contract_type: newProfile.contractType,
            hire_date: newProfile.hireDate,
            job_description: newProfile.jobDescription,
            is_archived: false,
            qr_token: newProfile.qrToken,
            qr_status: 'actif',
            qr_generated_at: now,
            public_whitelist: newProfile.publicWhitelist,
            history: newProfile.history,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        newProfile.id = String(data.id);
      }
    } catch {
      // fallback
    }
  }

  inMemoryProfiles.unshift(newProfile);

  await logAuditAction(
    auth.user!.id,
    auth.user!.email,
    'CREATE_PROFILE',
    newProfile.id,
    `${newProfile.firstName} ${newProfile.lastName} (${newProfile.matricule})`,
    `Création du profil avec attribution du QR Code initial.`
  );

  return NextResponse.json({ data: newProfile }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyRHAuthorization(request, true);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Identifiant du profil requis.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const profileId = String(body.id);

  // Recherche profil
  let profile = inMemoryProfiles.find((p) => p.id === profileId);

  // Gestion des actions spéciales : REGENERATE_QR, REVOKE_QR, ARCHIVE, RESTORE
  const actionType = body.actionType; // 'regenerate_qr' | 'revoke_qr' | 'archive' | 'restore' | 'update'

  let historyEntry = {
    id: `hist-${Date.now()}`,
    changedAt: now,
    changedBy: auth.user!.email,
    action: 'Modification du profil',
    details: 'Mise à jour des informations administratives/personnelles.',
  };

  const updates: Record<string, any> = {
    updatedAt: now,
  };

  if (actionType === 'regenerate_qr') {
    const newToken = generateSecureToken();
    updates.qrToken = newToken;
    updates.qrStatus = 'actif';
    updates.qrGeneratedAt = now;
    updates.qrRevokedAt = null;
    historyEntry = {
      id: `hist-${Date.now()}`,
      changedAt: now,
      changedBy: auth.user!.email,
      action: 'Régénération du QR Code',
      details: 'Un nouveau token dynamique a été généré. L’ancien QR Code est désormais révoqué.',
    };
  } else if (actionType === 'revoke_qr') {
    updates.qrStatus = 'revoque';
    updates.qrRevokedAt = now;
    historyEntry = {
      id: `hist-${Date.now()}`,
      changedAt: now,
      changedBy: auth.user!.email,
      action: 'Révocation du QR Code',
      details: 'Le QR Code a été désactivé manuellement par mesure de sécurité.',
    };
  } else if (actionType === 'archive') {
    updates.isArchived = true;
    updates.archivedAt = now;
    updates.archiveReason = body.archiveReason || 'Départ ou fin de contrat';
    updates.qrStatus = 'inactif';
    historyEntry = {
      id: `hist-${Date.now()}`,
      changedAt: now,
      changedBy: auth.user!.email,
      action: 'Archivage du profil (Soft delete)',
      details: `Motif d’archivage : ${updates.archiveReason}`,
    };
  } else if (actionType === 'restore') {
    updates.isArchived = false;
    updates.archivedAt = null;
    updates.archiveReason = null;
    updates.qrStatus = 'actif';
    historyEntry = {
      id: `hist-${Date.now()}`,
      changedAt: now,
      changedBy: auth.user!.email,
      action: 'Restauration du profil',
      details: 'Profil réactivé.',
    };
  } else {
    // Modification standard
    if (body.firstName) updates.firstName = body.firstName.trim();
    if (body.lastName) updates.lastName = body.lastName.trim().toUpperCase();
    if (body.gender) updates.gender = body.gender;
    if (body.birthDate) updates.birthDate = body.birthDate;
    if (body.birthPlace !== undefined) updates.birthPlace = body.birthPlace;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email;
    if (body.photoUrl !== undefined) updates.photoUrl = body.photoUrl;
    if (body.department) updates.department = body.department;
    if (body.position) updates.position = body.position;
    if (body.status) updates.status = body.status;
    if (body.contractType) updates.contractType = body.contractType;
    if (body.hireDate) updates.hireDate = body.hireDate;
    if (body.jobDescription !== undefined) updates.jobDescription = body.jobDescription;
    if (body.publicWhitelist) updates.publicWhitelist = body.publicWhitelist;
  }

  // Supabase update
  if (supabaseAdmin) {
    try {
      const dbUpdates: Record<string, any> = {
        updated_at: now,
      };
      if (updates.firstName) dbUpdates.first_name = updates.firstName;
      if (updates.lastName) dbUpdates.last_name = updates.lastName;
      if (updates.gender) dbUpdates.gender = updates.gender;
      if (updates.birthDate) dbUpdates.birth_date = updates.birthDate;
      if (updates.birthPlace !== undefined) dbUpdates.birth_place = updates.birthPlace;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.position) dbUpdates.position = updates.position;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.contractType) dbUpdates.contract_type = updates.contractType;
      if (updates.hireDate) dbUpdates.hire_date = updates.hireDate;
      if (updates.jobDescription !== undefined) dbUpdates.job_description = updates.jobDescription;
      if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
      if (updates.archivedAt !== undefined) dbUpdates.archived_at = updates.archivedAt;
      if (updates.archiveReason !== undefined) dbUpdates.archive_reason = updates.archiveReason;
      if (updates.qrToken) dbUpdates.qr_token = updates.qrToken;
      if (updates.qrStatus) dbUpdates.qr_status = updates.qrStatus;
      if (updates.qrGeneratedAt) dbUpdates.qr_generated_at = updates.qrGeneratedAt;
      if (updates.qrRevokedAt !== undefined) dbUpdates.qr_revoked_at = updates.qrRevokedAt;
      if (updates.publicWhitelist) dbUpdates.public_whitelist = updates.publicWhitelist;

      await supabaseAdmin.from('rh_profiles').update(dbUpdates).eq('id', profileId);
    } catch {
      // fallback
    }
  }

  if (profile) {
    Object.assign(profile, updates);
    profile.history.unshift(historyEntry);
  }

  await logAuditAction(
    auth.user!.id,
    auth.user!.email,
    actionType ? actionType.toUpperCase() : 'UPDATE_PROFILE',
    profileId,
    profile ? `${profile.firstName} ${profile.lastName}` : profileId,
    historyEntry.details
  );

  return NextResponse.json({ data: profile || updates });
}
