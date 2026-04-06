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

  it('lists banners', async () => {
    nock(BASE)
      .get('/banners')
      .reply(200, [
        { id: 'b1', imageUrl: '/x.png', title: 'Hi', subtitle: null, linkUrl: null, sortOrder: 0 },
      ]);

    const client = new AgendaApiClient(BASE);
    const list = await client.listBanners();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Hi');
  });

  it('refreshes tokens', async () => {
    nock(BASE).post('/auth/refresh').reply(200, { accessToken: 'a', refreshToken: 'r' });
    const client = new AgendaApiClient(BASE);
    const t = await client.refresh('old-refresh');
    expect(t.accessToken).toBe('a');
  });

  it('requests availability with query string', async () => {
    nock(BASE)
      .get(
        '/specialists/sp1/availability?serviceId=svc1&from=2026-04-05T00%3A00%3A00.000Z&to=2026-04-06T00%3A00%3A00.000Z',
      )
      .reply(200, []);

    const client = new AgendaApiClient(BASE);
    const slots = await client.getAvailability({
      specialistId: 'sp1',
      serviceId: 'svc1',
      from: '2026-04-05T00:00:00.000Z',
      to: '2026-04-06T00:00:00.000Z',
    });
    expect(slots).toEqual([]);
  });

  it('lists specialist bookings in range', async () => {
    nock(BASE).get('/specialist/bookings?from=2026-04-01&to=2026-04-30').reply(200, []);

    const client = new AgendaApiClient(BASE, () => 'tok');
    const ev = await client.specialistBookings({ from: '2026-04-01', to: '2026-04-30' });
    expect(ev).toEqual([]);
  });

  it('encodes specialist booking id in path', async () => {
    nock(BASE).get('/specialist/bookings/abc%2F123').reply(200, {
      id: 'abc/123',
      title: 'T',
      start: '2026-04-05T10:00:00.000Z',
      end: '2026-04-05T11:00:00.000Z',
      status: 'CREATED',
      serviceName: 'S',
      clientName: 'C',
      clientEmail: 'e@e.e',
      serviceId: 's1',
      durationMinutes: 30,
    });

    const client = new AgendaApiClient(BASE, () => 'tok');
    const d = await client.specialistBooking('abc/123');
    expect(d.id).toBe('abc/123');
  });

  it('sends Accept-Language when getter is provided', async () => {
    nock(BASE).matchHeader('accept-language', 'ro').get('/specialists').reply(200, []);

    const client = new AgendaApiClient(BASE, undefined, () => 'ro');
    await client.listSpecialists();
  });
});
