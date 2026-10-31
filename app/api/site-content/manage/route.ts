import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeSuperAdminRequest } from '@/lib/staff-storage';
import { getPostgresPool } from '@/lib/postgres';

const opportunitiesSchema = z.array(z.string().trim().min(2).max(160)).min(1).max(20);
const trackSchema = z.object({
  name: z.string().trim().min(2).max(140),
  presentation: z.string().trim().min(10).max(3000),
  opportunities: opportunitiesSchema,
});
const trainingSchema = z.object({
  name: z.string().trim().min(2).max(180),
  category: z.enum(['diplomante', 'qualifiante']),
  trackId: z.string().uuid().nullable(),
  presentation: z.string().trim().min(10).max(3000),
  opportunities: z.array(z.string().trim().min(2).max(160)).max(20),
});
const websiteSchema = z.string().trim().max(500).refine(
  (value) => value === '' || /^https?:\/\/.+/i.test(value),
  'Le lien doit commencer par http:// ou https://.',
);
const certificationSchema = z.object({
  name: z.string().trim().min(2).max(180),
  presentation: z.string().trim().min(10).max(3000),
  issuer: z.string().trim().max(180),
  duration: z.string().trim().max(120),
  website: websiteSchema,
});
const uuidSchema = z.string().uuid();

async function siteAuditedPOST(request: NextRequest) {
  const auth = await authorizeSuperAdminRequest(request);
  if (auth.error) return auth.error;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'PostgreSQL indisponible.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (body?.resource === 'filiere') {
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Filière invalide.' }, { status: 400 });
    try {
      const { rows } = await getPostgresPool().query(
        `INSERT INTO public.site_tracks (name, presentation, opportunities, updated_by)
         VALUES ($1, $2, $3::jsonb, $4)
         RETURNING id, name, presentation, opportunities`,
        [parsed.data.name, parsed.data.presentation, JSON.stringify(parsed.data.opportunities), auth.user.id],
      );
      return NextResponse.json({ data: rows[0] }, { status: 201 });
    } catch (error) {
      if (isUniqueViolation(error)) return NextResponse.json({ error: 'Une filière portant ce nom existe déjà.' }, { status: 409 });
      console.error('Erreur PostgreSQL lors de la création de la filière:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Création de la filière impossible.' }, { status: 503 });
    }
  }

  if (body?.resource === 'certification') {
    const parsed = certificationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Certification invalide.' }, { status: 400 });
    try {
      const { rows } = await getPostgresPool().query(
        `INSERT INTO public.site_certifications
           (name, presentation, issuer, duration, website, updated_by)
         VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), $6)
         RETURNING id, name, presentation, issuer, duration, website`,
        [
          parsed.data.name,
          parsed.data.presentation,
          parsed.data.issuer,
          parsed.data.duration,
          parsed.data.website,
          auth.user.id,
        ],
      );
      return NextResponse.json({ data: rows[0] }, { status: 201 });
    } catch (error) {
      if (isUniqueViolation(error)) return NextResponse.json({ error: 'Une certification portant ce nom existe déjà.' }, { status: 409 });
      console.error('Erreur PostgreSQL lors de la création de la certification:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Création de la certification impossible.' }, { status: 503 });
    }
  }

  if (body?.resource === 'formation') {
    const parsed = trainingSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Formation invalide.' }, { status: 400 });
    if (parsed.data.category === 'diplomante' && !parsed.data.trackId) {
      return NextResponse.json({ error: 'Une formation diplômante doit être rattachée à une filière.' }, { status: 400 });
    }
    try {
      const { rows } = await getPostgresPool().query(
        `INSERT INTO public.site_trainings
           (name, category, track_id, presentation, opportunities, is_published, updated_by)
         VALUES ($1, $2, $3, $4, $5::jsonb, TRUE, $6)
         RETURNING id, name, category, track_id, presentation, opportunities`,
        [
          parsed.data.name,
          parsed.data.category,
          parsed.data.trackId,
          parsed.data.presentation,
          JSON.stringify(parsed.data.opportunities),
          auth.user.id,
        ],
      );
      return NextResponse.json({ data: rows[0] }, { status: 201 });
    } catch (error) {
      if (isUniqueViolation(error)) return NextResponse.json({ error: 'Une formation portant ce nom existe déjà.' }, { status: 409 });
      if (isForeignKeyViolation(error)) return NextResponse.json({ error: 'La filière sélectionnée n’existe plus.' }, { status: 400 });
      console.error('Erreur PostgreSQL lors de la création de la formation:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Création de la formation impossible.' }, { status: 503 });
    }
  }

  return NextResponse.json({ error: 'Type de contenu invalide.' }, { status: 400 });
}

async function siteAuditedPATCH(request: NextRequest) {
  const auth = await authorizeSuperAdminRequest(request);
  if (auth.error) return auth.error;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'PostgreSQL indisponible.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: 'Identifiant de contenu invalide.' }, { status: 400 });

  if (body?.resource === 'filiere') {
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Filière invalide.' }, { status: 400 });
    try {
      const { rows } = await getPostgresPool().query(
        `UPDATE public.site_tracks
         SET name = $1, presentation = $2, opportunities = $3::jsonb, updated_by = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, name, presentation, opportunities`,
        [parsed.data.name, parsed.data.presentation, JSON.stringify(parsed.data.opportunities), auth.user.id, id],
      );
      if (!rows[0]) return NextResponse.json({ error: 'Filière introuvable.' }, { status: 404 });
      return NextResponse.json({ data: rows[0] });
    } catch (error) {
      if (isUniqueViolation(error)) return NextResponse.json({ error: 'Une filière portant ce nom existe déjà.' }, { status: 409 });
      console.error('Erreur PostgreSQL lors de la modification de la filière:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Modification de la filière impossible.' }, { status: 503 });
    }
  }

  if (body?.resource === 'certification') {
    const parsed = certificationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Certification invalide.' }, { status: 400 });
    try {
      const { rows } = await getPostgresPool().query(
        `UPDATE public.site_certifications
         SET name = $1, presentation = $2, issuer = NULLIF($3, ''),
             duration = NULLIF($4, ''), website = NULLIF($5, ''),
             updated_by = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING id, name, presentation, issuer, duration, website`,
        [
          parsed.data.name,
          parsed.data.presentation,
          parsed.data.issuer,
          parsed.data.duration,
          parsed.data.website,
          auth.user.id,
          id,
        ],
      );
      if (!rows[0]) return NextResponse.json({ error: 'Certification introuvable.' }, { status: 404 });
      return NextResponse.json({ data: rows[0] });
    } catch (error) {
      if (isUniqueViolation(error)) return NextResponse.json({ error: 'Une certification portant ce nom existe déjà.' }, { status: 409 });
      console.error('Erreur PostgreSQL lors de la modification de la certification:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Modification de la certification impossible.' }, { status: 503 });
    }
  }

  if (body?.resource === 'formation') {
    const parsed = trainingSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Formation invalide.' }, { status: 400 });
    if (parsed.data.category === 'diplomante' && !parsed.data.trackId) {
      return NextResponse.json({ error: 'Une formation diplômante doit être rattachée à une filière.' }, { status: 400 });
    }
    try {
      const { rows } = await getPostgresPool().query(
        `UPDATE public.site_trainings
         SET name = $1, category = $2, track_id = $3, presentation = $4,
             opportunities = $5::jsonb, updated_by = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING id, name, category, track_id, presentation, opportunities`,
        [
          parsed.data.name,
          parsed.data.category,
          parsed.data.trackId,
          parsed.data.presentation,
          JSON.stringify(parsed.data.opportunities),
          auth.user.id,
          id,
        ],
      );
      if (!rows[0]) return NextResponse.json({ error: 'Formation introuvable.' }, { status: 404 });
      return NextResponse.json({ data: rows[0] });
    } catch (error) {
      if (isUniqueViolation(error)) return NextResponse.json({ error: 'Une formation portant ce nom existe déjà.' }, { status: 409 });
      if (isForeignKeyViolation(error)) return NextResponse.json({ error: 'La filière sélectionnée n’existe plus.' }, { status: 400 });
      console.error('Erreur PostgreSQL lors de la modification de la formation:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Modification de la formation impossible.' }, { status: 503 });
    }
  }

  return NextResponse.json({ error: 'Type de contenu invalide.' }, { status: 400 });
}

async function siteAuditedDELETE(request: NextRequest) {
  const auth = await authorizeSuperAdminRequest(request);
  if (auth.error) return auth.error;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'PostgreSQL indisponible.' }, { status: 503 });

  const resource = request.nextUrl.searchParams.get('resource');
  const id = request.nextUrl.searchParams.get('id') ?? '';
  if (!uuidSchema.safeParse(id).success || !['filiere', 'certification', 'formation'].includes(resource ?? '')) {
    return NextResponse.json({ error: 'Type de contenu ou identifiant invalide.' }, { status: 400 });
  }

  try {
    const table = resource === 'filiere'
      ? 'site_tracks'
      : resource === 'certification'
        ? 'site_certifications'
        : 'site_trainings';
    const { rowCount } = await getPostgresPool().query(`DELETE FROM public.${table} WHERE id = $1`, [id]);
    if (!rowCount) return NextResponse.json({ error: 'Contenu introuvable.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isForeignKeyViolation(error) && resource === 'filiere') {
      return NextResponse.json({ error: 'Cette filière contient des formations. Supprimez ou réaffectez-les avant de la supprimer.' }, { status: 409 });
    }
    console.error('Erreur PostgreSQL lors de la suppression d’un contenu:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Suppression impossible.' }, { status: 503 });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23503';
}

export const POST = withSiteAudit('Création de contenu du site', siteAuditedPOST);
export const PATCH = withSiteAudit('Modification de contenu du site', siteAuditedPATCH);
export const DELETE = withSiteAudit('Suppression de contenu du site', siteAuditedDELETE);
