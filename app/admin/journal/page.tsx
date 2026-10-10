import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuditLogClient from './AuditLogClient';
import { AUTH_COOKIE_NAME, getAuthenticatedUserFromToken } from '@/lib/postgres-auth';
import { isSuperAdminRole } from '@/lib/roles';

export default async function AdminAuditPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = await getAuthenticatedUserFromToken(token);
  if (!user || !isSuperAdminRole(user.role)) redirect('/candidat');

  return <AuditLogClient />;
}
