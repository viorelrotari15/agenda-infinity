export type BookingFormValues = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
};

export type BookingSlotSummary = {
  weekday: string;
  dateLine: string;
  timeLine: string;
  durationMin: number | undefined;
};
