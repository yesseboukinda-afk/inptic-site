import 'server-only';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getPostgresPool } from '@/lib/postgres';

const scrypt = promisify(scryptCallback);
export const AUTH_COOKIE_NAME = 'inptic_session';
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  user_metadata: Record<string, unknown>;
};

type AuthUserRow = {
  id: string;
  email: string;
  role: string;
  user_metadata: Record<string, unknown>;
};

function mapUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    user_metadata: row.user_metadata ?? {},
  };
}

export function serializeAuthUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: { role: user.role },
  };
}

export function hashOpaqueToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getAuthSiteUrl(request: NextRequest) {
  const configuredUrl = process.env.AUTH_SITE_URL;
  if (configuredUrl) {
    const url = new URL(configuredUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('AUTH_SITE_URL doit utiliser HTTP ou HTTPS.');
    }
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      throw new Error('AUTH_SITE_URL doit utiliser HTTPS en production.');
    }
    return url.origin;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SITE_URL doit être configuré en production.');
  }
  return request.nextUrl.origin;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [algorithm, saltHex, keyHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex || !/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(keyHex)) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(keyHex, 'hex');
  if (expected.length !== 64) return false;
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return timingSafeEqual(actual, expected);
}

export async function createAuthSession(userId: string, response: NextResponse) {
  const token = randomBytes(32).toString('hex');
  await getPostgresPool().query(
    `INSERT INTO public.app_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 second'))`,
    [hashOpaqueToken(token), userId, AUTH_SESSION_TTL_SECONDS],
  );

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_SESSION_TTL_SECONDS,
  });
}

export async function revokeAuthSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return;
  await getPostgresPool().query(
    `UPDATE public.app_sessions SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashOpaqueToken(token)],
  );
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return getAuthenticatedUserFromToken(token);
}

export async function getAuthenticatedUserFromToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;

  const result = await getPostgresPool().query<AuthUserRow>(
    `SELECT u.id, u.email, u.role, u.user_metadata
     FROM public.app_sessions s
     JOIN public.app_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()
     LIMIT 1`,
    [hashOpaqueToken(token)],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function findAuthUserById(client: PoolClient, id: string) {
  const result = await client.query<AuthUserRow>(
    'SELECT id, email, role, user_metadata FROM public.app_users WHERE id = $1',
    [id],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_SESSION_TTL_SECONDS,
  });
}

export async function createAuthSessionToken(userId: string) {
  const token = randomBytes(32).toString('hex');
  await getPostgresPool().query(
    `INSERT INTO public.app_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 second'))`,
    [hashOpaqueToken(token), userId, AUTH_SESSION_TTL_SECONDS],
  );
  return token;
}
