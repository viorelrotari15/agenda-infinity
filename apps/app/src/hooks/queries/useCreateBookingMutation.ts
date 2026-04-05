import type { CreateBookingInput } from '@agenda/api-client';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCreateBookingMutation() {
  return useMutation({
    mutationFn: (body: CreateBookingInput) => api.createBooking(body),
  });
}
