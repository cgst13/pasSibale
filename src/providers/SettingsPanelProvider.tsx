import {
  PropsWithChildren,
  createContext,
  use,
  useEffect,
  useState
} from 'react';
import { useAppContext } from './AppProvider';

export interface SettingsPanelConfig {
  showSettingPanelButton: boolean;
  openSettingPanel: boolean;
  disableNavigationType: boolean;
  disableVerticalNavbarAppearance: boolean;
  disableHorizontalNavbarShape: boolean;
  disableHorizontalNavbarAppearance: boolean;
  disableResetButton: boolean;
}

interface SettingsPanelContextInterFace {
  settingsPanelConfig: SettingsPanelConfig;
  setSettingsPanelConfig: (config: Partial<SettingsPanelConfig>) => void;
}

export const SettingsPanelContext = createContext(
  {} as SettingsPanelContextInterFace
);

const SettingsPanelProvider = ({ children }: PropsWithChildren) => {
  const {
    config: { navbarPosition }
  } = useAppContext();

  const [settingsPanelConfig, setSettingsPanelConfig] =
    useState<SettingsPanelConfig>({
      showSettingPanelButton: false,
      openSettingPanel: false,
      disableNavigationType: false,
      disableVerticalNavbarAppearance: false,
      disableHorizontalNavbarShape: false,
      disableHorizontalNavbarAppearance: false,
      disableResetButton: false
    });

  const updateSettingsPanelConfig = (config: Partial<SettingsPanelConfig>) => {
    setSettingsPanelConfig({
      ...settingsPanelConfig,
      ...config
    });
  };

  useEffect(() => {
    if (navbarPosition === 'dual') {
      updateSettingsPanelConfig({
        disableHorizontalNavbarShape: true,
        disableVerticalNavbarAppearance: true,
        disableHorizontalNavbarAppearance: false
      });
    }

    if (navbarPosition === 'horizontal') {
      updateSettingsPanelConfig({
        disableHorizontalNavbarShape: false,
        disableVerticalNavbarAppearance: true,
        disableHorizontalNavbarAppearance: false
      });
    }

    if (navbarPosition === 'combo' || navbarPosition === 'vertical') {
      updateSettingsPanelConfig({
        disableHorizontalNavbarShape: false,
        disableVerticalNavbarAppearance: false,
        disableHorizontalNavbarAppearance: false
      });
    }
  }, [navbarPosition]);

  return (
    <SettingsPanelContext
      value={{
        settingsPanelConfig,
        setSettingsPanelConfig: updateSettingsPanelConfig
      }}
    >
      {children}
    </SettingsPanelContext>
  );
};

export default SettingsPanelProvider;

export const useSettingsPanelContext = () => use(SettingsPanelContext);
