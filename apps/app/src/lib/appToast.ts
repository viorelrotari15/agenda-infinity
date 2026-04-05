import { useIonToast } from '@ionic/react';
import type { ToastOptions } from '@ionic/core/components';
import { useCallback } from 'react';

export type AppToastVariant = 'success' | 'danger' | 'info';

const icons: Record<AppToastVariant, string> = {
  success: 'checkmark-circle',
  danger: 'alert-circle',
  info: 'checkmark-done-circle',
};

/**
 * Ionic toast preset: iOS mode + translucent blur, SF-like typography, colored icons via theme.css.
 */
export function appToastOptions(
  variant: AppToastVariant,
  message: string,
  duration?: number,
): ToastOptions {
  return {
    message,
    duration: duration ?? (variant === 'danger' ? 3400 : 2800),
    position: 'bottom',
    translucent: true,
    layout: 'baseline',
    icon: icons[variant],
    cssClass: ['app-toast-ios', `app-toast-ios--${variant}`],
  };
}

export function useAppToast() {
  const [present] = useIonToast();

  const presentSuccess = useCallback(
    (message: string, duration?: number) => {
      void present(appToastOptions('success', message, duration));
    },
    [present],
  );

  const presentDanger = useCallback(
    (message: string, duration?: number) => {
      void present(appToastOptions('danger', message, duration));
    },
    [present],
  );

  const presentInfo = useCallback(
    (message: string, duration?: number) => {
      void present(appToastOptions('info', message, duration));
    },
    [present],
  );

  return { presentSuccess, presentDanger, presentInfo };
}
