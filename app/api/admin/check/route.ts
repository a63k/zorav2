import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'a63k';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'zora-admin-secure-jwt-secret-key-2026-991283';

function verifyAdminToken(token: string): boolean {
  try {
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

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );

    const token = cookies['zora_admin_session'];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: ADMIN_USERNAME });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
