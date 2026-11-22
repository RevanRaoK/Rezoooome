import { createNeonAuth, type NeonAuth } from "@neon/auth/next/server";

let cachedAuth: NeonAuth | null = null;
let cachedKey = "";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string | null;
};

export function hasAuthServerConfig(): boolean {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim() ?? "";
  const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim() ?? "";
  return baseUrl.length > 0 && secret.length >= 32;
}

export function getNeonAuth(): NeonAuth {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim() ?? "";
  const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim() ?? "";

  if (!baseUrl) {
    throw new Error("NEON_AUTH_BASE_URL is not configured.");
  }
  if (secret.length < 32) {
    throw new Error("NEON_AUTH_COOKIE_SECRET must be set to at least 32 characters.");
  }

  const nextKey = `${baseUrl}::${secret.length}`;
  if (!cachedAuth || cachedKey !== nextKey) {
    cachedAuth = createNeonAuth({
      baseUrl,
      cookies: {
        secret,
        sessionDataTtl: 300,
      },
    });
    cachedKey = nextKey;
  }

  return cachedAuth;
}

export async function getServerSessionUser(): Promise<SessionUser | null> {
  if (!hasAuthServerConfig()) {
    return null;
  }

  try {
    const result = await getNeonAuth().getSession();
    const user = result?.data?.user;
    if (!user?.id) {
      return null;
    }

    const rawCreated = (user as { createdAt?: unknown }).createdAt;
    const createdAt =
      rawCreated instanceof Date
        ? rawCreated.toISOString()
        : typeof rawCreated === "string"
          ? rawCreated
          : null;

    return {
      id: user.id,
      name: typeof user.name === "string" ? user.name : null,
      email: typeof user.email === "string" ? user.email : null,
      createdAt,
    };
  } catch {
    return null;
  }
}
