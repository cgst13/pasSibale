import { useState, useEffect } from 'react';
import { Button, Card, Col, Row, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCalendarAlt, faMapMarkerAlt, faClock, faEdit, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import { getEvents, deleteEvent } from 'services/eventsService';
import { Event } from 'types/events';
import { toast } from 'react-hot-toast';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import { UilCalendarAlt } from '@iconscout/react-unicons';

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;
    try {
      await deleteEvent(selectedEvent.id);
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      toast.success('Event deleted successfully');
      setShowDeleteModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete event');
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', url: '/' },
    { label: 'Events', active: true }
  ];

  if (loading) return <PasSibaleLoader />;

  return (
    <div>
      <PageBreadcrumb items={breadcrumbItems} />
      <div className="mb-9">
        <Row className="g-3 mb-4">
          <Col xs="auto">
            <h2 className="mb-0">Events Management</h2>
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0 text-body-secondary">All Events</h4>
          <Button as={Link} to="/events/create" variant="primary" size="sm">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Create Event
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                 <thead className="bg-body-tertiary">
                   <tr>
                     <th className="ps-3 py-2" style={{width: '40%'}}>Event</th>
                     <th className="py-2">Status</th>
                     <th className="py-2">Date</th>
                     <th className="py-2">Location</th>
                     <th className="pe-3 py-2 text-end">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {events.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="text-center py-5">
                         <div className="d-flex flex-column align-items-center">
                           <UilCalendarAlt size={48} className="text-body-quaternary mb-3" />
                           <h5 className="text-body-tertiary">No Events Found</h5>
                           <p className="text-body-quaternary mb-3">Create an event to start.</p>
                           <Button as={Link} to="/events/create" variant="primary" size="sm">
                             Create Event
                           </Button>
                         </div>
                       </td>
                     </tr>
                   ) : (
                     events.map(event => (
                       <tr key={event.id}>
                         <td className="ps-3 py-2">
                           <div className="d-flex align-items-center">
                             <div className="avatar-s bg-primary-subtle rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{width: '32px', height: '32px'}}>
                                 <FontAwesomeIcon icon={faCalendarAlt} className="text-primary fs-9" />
                             </div>
                             <div>
                                 <h6 className="mb-0 fw-semibold text-body-highlight">
                                     <Link to={`/events/attendance/${event.id}`} className="text-decoration-none text-body-highlight stretched-link">
                                         {event.title}
                                     </Link>
                                 </h6>
                                 <small className="text-body-secondary line-clamp-1" style={{maxWidth: '300px'}}>
                                   {event.description || 'No description'}
                                 </small>
                             </div>
                           </div>
                         </td>
                         <td className="py-2">
                           <span className={`badge bg-${event.status === 'Upcoming' ? 'info' : event.status === 'Ongoing' ? 'success' : event.status === 'Completed' ? 'secondary' : 'danger'} badge-phoenix fs-10`}>
                               {event.status}
                           </span>
                         </td>
                         <td className="py-2">
                             <small className="text-body-highlight fw-semibold d-block fs-10">
                                 {new Date(event.start_date).toLocaleDateString()}
                             </small>
                             <small className="text-body-secondary fs-10">
                                 {new Date(event.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </small>
                         </td>
                         <td className="py-2">
                             <small className="text-body-secondary fs-10">
                                 {event.location || 'N/A'}
                             </small>
                         </td>
                         <td className="pe-3 py-2 text-end">
                             <div className="btn-group btn-group-sm position-relative z-index-2">
                                 <Button 
                                     variant="subtle-secondary"
                                     as={Link}
                                     to={`/events/edit/${event.id}`}
                                     title="Edit"
                                 >
                                     <FontAwesomeIcon icon={faEdit} className="fs-10" />
                                 </Button>
                                 <Button 
                                     variant="subtle-danger"
                                     onClick={(e) => {
                                         e.preventDefault();
                                         handleDeleteClick(event);
                                     }}
                                     title="Delete"
                                 >
                                     <FontAwesomeIcon icon={faTrash} className="fs-10" />
                                 </Button>
                             </div>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the event "{selectedEvent?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EventList;
