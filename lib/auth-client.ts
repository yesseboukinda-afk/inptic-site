'use client';

type AuthEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'PASSWORD_RECOVERY';
type AuthUser = {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
};
type Session = {
  access_token: 'cookie-session';
  token_type: 'bearer';
  expires_at: number;
  user: AuthUser;
};
type AuthResult<T> = { data: T; error: Error | null };

const listeners = new Set<(event: AuthEvent, session: Session | null) => void>();

async function request<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || `Erreur d’authentification (${response.status}).`);
  return payload;
}

function notify(event: AuthEvent, session: Session | null) {
  for (const listener of listeners) listener(event, session);
}

export const authClient = {
  auth: {
    async getSession(): Promise<AuthResult<{ session: Session | null }>> {
      try {
        const result = await request<{ session: Session | null }>('/api/auth/session', 'GET');
        return { data: { session: result.session }, error: null };
      } catch (error) {
        return { data: { session: null }, error: error instanceof Error ? error : new Error('Session indisponible.') };
      }
    },

    onAuthStateChange(callback: (event: AuthEvent, session: Session | null) => void) {
      listeners.add(callback);
      let active = true;
      void authClient.auth.getSession().then(({ data }) => {
        if (active) callback('INITIAL_SESSION', data.session);
      });
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              active = false;
              listeners.delete(callback);
            },
          },
        },
      };
    },

    async signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResult<{ user: AuthUser | null; session: Session | null }>> {
      try {
        const result = await request<{ user: AuthUser; session: Session }>('/api/auth/login', 'POST', credentials);
        result.session.user = result.user;
        notify('SIGNED_IN', result.session);
        return { data: result, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error: error instanceof Error ? error : new Error('Connexion impossible.') };
      }
    },

    async signUp(input: { email: string; password: string; options?: { data?: Record<string, unknown> } }): Promise<AuthResult<{ user: AuthUser | null; session: Session | null }>> {
      try {
        const result = await request<{ user: AuthUser; session: Session | null }>('/api/auth/signup', 'POST', {
          email: input.email,
          password: input.password,
          name: input.options?.data?.name || input.options?.data?.full_name || '',
        });
        if (result.session) notify('SIGNED_IN', result.session);
        return { data: result, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error: error instanceof Error ? error : new Error('Inscription impossible.') };
      }
    },

    async resetPasswordForEmail(email: string, _options?: { redirectTo?: string }): Promise<{ error: Error | null }> {
      try {
        await request('/api/auth/password/forgot', 'POST', { email });
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error('Envoi du lien impossible.') };
      }
    },

    async signInWithOAuth(input: { provider: 'google'; options?: { redirectTo?: string } }): Promise<{ error: Error | null }> {
      window.location.assign(`/api/auth/oauth?provider=${encodeURIComponent(input.provider)}`);
      return { error: null };
    },

    async signOut(): Promise<{ error: Error | null }> {
      try {
        await request('/api/auth/logout', 'POST');
        notify('SIGNED_OUT', null);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error('Déconnexion impossible.') };
      }
    },
  },
};
