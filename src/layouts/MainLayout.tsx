import classNames from 'classnames';
import Footer from 'components/footers/Footer';
import NavbarDual from 'components/navbars/navbar-dual/NavbarDual';
import NavbarTopHorizontal from 'components/navbars/navbar-horizontal/NavbarTopHorizontal';
import NavbarTopDefault from 'components/navbars/navbar-top/NavbarTopDefault';
import NavbarVertical from 'components/navbars/navbar-vertical/NavbarVertical';
import { useAppContext } from 'providers/AppProvider';
import { useMainLayoutContext } from 'providers/MainLayoutProvider';
import { useKioskMode } from 'providers/KioskModeProvider';
import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router';
import { Toaster } from 'react-hot-toast';

const MainLayout = () => {
  const {
    config: { navbarPosition }
  } = useAppContext();

  const { contentClass, footerClass } = useMainLayoutContext();
  const { isKioskMode, isEventMode } = useKioskMode();

  if (isKioskMode || isEventMode) {
    return (
      <Container fluid className="px-0">
        <div className="p-0 m-0 w-100">
          <Outlet />
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'shadow-sm border border-translucent',
              style: {
                background: 'var(--phoenix-body-bg)',
                color: 'var(--phoenix-body-color)',
                fontFamily: 'var(--phoenix-font-sans-serif)',
                fontSize: '0.875rem',
                padding: '1rem',
                borderRadius: '0.5rem',
              }
            }}
          />
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="px-0">
      {(navbarPosition === 'vertical' || navbarPosition === 'combo') && (
        <NavbarVertical />
      )}
      {navbarPosition === 'vertical' && <NavbarTopDefault />}
      {(navbarPosition === 'horizontal' || navbarPosition === 'combo') && (
        <NavbarTopHorizontal />
      )}
      {navbarPosition === 'dual' && <NavbarDual />}

      <div className={classNames(contentClass, 'content')}>
        <Outlet />
        <Footer className={classNames(footerClass, 'position-absolute')} />
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: 'shadow-sm border border-translucent',
            style: {
              background: 'var(--phoenix-body-bg)',
              color: 'var(--phoenix-body-color)',
              fontFamily: 'var(--phoenix-font-sans-serif)',
              fontSize: '0.875rem',
              padding: '1rem',
              borderRadius: '0.5rem',
            },
            success: {
              iconTheme: {
                primary: 'var(--phoenix-success)',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--phoenix-danger)',
                secondary: 'white',
              },
            },
          }}
        />
      </div>
    </Container>
  );
};

export default MainLayout;
