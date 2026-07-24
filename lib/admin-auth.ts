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

export async function logoutAdminServer(): Promise<void> {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch (err) {}
}

// Backward compatibility helper
export function isAdminAuthenticated(): boolean {
  return false;
}

