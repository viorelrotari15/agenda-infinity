import type { APIRequestContext } from '@playwright/test';

export async function apiLogin(
  request: APIRequestContext,
  input: { email: string; password: string },
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request.post('/api/auth/login', {
    data: { email: input.email, password: input.password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as { accessToken: string; refreshToken: string };
}

export async function installTokensInStorage(
  page: { addInitScript: (script: unknown, arg?: unknown) => Promise<void> },
  tokens: { accessToken: string; refreshToken: string },
) {
  await page.addInitScript(
    ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    tokens,
  );
}

