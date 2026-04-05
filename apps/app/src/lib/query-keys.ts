export const agendaKeys = {
  all: ['agenda'] as const,
  specialistBooking: (id: string) => [...agendaKeys.all, 'specialist-booking', id] as const,
  specialists: () => [...agendaKeys.all, 'specialists'] as const,
  specialistServices: (specialistId: string) =>
    [...agendaKeys.all, 'services', specialistId] as const,
  specialistWorkingHours: (specialistId: string) =>
    [...agendaKeys.all, 'working-hours', specialistId] as const,
  me: () => [...agendaKeys.all, 'me'] as const,
  myServices: () => [...agendaKeys.all, 'my-services'] as const,
  banners: () => [...agendaKeys.all, 'banners'] as const,
  occupied: (specialistId: string, from: string, to: string) =>
    [...agendaKeys.all, 'occupied', specialistId, from, to] as const,
};
