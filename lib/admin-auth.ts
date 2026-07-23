export const ADMIN_USERNAME = 'a63k';
export const ADMIN_PASSWORD = '@Adam2009@';
const SESSION_KEY = 'zora_admin_auth_session';

export function authenticateAdmin(user: string, pass: string): boolean {
  if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
    if (typeof window !== 'undefined') {
      const sessionData = {
        authenticated: true,
        user: ADMIN_USERNAME,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    }
    return true;
  }
  return false;
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (session && session.authenticated && session.user === ADMIN_USERNAME) {
      // 24 hour session expiration
      if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
        return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
