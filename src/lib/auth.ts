import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'expirytrack-secret-2024');

export async function signToken(payload: object) {
  return new SignJWT(payload as any).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(SECRET);
}
export async function verifyToken(token: string) {
  try { const { payload } = await jwtVerify(token, SECRET); return payload; } catch { return null; }
}
export async function getSession() {
  const jar = await cookies();
  const token = jar.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}
