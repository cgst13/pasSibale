import SettingsPanel from 'components/settings-panel/SettingsPanel';
import SettingsToggle from 'components/settings-panel/SettingsToggle';
import useToggleStyle from 'hooks/useToggleStyle';
import { useAppContext } from 'providers/AppProvider';
import { useSettingsPanelContext } from 'providers/SettingsPanelProvider';
import { KioskModeProvider } from 'providers/KioskModeProvider';
import { OfflineModeProvider } from 'providers/OfflineModeProvider';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

const App = () => {
  const { isStylesheetLoaded } = useToggleStyle();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect');
    sessionStorage.removeItem('redirect');
    if (redirect && redirect !== location.href) {
      const url = new URL(redirect);
      if (url.pathname !== '/') {
        navigate(url.pathname, { replace: true });
      }
    }
  }, [navigate]);

  const {
    settingsPanelConfig: { showSettingPanelButton },
    setSettingsPanelConfig
  } = useSettingsPanelContext();

  const {
    config: { theme, isRTL }
  } = useAppContext();

  // Automatically scrolls to top whenever pathname changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setSettingsPanelConfig({
      openSettingPanel: false
    });
  }, [isRTL]);

  return (
    <OfflineModeProvider>
      <KioskModeProvider>
        {!isStylesheetLoaded ? (
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: theme === 'dark' ? '#000' : '#fff'
            }}
          />
        ) : (
          <>
            <Outlet />
            {showSettingPanelButton && (
              <>
                <SettingsToggle />
                <SettingsPanel />
              </>
            )}
          </>
        )}
      </KioskModeProvider>
    </OfflineModeProvider>
  );
};

export default App;
