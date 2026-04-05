const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH);
}

export function setSessionTokens(tokens: { accessToken: string; refreshToken: string }) {
  localStorage.setItem(ACCESS, tokens.accessToken);
  localStorage.setItem(REFRESH, tokens.refreshToken);
}

export function clearSession() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

export function hasStoredAccessToken(): boolean {
  return Boolean(getAccessToken());
}
