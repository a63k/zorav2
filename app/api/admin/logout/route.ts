import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Déconnexion effectuée.' });

  // Clear HTTP-Only session cookie
  response.cookies.set({
    name: 'zora_admin_session',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
