import { useState, useEffect } from 'react';
import { Nav, Navbar, Collapse } from 'react-bootstrap';
import { useLocation } from 'react-router';
import { routes, Route } from 'sitemap';
import { capitalize } from 'helpers/utils';
import NavbarVerticalMenu from './NavbarVerticalMenu';
import {
  UilArrowFromRight,
  UilLeftArrowToLeft
} from '@iconscout/react-unicons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from 'providers/AppProvider';
import Button from 'components/base/Button';
import NavbarTopNav from '../navbar-horizontal/NavbarTopNav';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import NavbarVerticalCollapseProvider from './NavbarVerticalCollapseProvider';
import classNames from 'classnames';

const NavbarVerical = () => {
  const {
    config: {
      navbarPosition,
      openNavbarVertical,
      navbarVerticalAppearance,
      isNavbarVerticalCollapsed
    },
    setConfig
  } = useAppContext();

  const { breakpoints } = useBreakpoints();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { pathname } = useLocation();

  const checkPage = (page: Route): boolean => {
    if (page.path) {
      if (pathname === page.path) return true;
      if (page.path !== '/' && pathname.startsWith(page.path)) return true;
      const pageRoot = page.path.split('/')[1];
      const currentRoot = pathname.split('/')[1];
      if (pageRoot && pageRoot === currentRoot) return true;
    }
    return page.pages ? page.pages.some(checkPage) : false;
  };

  useEffect(() => {
    const activeRoute = routes.find(route => {
      if (route.labelDisabled) return false;
      return route.pages.some(checkPage);
    });
    if (activeRoute) {
      setOpenSection(activeRoute.label);
    } else {
      setOpenSection(null);
    }
  }, [pathname]);

  const toggleSection = (label: string) => {
    setOpenSection(prev => (prev === label ? null : label));
  };

  return (
    <NavbarVerticalCollapseProvider>
      <Navbar
        className="navbar-vertical"
        expand="lg"
        variant=""
        data-navbar-appearance={
          navbarVerticalAppearance === 'darker' ? 'darker' : ''
        }
      >
        <Navbar.Collapse id="navbarVerticalCollapse" in={openNavbarVertical}>
          <div className="navbar-vertical-content">
            <Nav className="flex-column" as="ul" id="navbarVerticalNav">
              {routes.map(route => (
                <Nav.Item key={route.label}>
                  {!route.labelDisabled ? (
                    <>
                      <Nav.Link
                        className={classNames('dropdown-indicator label-1', {
                          collapsed: openSection !== route.label,
                          'text-body-quaternary': !route.active
                        })}
                        onClick={() => toggleSection(route.label)}
                        aria-expanded={openSection === route.label}
                      >
                        <div className="d-flex align-items-center">
                          <div className="dropdown-indicator-icon">
                            <FontAwesomeIcon icon={faCaretRight} />
                          </div>
                          <span className="nav-link-icon">
                            <route.icon size={16} />
                          </span>
                          <span className="nav-link-text">
                            {capitalize(route.label)}
                          </span>
                        </div>
                      </Nav.Link>
                      <Collapse in={openSection === route.label}>
                        <div>
                          <NavbarVerticalMenu level={1} routes={route.pages} />
                        </div>
                      </Collapse>
                    </>
                  ) : (
                    <NavbarVerticalMenu level={1} routes={route.pages} />
                  )}
                </Nav.Item>
              ))}
            </Nav>

            {navbarPosition === 'combo' && breakpoints.down('lg') && (
              <div className="move-container">
                <div className="navbar-vertical-divider">
                  <hr className="navbar-vertical-hr" />
                </div>
                <NavbarTopNav />
              </div>
            )}
          </div>
        </Navbar.Collapse>
        <div className="navbar-vertical-footer">
          <Button
            className="navbar-vertical-toggle border-0 fw-semibold w-100 white-space-nowrap d-flex align-items-center"
            onClick={() => {
              setConfig({
                isNavbarVerticalCollapsed: !isNavbarVerticalCollapsed
              });
            }}
          >
            {isNavbarVerticalCollapsed ? (
              <UilArrowFromRight fill='currentColor' size={16} className="mb-1" />
            ) : (
              <>
                <UilLeftArrowToLeft fill='currentColor' size={16} className="mb-1" />
                <span className="ms-2">Collapsed View</span>
              </>
            )}
          </Button>
        </div>
      </Navbar>
    </NavbarVerticalCollapseProvider>
  );
};

export default NavbarVerical;
