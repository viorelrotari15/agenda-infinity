import '@testing-library/jest-dom/vitest';
import '@ionic/react/css/core.css';
import { setupIonicReact } from '@ionic/react';

/** jsdom does not implement matchMedia; hooks that listen for layout use it in the app. */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

setupIonicReact({ mode: 'ios' });
