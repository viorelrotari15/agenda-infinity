import nock from 'nock';
import { afterEach, describe, expect, it } from 'vitest';
import { AgendaApiClient, AgendaApiError } from './index';

const BASE = 'http://127.0.0.1:9';

afterEach(() => {
  nock.cleanAll();
});

describe('AgendaApiError', () => {
  it('carries status and optional body', () => {
    const err = new AgendaApiError('nope', 422, { message: 'bad' });
    expect(err.name).toBe('AgendaApiError');
    expect(err.status).toBe(422);
    expect(err.body).toEqual({ message: 'bad' });
  });
});

describe('AgendaApiClient', () => {
  it('returns parsed JSON on 200', async () => {
    nock(BASE)
      .get('/specialists')
      .reply(200, [{ id: '1', slug: 'a', displayName: 'A', timezone: 'UTC' }]);

    const client = new AgendaApiClient(BASE);
    const list = await client.listSpecialists();
    expect(list).toHaveLength(1);
    expect(list[0].slug).toBe('a');
  });

  it('throws AgendaApiError on error status with message from body', async () => {
    nock(BASE).post('/auth/login').reply(401, { message: 'Invalid credentials' });

    const client = new AgendaApiClient(BASE);
    await expect(client.login({ email: 'x@y.z', password: 'pw' })).rejects.toMatchObject({
      name: 'AgendaApiError',
      message: 'Invalid credentials',
      status: 401,
    });
  });

  it('sends Authorization when token getter returns a value', async () => {
    nock(BASE).matchHeader('authorization', 'Bearer tok').get('/auth/me').reply(200, {
      id: 'u',
      email: 'e@e.e',
      role: 'CLIENT',
    });

    const client = new AgendaApiClient(BASE, () => 'tok');
    const me = await client.me();
    expect(me.email).toBe('e@e.e');
  });

  it('encodes slug in by-slug path', async () => {
    nock(BASE)
      .get('/specialists/by-slug/hello%20world')
      .reply(200, { id: '1', slug: 'hello world', displayName: 'H', timezone: 'UTC' });

    const client = new AgendaApiClient(BASE);
    const sp = await client.getSpecialistBySlug('hello world');
    expect(sp.displayName).toBe('H');
  });
});
