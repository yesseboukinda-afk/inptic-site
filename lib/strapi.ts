import 'server-only';

const base = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337/api';
export async function strapi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } : {}),
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}`);
  return res.json();
}

