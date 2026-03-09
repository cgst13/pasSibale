import classNames from 'classnames';
import { useAppContext } from 'providers/AppProvider';
import { Navbar } from 'react-bootstrap';
import logo from 'assets/img/icons/logo.png';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import NavbarToggleButton from './NavbarToggleButton';
import { Link } from 'react-router';

const NavbarBrand = () => {
  const {
    config: { navbarTopShape, navbarPosition }
  } = useAppContext();
  const { breakpoints } = useBreakpoints();

  return (
    <>
      <div className="navbar-logo">
        {breakpoints.down('lg') && <NavbarToggleButton />}
        <Navbar.Brand
          as={Link}
          to="/"
          className={classNames({
            'me-1 me-sm-3':
              navbarTopShape === 'slim' || navbarPosition === 'horizontal'
          })}
        >
          {navbarTopShape === 'slim' ? (
            <>
              PasSibale{' '}
              <span className="text-body-highlight d-none d-sm-inline">
                slim
              </span>
            </>
          ) : (
            <div className="d-flex align-items-center">
              <img src={logo} alt="PasSibale" width={27} />
              <p className="logo-text ms-2 d-none d-sm-block">PasSibale</p>
            </div>
          )}
        </Navbar.Brand>
      </div>
    </>
  );
};

export default NavbarBrand;
