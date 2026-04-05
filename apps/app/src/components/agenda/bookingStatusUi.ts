import i18n from '../../i18n/i18n';

export function bookingStatusLabel(
  status: string,
  perspective: 'specialist' | 'client' = 'specialist',
) {
  switch (status) {
    case 'CREATED':
      return perspective === 'specialist'
        ? i18n.t('bookingStatus.CREATED.specialist')
        : i18n.t('bookingStatus.CREATED.client');
    case 'ACCEPTED':
      return i18n.t('bookingStatus.ACCEPTED');
    case 'DENIED':
      return i18n.t('bookingStatus.DENIED');
    case 'CANCELLED':
      return i18n.t('bookingStatus.CANCELLED');
    default:
      return status;
  }
}

export function bookingStatusClass(status: string) {
  switch (status) {
    case 'CREATED':
      return 'agenda-status agenda-status--created';
    case 'ACCEPTED':
      return 'agenda-status agenda-status--accepted';
    case 'DENIED':
      return 'agenda-status agenda-status--denied';
    case 'CANCELLED':
      return 'agenda-status agenda-status--cancelled';
    default:
      return 'agenda-status agenda-status--default';
  }
}
