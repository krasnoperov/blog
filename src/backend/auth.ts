const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 1 month (match JWT TTL)

export function createAuthCookie(token: string): string {
  const sameSite = "Lax"; // Use Lax for both environments
  const secure = true; // Always use secure for HTTPS

  // Don't set Domain attribute - let browser use current domain
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    secure ? 'Secure' : '',
    `SameSite=${sameSite}`,
  ].filter(Boolean);

  return parts.join('; ');
}

export function clearAuthCookie(): string {
  // Don't set Domain attribute - let browser use current domain
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function getAuthToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));

  if (!authCookie) return null;

  return authCookie.split("=")[1];
}
