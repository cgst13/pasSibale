import { useState, useEffect } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';
import { getEventsByCitizen } from 'services/eventsService';
import { EventAttendance } from 'types/events';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

interface CitizenEventsTabProps {
  citizenId: string;
}

const CitizenEventsTab = ({ citizenId }: CitizenEventsTabProps) => {
  const [attendances, setAttendances] = useState<EventAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!citizenId) return;
      try {
        setLoading(true);
        const data = await getEventsByCitizen(citizenId);
        // Cast to unknown first if TS complains about incompatible types, but it should be fine
        setAttendances((data as unknown as EventAttendance[]) || []);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [citizenId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-body-tertiary">Loading attendance history...</p>
      </div>
    );
  }

  if (attendances.length === 0) {
    return (
      <div className="text-center p-5 border border-dashed rounded-3 bg-body-tertiary">
        <div className="text-body-quaternary mb-3">
           <FontAwesomeIcon icon={faCalendarAlt} size="3x" />
        </div>
        <p className="text-body-tertiary mb-0 fs-9">No event attendance records found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
         <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
         <h6 className="text-body-highlight fw-bold mb-0 text-uppercase ls-1">Event Attendance History</h6>
      </div>
      
      <div className="timeline-basic">
        {attendances.map((attendance) => (
          <div className="row g-3 mb-4" key={attendance.id}>
            <div className="col-auto text-center" style={{ minWidth: '60px' }}>
               <div className="timeline-item-date">
                  <span className="d-block fw-bold text-body-highlight fs-9">
                    {attendance.event?.start_date ? new Date(attendance.event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                  </span>
                  <span className="d-block text-body-tertiary fs-10">
                    {attendance.event?.start_date ? new Date(attendance.event.start_date).getFullYear() : ''}
                  </span>
               </div>
               <div className="vr bg-body-secondary mt-2 h-100" style={{ minHeight: '50px', width: '2px', opacity: 1 }}></div>
            </div>
            <div className="col">
              <Card className="h-100 border shadow-none bg-body-highlight-hover transition-base">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                     <h6 className="mb-0 fw-bold text-primary">{attendance.event?.title || 'Unknown Event'}</h6>
                     <Badge bg={attendance.status === 'Present' ? 'success' : 'warning'} className="fs-10">
                       {attendance.status}
                     </Badge>
                  </div>
                  <p className="text-body-secondary fs-9 mb-2">
                    {attendance.event?.description}
                  </p>
                  
                  <div className="d-flex flex-wrap gap-3 fs-10 text-body-tertiary mt-2">
                     <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faClock} className="me-1 text-info" />
                        <span>
                           In: {attendance.time_in ? new Date(`1970-01-01T${attendance.time_in}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                           {attendance.time_out ? ` - Out: ${new Date(`1970-01-01T${attendance.time_out}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </span>
                     </div>
                     {attendance.event?.location && (
                       <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1 text-danger" />
                          <span>{attendance.event.location}</span>
                       </div>
                     )}
                  </div>
                  {attendance.remarks && (
                    <div className="mt-2 p-2 bg-body-highlight rounded fs-10 text-body-secondary">
                      <strong>Remarks:</strong> {attendance.remarks}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitizenEventsTab;
