import { getPostgresPool } from '@/lib/postgres';

type RHCardScanProfile = {
  id: string | number;
  first_name: string;
  last_name: string;
  qr_status: string;
  is_archived: boolean;
};

export async function logRHCardScan(
  profile: RHCardScanProfile,
  requestHeaders: Pick<Headers, 'get'>,
) {
  const forwardedIp = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ipAddress = (
    requestHeaders.get('x-real-ip')?.trim() ||
    forwardedIp ||
    ''
  ).slice(0, 255);
  const cardStatus = profile.qr_status === 'actif' && !profile.is_archived ? 'valide' : 'invalide';
  const targetName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');

  await getPostgresPool().query(
    `INSERT INTO public.rh_audit_logs
       (user_id, user_email, action, target_id, target_name, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      'public-qr-scan',
      'Visiteur public',
      'SCAN_CARD',
      String(profile.id),
      targetName,
      `Scan du QR Code : carte ${cardStatus}.`,
      ipAddress || null,
    ],
  );
}
