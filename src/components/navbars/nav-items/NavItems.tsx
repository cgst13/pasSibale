import Avatar from 'components/base/Avatar';
import { Dropdown, Modal, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';
import defaultAvatar from 'assets/img/team/avatar.webp';
import ProfileDropdownMenu from './ProfileDropdownMenu';
import { useAppContext } from 'providers/AppProvider';
import { useScannerContext } from 'providers/ScannerProvider';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router';
import ThemeToggler from 'components/common/ThemeToggler';
import { useState, useEffect } from 'react';
import { useKioskMode } from 'providers/KioskModeProvider';
import DropdownSearchBox from 'components/common/DropdownSearchBox';
import SearchResult from 'components/common/SearchResult';
import classNames from 'classnames';
import { supabase } from 'services/supabaseClient'; // Adjusted import path
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobileAlt, faWifi, faWindowMaximize, faCalendarAlt, faCalendarCheck, faSearch, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { getEvents } from 'services/eventsService';
import { Event } from 'types/events';
import PasSibaleLoader from 'components/common/PasSibaleLoader';

const NavItems = () => {
  const {
    config: { navbarPosition }
  } = useAppContext();
  const { connected, deviceInfo } = useScannerContext();
  const { enterKioskMode, enterEventMode, isKioskMode, isEventMode } = useKioskMode();
  const [openSearchModal, setOpenSearchModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
           
           setUser({ ...user, ...profile });
        }
      } catch (error) {
        console.error('Error fetching user for navbar:', error);
      }
    };
    getUser();
  }, []);

  const handleOpenEventModal = async () => {
    setShowEventModal(true);
    setLoadingEvents(true);
    try {
      const allEvents = await getEvents();
      // Only show Ongoing events
      setEvents(allEvents.filter(e => e.status === 'Ongoing'));
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url || defaultAvatar;

  return (
    <div className="navbar-nav navbar-nav-icons flex-row">
      <Nav.Item className="d-flex align-items-center me-3">
        {connected && (
          <OverlayTrigger
            placement="bottom"
            overlay={
              <Tooltip id="scanner-tooltip">
                <div className="text-start">
                  <div className="fw-bold">{deviceInfo?.name || 'Mobile Scanner'}</div>
                  <div className="fs-10 text-body-tertiary">Connected</div>
                </div>
              </Tooltip>
            }
          >
            <div className="text-success cursor-pointer">
              <FontAwesomeIcon icon={faMobileAlt} className="me-1" />
              <FontAwesomeIcon icon={faWifi} size="xs" />
            </div>
          </OverlayTrigger>
        )}
      </Nav.Item>

      {!isKioskMode && !isEventMode && (
        <>
          <Nav.Item className="d-flex align-items-center">
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="kiosk-tooltip">Kiosk Mode</Tooltip>}
            >
              <Nav.Link 
                className="px-2" 
                onClick={enterKioskMode}
              >
                <FontAwesomeIcon icon={faWindowMaximize} size="lg" />
              </Nav.Link>
            </OverlayTrigger>
          </Nav.Item>

          <Nav.Item className="d-flex align-items-center">
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="event-mode-tooltip">Event Mode</Tooltip>}
            >
              <Nav.Link 
                className="px-2" 
                onClick={handleOpenEventModal}
              >
                <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
              </Nav.Link>
            </OverlayTrigger>
          </Nav.Item>
        </>
      )}

      <Nav.Item>
        <ThemeToggler className="px-2" />
      </Nav.Item>

      {/* Event Selection Modal */}
      <Modal 
        show={showEventModal} 
        onHide={() => setShowEventModal(false)} 
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-bottom border-translucent">
          <Modal.Title className="fw-bolder">Select Ongoing Event</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="bg-body-highlight p-4 border-bottom border-translucent">
             <p className="text-body-secondary mb-0 fs-9">Only ongoing events are available for Event Kiosk Mode. Please select an event to proceed to full-screen attendance mode.</p>
          </div>
          <div className="scrollbar" style={{ maxHeight: '400px' }}>
            {loadingEvents ? (
              <div className="text-center py-5">
                <PasSibaleLoader />
              </div>
            ) : events.length > 0 ? (
              <div className="list-group list-group-flush">
                {events.map(event => (
                  <button 
                    key={event.id}
                    className="list-group-item list-group-item-action p-4 border-bottom d-flex align-items-center justify-content-between transition-base"
                    onClick={() => {
                      enterEventMode(event);
                      setShowEventModal(false);
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary-subtle text-primary p-3 rounded-3">
                        <FontAwesomeIcon icon={faCalendarCheck} size="lg" />
                      </div>
                      <div>
                        <div className="fw-bolder text-body-highlight mb-1 fs-8 text-uppercase">{event.title}</div>
                        <div className="fs-10 text-body-tertiary">
                          {event.location && <span>{event.location} • </span>}
                          {new Date(event.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="mb-3 text-body-quaternary opacity-25" />
                <h5 className="fw-bolder text-body-tertiary">No ongoing events found</h5>
                <p className="text-body-quaternary mb-0">Check the events module to start or schedule an event.</p>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <Nav.Item
        className={classNames({
          'd-lg-none':
            navbarPosition === 'vertical' || navbarPosition === 'dual'
        })}
      >
        <Nav.Link onClick={() => setOpenSearchModal(!openSearchModal)}>
          <FontAwesomeIcon icon={faSearch} size="lg" />
        </Nav.Link>
      </Nav.Item>
      
      <Nav.Item>
        <Dropdown autoClose="outside" className="h-100">
          <Dropdown.Toggle
            as={Link}
            to="#!"
            className="dropdown-caret-none nav-link pe-0 py-0 lh-1 h-100 d-flex align-items-center"
            variant=""
          >
            <Avatar src={avatarUrl} size="l" className="border border-light shadow-sm" />
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
            size="sm"
            style={{ width: '25rem' }}
          >
            <SearchResult />
          </DropdownSearchBox>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default NavItems;
