import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from 'Routes';
import AppProvider from 'providers/AppProvider';
import BreakpointsProvider from 'providers/BreakpointsProvider';
import SettingsPanelProvider from 'providers/SettingsPanelProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <SettingsPanelProvider>
        <BreakpointsProvider>
          <RouterProvider router={router} />
        </BreakpointsProvider>
      </SettingsPanelProvider>
    </AppProvider>
  </StrictMode>
);
