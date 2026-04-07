import { BadRequestException } from '@nestjs/common';
import { apiT } from '../../i18n/api-messages';

export function normalizePhone(input: string): string {
  return input.trim().replace(/\s+/g, '');
}

export function assertPhoneMinLen8(input: string): string {
  const n = normalizePhone(input);
  if (n.length < 8) {
    throw new BadRequestException(apiT('phone_min_8'));
  }
  return n;
}
