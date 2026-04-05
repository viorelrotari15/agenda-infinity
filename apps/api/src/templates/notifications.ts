export const bookingConfirmedTemplate = (name: string, start: string) =>
  `Hello ${name}, your booking is confirmed for ${start}.`;
export const bookingReminderTemplate = (name: string, start: string) =>
  `Reminder ${name}: booking at ${start}.`;
export const bookingCancelledTemplate = (name: string) =>
  `Hello ${name}, your booking has been cancelled.`;

export const bookingDecisionAcceptedTemplate = (
  clientName: string,
  specialistName: string,
  serviceName: string,
  startLabel: string,
) =>
  `Hi ${clientName}, ${specialistName} accepted your ${serviceName} on ${startLabel}. See you then.`;

export const bookingDecisionDeniedTemplate = (
  clientName: string,
  specialistName: string,
  serviceName: string,
  startLabel: string,
) =>
  `Hi ${clientName}, ${specialistName} could not confirm your ${serviceName} (${startLabel}). Please book another time if you still need an appointment.`;

export const specialistMorningDigestTemplate = (specialistName: string, lines: string[]) =>
  `Good morning ${specialistName}. Today's sessions (${lines.length}):\n${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`;

/** ~2 hours before start — client reminder */
export const bookingTwoHourReminderTemplate = (
  clientName: string,
  specialistName: string,
  serviceName: string,
  startLabel: string,
) =>
  `Hi ${clientName}, your ${serviceName} with ${specialistName} starts in about 2 hours (${startLabel}).`;
