import { RRule } from 'rrule';

export function expandRecurrence(rruleText: string, from: Date, to: Date): Date[] {
  const rule = RRule.fromString(rruleText);
  return rule.between(from, to, true);
}
