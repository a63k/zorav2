import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'a63k';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'zora-admin-secure-jwt-secret-key-2026-991283';

export async function authenticateAdminServer(user: string, pass: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });

    const data = await res.json();
    return { success: data.success, error: data.error };
  } catch (err) {
    return { success: false, error: 'Erreur réseau lors de la connexion.' };
  }
}

export async function checkAdminAuthServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/check', { method: 'GET', cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.authenticated);
  } catch (err) {
    return false;
  }
}

export function verifyAdminServerRequest(req: Request): boolean {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );

    const token = cookies['zora_admin_session'];
    if (!token) return false;

    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', ADMIN_JWT_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (signature !== expectedSignature) return false;

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
    if (payload.user !== ADMIN_USERNAME) return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch (err) {
    return false;
  }
}

export async function logoutAdminServer(): Promise<void> {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch (err) {}
}

export function isAdminAuthenticated(): boolean {
  return false;
}
