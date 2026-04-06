import type {
  BannerPublic,
  BookingEvent,
  CreateBookingInput,
  MeUser,
  ServiceDto,
  Slot,
  SpecialistBookingDetail,
  SpecialistPublic,
  WorkingHoursRule,
} from '@agenda/shared';
import axios, { AxiosHeaders, type AxiosInstance, isAxiosError } from 'axios';

export type { CreateBookingInput, SpecialistBookingDetail } from '@agenda/shared';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AgendaApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'AgendaApiError';
  }
}

function normalizeResponseData<T>(data: unknown): T {
  if (data === '' || data == null) return {} as T;
  return data as T;
}

function agendaErrorFromAxios(error: unknown): AgendaApiError {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    let message = error.message;
    if (typeof body === 'object' && body && 'message' in body) {
      message = String((body as { message: unknown }).message);
    } else if (error.response?.statusText) {
      message = error.response.statusText;
    }
    return new AgendaApiError(message, status, body);
  }
  if (error instanceof Error) return new AgendaApiError(error.message, 0);
  return new AgendaApiError('Unknown error', 0);
}

export class AgendaApiClient {
  private readonly http: AxiosInstance;

  constructor(
    baseUrl: string,
    private getAccessToken?: () => string | null,
    private getAcceptLanguage?: () => string | undefined,
  ) {
    this.http = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      validateStatus: () => true,
    });

    this.http.interceptors.request.use((config) => {
      const isForm = config.data instanceof FormData;
      const headers = AxiosHeaders.from(config.headers ?? {});
      if (!isForm) {
        headers.set('Content-Type', 'application/json');
      }
      const token = this.getAccessToken?.();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const lang = this.getAcceptLanguage?.();
      if (lang) {
        headers.set('Accept-Language', lang);
      }
      config.headers = headers;
      return config;
    });
  }

  private async request<T>(method: string, url: string, data?: unknown): Promise<T> {
    try {
      const res = await this.http.request<T>({
        method,
        url,
        data,
      });
      if (res.status < 200 || res.status >= 300) {
        const body = res.data;
        throw new AgendaApiError(
          typeof body === 'object' && body && 'message' in body
            ? String((body as { message: unknown }).message)
            : res.statusText || 'Request failed',
          res.status,
          body,
        );
      }
      return normalizeResponseData<T>(res.data);
    } catch (e) {
      if (e instanceof AgendaApiError) throw e;
      throw agendaErrorFromAxios(e);
    }
  }

  listSpecialists(): Promise<SpecialistPublic[]> {
    return this.request('GET', '/specialists');
  }

  getSpecialistBySlug(slug: string): Promise<SpecialistPublic> {
    return this.request('GET', `/specialists/by-slug/${encodeURIComponent(slug)}`);
  }

  getServices(specialistId: string): Promise<ServiceDto[]> {
    return this.request('GET', `/specialists/${specialistId}/services`);
  }

  getSpecialistWorkingHours(specialistId: string): Promise<WorkingHoursRule[]> {
    return this.request('GET', `/specialists/${specialistId}/working-hours`);
  }

  getAvailability(params: {
    specialistId: string;
    serviceId: string;
    from: string;
    to: string;
  }): Promise<Slot[]> {
    const q = new URLSearchParams({
      serviceId: params.serviceId,
      from: params.from,
      to: params.to,
    });
    return this.request('GET', `/specialists/${params.specialistId}/availability?${q}`);
  }

  getOccupied(params: { specialistId: string; from: string; to: string }): Promise<Slot[]> {
    const q = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    return this.request('GET', `/specialists/${params.specialistId}/occupied?${q}`);
  }

  createBooking(body: CreateBookingInput): Promise<{ id: string }> {
    return this.request('POST', '/bookings', body);
  }

  registerClient(body: { email: string; password: string; phone: string }): Promise<AuthTokens> {
    return this.request('POST', '/auth/register', body);
  }

  registerSpecialist(body: {
    email: string;
    password: string;
    phone: string;
    displayName: string;
    slug: string;
    timezone?: string;
  }): Promise<AuthTokens> {
    return this.request('POST', '/auth/register/specialist', body);
  }

  login(body: { email: string; password: string }): Promise<AuthTokens> {
    return this.request('POST', '/auth/login', body);
  }

  refresh(refreshToken: string): Promise<AuthTokens> {
    return this.request('POST', '/auth/refresh', { refreshToken });
  }

  me(): Promise<MeUser> {
    return this.request('GET', '/auth/me');
  }

  patchProfile(body: {
    phone?: string;
    fcmToken?: string | null;
    publicBio?: string | null;
    seoTitle?: string | null;
  }): Promise<MeUser> {
    return this.request('PATCH', '/auth/profile', body);
  }

  listBanners(): Promise<BannerPublic[]> {
    return this.request('GET', '/banners');
  }

  adminListUsers(): Promise<
    Array<{
      id: string;
      email: string;
      phone: string | null;
      role: string;
      createdAt: string;
      specialist: { id: string; displayName: string; slug: string } | null;
    }>
  > {
    return this.request('GET', '/admin/users');
  }

  adminCreateUser(body: {
    email: string;
    password: string;
    phone?: string;
    role: 'ADMIN' | 'SPECIALIST' | 'CLIENT';
    displayName?: string;
    slug?: string;
    timezone?: string;
  }): Promise<{ id: string; email: string; phone: string | null; role: string }> {
    return this.request('POST', '/admin/users', body);
  }

  adminListSpecialists(): Promise<
    Array<{
      id: string;
      userId: string;
      displayName: string;
      slug: string;
      timezone: string;
      publicBio: string | null;
      seoTitle: string | null;
      user: { id: string; email: string; phone: string | null };
    }>
  > {
    return this.request('GET', '/admin/specialists');
  }

  adminPatchSpecialistPublicProfile(
    specialistId: string,
    body: { publicBio?: string | null; seoTitle?: string | null },
  ): Promise<{
    id: string;
    displayName: string;
    slug: string;
    timezone: string;
    publicBio: string | null;
    seoTitle: string | null;
  }> {
    return this.request('PATCH', `/admin/specialists/${specialistId}/public-profile`, body);
  }

  adminSetWorkingHours(
    specialistId: string,
    rules: WorkingHoursRule[],
  ): Promise<WorkingHoursRule[]> {
    return this.request('PUT', `/admin/specialists/${specialistId}/working-hours`, { rules });
  }

  adminListAvailabilityBlocks(specialistId: string): Promise<
    Array<{
      id: string;
      specialistId: string;
      startUtc: string;
      endUtc: string;
      note: string | null;
    }>
  > {
    return this.request('GET', `/admin/specialists/${specialistId}/availability-blocks`);
  }

  adminCreateAvailabilityBlock(
    specialistId: string,
    body: { startUtc: string; endUtc: string; note?: string },
  ): Promise<{ id: string }> {
    return this.request('POST', `/admin/specialists/${specialistId}/availability-blocks`, body);
  }

  adminDeleteAvailabilityBlock(id: string): Promise<{ ok: boolean }> {
    return this.request('DELETE', `/admin/availability-blocks/${id}`);
  }

  adminListServiceTypes(): Promise<
    Array<{
      id: string;
      name: string;
      defaultDurationMinutes: number;
      defaultBufferMinutes: number;
      active: boolean;
      sortOrder: number;
    }>
  > {
    return this.request('GET', '/admin/service-types');
  }

  adminCreateServiceType(body: {
    name: string;
    defaultDurationMinutes: number;
    defaultBufferMinutes?: number;
    sortOrder?: number;
  }): Promise<{ id: string }> {
    return this.request('POST', '/admin/service-types', body);
  }

  adminUpdateServiceType(
    id: string,
    body: Partial<{
      name: string;
      defaultDurationMinutes: number;
      defaultBufferMinutes: number;
      active: boolean;
      sortOrder: number;
    }>,
  ): Promise<unknown> {
    return this.request('PUT', `/admin/service-types/${id}`, body);
  }

  adminDeleteServiceType(id: string): Promise<{ ok: boolean }> {
    return this.request('DELETE', `/admin/service-types/${id}`);
  }

  adminListBanners(): Promise<
    Array<{
      id: string;
      imageUrl: string;
      title: string;
      subtitle: string | null;
      linkUrl: string | null;
      sortOrder: number;
      active: boolean;
    }>
  > {
    return this.request('GET', '/admin/banners');
  }

  adminCreateBanner(body: {
    imageUrl: string;
    title: string;
    subtitle?: string;
    linkUrl?: string;
    sortOrder?: number;
    active?: boolean;
  }): Promise<{ id: string }> {
    return this.request('POST', '/admin/banners', body);
  }

  adminUpdateBanner(
    id: string,
    body: Partial<{
      imageUrl: string;
      title: string;
      subtitle: string | null;
      linkUrl: string | null;
      sortOrder: number;
      active: boolean;
    }>,
  ): Promise<unknown> {
    return this.request('PUT', `/admin/banners/${id}`, body);
  }

  adminDeleteBanner(id: string): Promise<{ ok: boolean }> {
    return this.request('DELETE', `/admin/banners/${id}`);
  }

  adminCreateService(
    specialistId: string,
    body: {
      name: string;
      durationMinutes: number;
      bufferMinutes?: number;
      serviceTypeId?: string;
      active?: boolean;
    },
  ): Promise<ServiceDto> {
    return this.request('POST', `/admin/specialists/${specialistId}/services`, body);
  }

  adminUpdateService(
    serviceId: string,
    body: Partial<{
      name: string;
      durationMinutes: number;
      bufferMinutes: number;
      active: boolean;
      serviceTypeId: string | null;
    }>,
  ): Promise<ServiceDto> {
    return this.request('PUT', `/admin/services/${serviceId}`, body);
  }

  specialistBookings(params: { from: string; to: string }): Promise<BookingEvent[]> {
    const q = new URLSearchParams(params);
    return this.request('GET', `/specialist/bookings?${q}`);
  }

  specialistBooking(id: string): Promise<SpecialistBookingDetail> {
    return this.request('GET', `/specialist/bookings/${encodeURIComponent(id)}`);
  }

  specialistBookingDecision(
    id: string,
    decision: 'accept' | 'deny',
  ): Promise<{ id: string; status: string }> {
    return this.request('PATCH', `/specialist/bookings/${encodeURIComponent(id)}/decision`, {
      decision,
    });
  }

  clientBookings(params: { from: string; to: string }): Promise<
    Array<{
      id: string;
      title: string;
      start: string;
      end: string;
      status: string;
      serviceName: string;
      specialistName: string;
      recurrenceSeriesId: string | null;
    }>
  > {
    const q = new URLSearchParams(params);
    return this.request('GET', `/client/bookings?${q}`);
  }

  listMyServices(): Promise<ServiceDto[]> {
    return this.request('GET', '/specialist/services');
  }

  getWorkingHours(): Promise<WorkingHoursRule[]> {
    return this.request('GET', '/specialist/working-hours');
  }

  setWorkingHours(rules: WorkingHoursRule[]): Promise<WorkingHoursRule[]> {
    return this.request('PUT', '/specialist/working-hours', { rules });
  }

  createService(body: {
    name: string;
    durationMinutes: number;
    bufferMinutes?: number;
    serviceTypeId?: string;
  }): Promise<ServiceDto> {
    return this.request('POST', '/specialist/services', body);
  }

  patchSpecialistService(
    serviceId: string,
    body: Partial<{
      name: string;
      durationMinutes: number;
      bufferMinutes: number;
      active: boolean;
    }>,
  ): Promise<ServiceDto> {
    return this.request('PATCH', `/specialist/services/${serviceId}`, body);
  }

  cancelBooking(id: string, scope?: 'this' | 'series'): Promise<void> {
    const q = scope ? `?scope=${scope}` : '';
    return this.request('DELETE', `/bookings/${id}${q}`);
  }
}
