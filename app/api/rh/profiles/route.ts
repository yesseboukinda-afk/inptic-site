import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import {
  isAdminRole,
  isDirectorRole,
  normalizeRole,
} from '@/lib/roles';
import {
  DEFAULT_PUBLIC_WHITELIST,
  RHProfile,
  RHStaffStatus,
  RHContractType,
  RHGender,
  RHQRStatus,
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

function generateSecureToken(): string {
  const rand = crypto.randomBytes(16).toString('hex');
  return `inptic_agent_${rand}`;
}

async function verifyRHAuthorization(request: NextRequest, requireWrite = false) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }

  const role = normalizeRole(user.role);

  const isDirecteur = isDirectorRole(role);
  const isAdmin = isAdminRole(role);
  const isRHAdmin = role === 'rh_admin' || role === 'rh' || role === 'drh';
  const isRHGestionnaire = role === 'rh_gestionnaire';
  const isRHConsultation = role === 'rh_consultation';

  const hasAccess = isDirecteur || isAdmin || isRHAdmin || isRHGestionnaire || isRHConsultation;

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
      id: user.id,
      email: user.email,
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
  ipAddress?: string,
  client?: PoolClient,
) {
  const db = client ?? getPostgresPool();
  await db.query(
    `INSERT INTO public.rh_audit_logs
       (user_id, user_email, action, target_id, target_name, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, userEmail, action, targetId ?? null, targetName ?? null, details ?? null, ipAddress ?? null],
  );
}

function mapRHProfile(d: any): RHProfile {
  const archivedValue = d.is_archived;
  const isArchived =
    archivedValue === true ||
    archivedValue === 1 ||
    (typeof archivedValue === 'string' && ['true', 't', '1'].includes(archivedValue.trim().toLowerCase()));

  return {
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
    isArchived,
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
  };
}

export async function GET(request: NextRequest) {
  const auth = await verifyRHAuthorization(request, false);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('archived') === '1';
  const department = searchParams.get('department');
  const query = searchParams.get('q');
  const getAuditLogs = searchParams.get('logs') === '1';
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }

  // Consultation du journal d'audit
  if (getAuditLogs) {
    try {
      const { rows } = await getPostgresPool().query(
        'SELECT * FROM public.rh_audit_logs ORDER BY timestamp DESC LIMIT 100',
      );
      return NextResponse.json({
        logs: rows.map((row) => ({
          id: String(row.id),
          timestamp: row.timestamp,
          userId: row.user_id,
          userEmail: row.user_email,
          action: row.action,
          targetId: row.target_id,
          targetName: row.target_name,
          details: row.details,
          ipAddress: row.ip_address,
        })),
      });
    } catch (error) {
      console.error('Erreur PostgreSQL de lecture du journal RH:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Journal RH indisponible.' }, { status: 503 });
    }
  }

  // Lecture des profils
  let profiles: RHProfile[] = [];

  try {
      const { rows } = await getPostgresPool().query(
        'SELECT * FROM public.rh_profiles ORDER BY created_at DESC',
      );
      profiles = rows.map(mapRHProfile);
  } catch (error) {
    console.error('Erreur PostgreSQL de lecture des profils RH:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Profils RH indisponibles.' }, { status: 503 });
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
  if (
    !body ||
    typeof body.firstName !== 'string' ||
    typeof body.lastName !== 'string' ||
    typeof body.matricule !== 'string' ||
    typeof body.department !== 'string' ||
    typeof body.position !== 'string' ||
    !body.firstName.trim() ||
    !body.lastName.trim() ||
    !body.matricule.trim() ||
    !body.department.trim() ||
    !body.position.trim()
  ) {
    return NextResponse.json(
      { error: 'Nom, prénom, matricule, direction et fonction sont obligatoires.' },
      { status: 400 }
    );
  }

  if (
    (body.birthDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)) ||
    (body.hireDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.hireDate))
  ) {
    return NextResponse.json({ error: 'Les dates de naissance et d’embauche doivent être valides.' }, { status: 400 });
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

  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO public.rh_profiles
         (matricule, first_name, last_name, gender, birth_date, birth_place, phone,
          email, photo_url, department, position, status, contract_type, hire_date,
          job_description, is_archived, qr_token, qr_status, qr_generated_at,
          public_whitelist, history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
               $15, FALSE, $16, 'actif', $17, $18, $19)
       RETURNING id`,
      [
        newProfile.matricule, newProfile.firstName, newProfile.lastName, newProfile.gender,
        newProfile.birthDate, newProfile.birthPlace, newProfile.phone, newProfile.email,
        newProfile.photoUrl, newProfile.department, newProfile.position, newProfile.status,
        newProfile.contractType, newProfile.hireDate, newProfile.jobDescription,
        newProfile.qrToken, now, JSON.stringify(newProfile.publicWhitelist),
        JSON.stringify(newProfile.history),
      ],
    );
    newProfile.id = String(rows[0].id);
    await logAuditAction(
      auth.user!.id,
      auth.user!.email,
      'CREATE_PROFILE',
      newProfile.id,
      `${newProfile.firstName} ${newProfile.lastName} (${newProfile.matricule})`,
      'Création du profil avec attribution du QR Code initial.',
      undefined,
      client,
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError) => {
      console.error('Erreur lors de l’annulation de la création RH:', rollbackError instanceof Error ? rollbackError.message : 'UNKNOWN_ERROR');
    });
    const databaseError = error && typeof error === 'object'
      ? error as { code?: string; constraint?: string; column?: string }
      : {};
    const requestId = crypto.randomUUID();
    console.error('[RH profile create] PostgreSQL error', {
      requestId,
      code: databaseError.code || 'UNKNOWN',
      constraint: databaseError.constraint || null,
      column: databaseError.column || null,
    });

    if (databaseError.code === '23505' && databaseError.constraint?.includes('matricule')) {
      return NextResponse.json({ error: 'Ce matricule est déjà attribué. Vérifiez le matricule puis réessayez.' }, { status: 409 });
    }
    if (databaseError.code === '23514') {
      return NextResponse.json({ error: 'Une valeur du profil est invalide. Vérifiez le sexe et le statut administratif.' }, { status: 400 });
    }
    if (databaseError.code === '22007' || databaseError.code === '22008') {
      return NextResponse.json({ error: 'Une date du profil est invalide. Vérifiez les dates saisies.' }, { status: 400 });
    }
    if (databaseError.code === '42P01' || databaseError.code === '42703') {
      return NextResponse.json({ error: 'Le schéma RH de la base n’est pas à jour. Contactez l’administrateur avec la référence ' + requestId + '.' }, { status: 503 });
    }

    return NextResponse.json({
      error: `Impossible de créer le profil RH. Référence : ${requestId}.`,
    }, { status: 503 });
  } finally {
    client.release();
  }

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

  let profile: RHProfile;
  try {
    const { rows } = await getPostgresPool().query(
      'SELECT * FROM public.rh_profiles WHERE id::text = $1 LIMIT 1',
      [profileId],
    );
    if (!rows[0]) return NextResponse.json({ error: 'Profil RH introuvable.' }, { status: 404 });
    profile = mapRHProfile(rows[0]);
  } catch (error) {
    console.error('Erreur PostgreSQL lors du chargement du profil RH:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger le profil RH.' }, { status: 503 });
  }

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

  const columns: Record<string, string> = {
    firstName: 'first_name',
    lastName: 'last_name',
    gender: 'gender',
    birthDate: 'birth_date',
    birthPlace: 'birth_place',
    phone: 'phone',
    email: 'email',
    photoUrl: 'photo_url',
    department: 'department',
    position: 'position',
    status: 'status',
    contractType: 'contract_type',
    hireDate: 'hire_date',
    jobDescription: 'job_description',
    isArchived: 'is_archived',
    archivedAt: 'archived_at',
    archiveReason: 'archive_reason',
    qrToken: 'qr_token',
    qrStatus: 'qr_status',
    qrGeneratedAt: 'qr_generated_at',
    qrRevokedAt: 'qr_revoked_at',
    publicWhitelist: 'public_whitelist',
  };
  const assignments = ['updated_at = NOW()'];
  const values: unknown[] = [];
  for (const [field, value] of Object.entries(updates)) {
    const column = columns[field];
    if (!column) continue;
    values.push(field === 'publicWhitelist' ? JSON.stringify(value) : value);
    assignments.push(`${column} = $${values.length}${field === 'publicWhitelist' ? '::jsonb' : ''}`);
  }
  values.push(JSON.stringify(historyEntry));
  assignments.push(`history = COALESCE(history, '[]'::jsonb) || $${values.length}::jsonb`);
  values.push(profileId);

  let updatedProfile: RHProfile;
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE public.rh_profiles
       SET ${assignments.join(', ')}
       WHERE id::text = $${values.length}
       RETURNING *`,
      values,
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Profil RH introuvable.' }, { status: 404 });
    }
    updatedProfile = mapRHProfile(rows[0]);
    await logAuditAction(
      auth.user!.id,
      auth.user!.email,
      actionType ? actionType.toUpperCase() : 'UPDATE_PROFILE',
      profileId,
      `${updatedProfile.firstName} ${updatedProfile.lastName}`,
      historyEntry.details,
      undefined,
      client,
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError) => {
      console.error('Erreur lors de l’annulation de la mise à jour RH:', rollbackError instanceof Error ? rollbackError.message : 'UNKNOWN_ERROR');
    });
    console.error('Erreur PostgreSQL lors de la mise à jour du profil RH:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de mettre à jour le profil RH.' }, { status: 503 });
  } finally {
    client.release();
  }

  return NextResponse.json({ data: updatedProfile });
}
