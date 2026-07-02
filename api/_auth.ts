import { jwtVerify } from 'jose';

const SUPABASE_JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');

  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (cookieHeader) {
    const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { payload } = await jwtVerify(token, SUPABASE_JWT_SECRET, {
      issuer: process.env.VITE_SUPABASE_URL,
    });

    return {
      id: payload.sub!,
      email: payload.email as string | undefined,
      role: payload.role as string | undefined,
    };
  } catch {
    throw new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
