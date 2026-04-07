export const agendaKeys = {
  all: ['agenda'] as const,
  specialistBooking: (id: string) => [...agendaKeys.all, 'specialist-booking', id] as const,
  clientBooking: (id: string) => [...agendaKeys.all, 'client-booking', id] as const,
  specialists: () => [...agendaKeys.all, 'specialists'] as const,
  specialistServices: (specialistId: string) =>
    [...agendaKeys.all, 'services', specialistId] as const,
  specialistWorkingHours: (specialistId: string) =>
    [...agendaKeys.all, 'working-hours', specialistId] as const,
  me: () => [...agendaKeys.all, 'me'] as const,
  myServices: () => [...agendaKeys.all, 'my-services'] as const,
  banners: () => [...agendaKeys.all, 'banners'] as const,
  publicCategories: () => [...agendaKeys.all, 'public-categories'] as const,
  specialistDirectoryCategories: (specialistId: string) =>
    [...agendaKeys.all, 'specialist-directory-categories', specialistId] as const,
  publicSpecialists: (categorySlug: string | undefined, sort: string) =>
    [...agendaKeys.all, 'public-specialists', categorySlug ?? '', sort] as const,
  specialistReviews: (specialistId: string) =>
    [...agendaKeys.all, 'specialist-reviews', specialistId] as const,
  occupied: (specialistId: string, from: string, to: string) =>
    [...agendaKeys.all, 'occupied', specialistId, from, to] as const,
  availability: (specialistId: string, serviceId: string, from: string, to: string) =>
    [...agendaKeys.all, 'availability', specialistId, serviceId, from, to] as const,
};
