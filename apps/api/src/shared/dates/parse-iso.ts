import { BadRequestException } from '@nestjs/common';
import { apiT } from '../../i18n/api-messages';

type MessageKey = Parameters<typeof apiT>[0];

export function parseIsoOrThrow(
  value: string | undefined,
  missingKey: MessageKey = 'missing_date',
) {
  if (!value) throw new BadRequestException(apiT(missingKey));
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(apiT('invalid_date', { value: String(value) }));
  }
  return date;
}
