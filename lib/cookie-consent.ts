export const COOKIE_CONSENT_COOKIE = 'inptic_cookie_consent';
export const COOKIE_PREFERENCES_EVENT = 'inptic:open-cookie-preferences';

export type CookieConsent = {
  version: 1;
  analytics: boolean;
};

export function parseCookieConsent(cookieHeader: string): CookieConsent | null {
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_CONSENT_COOKIE}=`));
  if (!cookie) return null;

  try {
    const value: unknown = JSON.parse(decodeURIComponent(cookie.slice(COOKIE_CONSENT_COOKIE.length + 1)));
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 1 ||
      !('analytics' in value) ||
      typeof value.analytics !== 'boolean'
    ) {
      return null;
    }

    return {
      version: 1,
      analytics: value.analytics,
    };
  } catch {
    return null;
  }
}

export function getBrowserCookieConsent(): CookieConsent | null {
  return typeof document === 'undefined' ? null : parseCookieConsent(document.cookie);
}

export function saveBrowserCookieConsent(consent: CookieConsent): boolean {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(consent))}; Path=/; Max-Age=15552000; SameSite=Lax${secure}`;
  const saved = parseCookieConsent(document.cookie);
  return saved?.analytics === consent.analytics;
}
