import './i18n/i18n';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './styles/theme.css';

import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { addIcons } from 'ionicons';
import { alertCircle, checkmarkCircle, checkmarkDoneCircle } from 'ionicons/icons';
import { createRoot } from 'react-dom/client';
import { Redirect, Route } from 'react-router-dom';
import MainTabs from './components/MainTabs';
import { createAppQueryClient } from './lib/query-client';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

addIcons({
  'checkmark-circle': checkmarkCircle,
  'alert-circle': alertCircle,
  'checkmark-done-circle': checkmarkDoneCircle,
});

setupIonicReact({ mode: 'ios' });
const queryClient = createAppQueryClient();

function App() {
  return (
    <IonApp className="app-root">
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/tabs" component={MainTabs} />
          <Route path="/login" exact component={LoginPage} />
          <Route path="/register" exact component={RegisterPage} />
          <Route path="/admin" exact render={() => <Redirect to="/tabs/admin" />} />
          <Route path="/" exact render={() => <Redirect to="/tabs/discover" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);

queueMicrotask(() => {
  document.getElementById('boot-splash')?.remove();
});
