import { useMatchMedia } from './useMatchMedia';

/** Same breakpoint as booking/calendar layout in `HomePage` (`max-width: 767px`). */
export const MOBILE_BREAKPOINT = '(max-width: 767px)';

/**
 * Wider than `MOBILE_BREAKPOINT`: use full-screen `ion-select` modal on phones and tablets
 * so the option list is not a cramped popover (layout still uses 767px elsewhere).
 */
export const SELECT_MODAL_BREAKPOINT = '(max-width: 1023px)';

export function useIsMobileBreakpoint(): boolean {
  return useMatchMedia(MOBILE_BREAKPOINT);
}

export function useSelectModalInterface(): boolean {
  return useMatchMedia(SELECT_MODAL_BREAKPOINT);
}
