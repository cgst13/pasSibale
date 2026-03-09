import { Dropdown, Modal, Nav } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router';
import ProfileDropdownMenu from './ProfileDropdownMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ThemeToggler from 'components/common/ThemeToggler';
import { useState } from 'react';
import DropdownSearchBox from 'components/common/DropdownSearchBox';
import SearchResult from 'components/common/SearchResult';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const NavItemsSlim = () => {
  const [openSearchModal, setOpenSearchModal] = useState(false);
  return (
    <div className="navbar-nav navbar-nav-icons flex-row">
      <Nav.Item>
        <ThemeToggler slim />
      </Nav.Item>
      <Nav.Item>
        <Nav.Link onClick={() => setOpenSearchModal(!openSearchModal)}>
          <FeatherIcon icon="search" size={12} />
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Dropdown autoClose="outside">
          <Dropdown.Toggle
            as={Link}
            to="#!"
            className="dropdown-caret-none nav-link pe-0 py-0"
            variant=""
          >
            Olivia <FontAwesomeIcon icon={faChevronDown} className="fs-10" />
          </Dropdown.Toggle>
          <ProfileDropdownMenu />
        </Dropdown>
      </Nav.Item>

      <Modal
        show={openSearchModal}
        onHide={() => setOpenSearchModal(false)}
        className="search-box-modal mt-15"
      >
        <Modal.Body className="p-0 bg-transparent">
          <DropdownSearchBox
            className="navbar-top-search-box"
            inputClassName="rounded-pill"
            size="lg"
            style={{ width: 'auto' }}
          >
            <SearchResult />
          </DropdownSearchBox>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default NavItemsSlim;
