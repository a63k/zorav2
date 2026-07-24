import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'a63k';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@Adam2009@';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'zora-admin-secure-jwt-secret-key-2026-991283';

function generateAdminToken(): string {
  const payload = {
    user: ADMIN_USERNAME,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_JWT_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Identifiants requis.' }, { status: 400 });
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect.' }, { status: 401 });
    }

    const token = generateAdminToken();

    const response = NextResponse.json({ success: true, message: 'Connexion réussie.' });

    // Set secure HTTP-Only cookie
    response.cookies.set({
      name: 'zora_admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 });
  }
}
