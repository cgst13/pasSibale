import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router';
import { Container, Card, Button, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faWifi, faFingerprint, faArrowLeft, faCheckCircle, faExclamationTriangle, faUser, faClock, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { useScannerContext } from 'providers/ScannerProvider';
import { getEvent, recordAttendance } from 'services/eventsService';
import { getCitizenByToken } from 'services/citizenService';
import { Event } from 'types/events';
import { Citizen } from 'types/citizen';
import { toast } from 'react-hot-toast';
import PasSibaleLoader from 'components/common/PasSibaleLoader';

const EventAttendanceScanner = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as 'qr' | 'nfc' | 'fingerprint') || 'qr';
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastAttendee, setLastAttendee] = useState<{ citizen: Citizen; timestamp: number } | null>(null);
  
  const { lastScan, connected } = useScannerContext();
  const [mountTime] = useState(Date.now());

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getEvent(id);
      setEvent(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleAttendance = useCallback(async (token: string) => {
    if (processing || !event) return;
    
    setProcessing(true);
    try {
      const citizen = await getCitizenByToken(token);
      if (!citizen) {
        toast.error('Citizen not found');
        return;
      }

      await recordAttendance(event.id, citizen.id);
      setLastAttendee({ citizen, timestamp: Date.now() });
      toast.success(`Attendance recorded for ${citizen.firstName} ${citizen.lastName}`);
      
      // Clear last attendee after 5 seconds to reset UI
      setTimeout(() => setLastAttendee(prev => prev?.citizen.id === citizen.id ? null : prev), 5000);
    } catch (error) {
      console.error(error);
      toast.error('Error recording attendance');
    } finally {
      setProcessing(false);
    }
  }, [event, processing]);

  useEffect(() => {
    if (lastScan && lastScan.timestamp > mountTime && lastScan.type === mode) {
      handleAttendance(lastScan.value);
    }
  }, [lastScan, mountTime, mode, handleAttendance]);

  if (loading) return <PasSibaleLoader />;
  if (!event) return <Container className="py-5 text-center"><h3>Event not found</h3><Button as={Link} to="/events">Back to Events</Button></Container>;

  const getModeIcon = () => {
    switch (mode) {
      case 'qr': return faQrcode;
      case 'nfc': return faWifi;
      case 'fingerprint': return faFingerprint;
      default: return faQrcode;
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'qr': return 'QR Code Scanner';
      case 'nfc': return 'NFC Card Reader';
      case 'fingerprint': return 'Fingerprint Scanner';
      default: return 'Scanner';
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-column overflow-hidden position-fixed top-0 start-0 end-0 bottom-0 z-index-1000">
      {/* Header */}
      <div className="p-3 bg-white shadow-sm d-flex justify-content-between align-items-center z-index-10">
        <div className="d-flex align-items-center gap-3">
          <Button as={Link} to={`/events/attendance/${id}`} variant="phoenix-secondary" size="sm" className="rounded-pill">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Exit Full Screen
          </Button>
          <div>
            <h5 className="mb-0 text-body-highlight">{event.title}</h5>
            <div className="fs-10 text-body-tertiary">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" /> {event.location} • <FontAwesomeIcon icon={faClock} className="me-1" /> {new Date(event.start_date).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div>
          {connected ? (
            <Badge bg="success" className="fs-9 rounded-pill">
              <FontAwesomeIcon icon={faWifi} className="me-1" /> Mobile Connected
            </Badge>
          ) : (
            <Badge bg="danger" className="fs-9 rounded-pill">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> Mobile Disconnected
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Container fluid className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
        <Row className="w-100 g-4 justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0 h-100">
              <Card.Body className="p-5 text-center d-flex flex-column justify-content-center">
                <div className={`mb-4 text-${connected ? 'primary' : 'danger'}`}>
                  <div className="position-relative d-inline-block">
                    <FontAwesomeIcon icon={getModeIcon()} size="6x" />
                    {processing && (
                      <div className="position-absolute top-50 start-50 translate-middle">
                        <Spinner animation="border" variant="primary" style={{ width: '8rem', height: '8rem', opacity: 0.5 }} />
                      </div>
                    )}
                  </div>
                </div>
                
                <h2 className="mb-3">{getModeTitle()}</h2>
                
                {!connected ? (
                  <div className="alert alert-danger mb-0">
                    <p className="mb-2 fw-bold">Mobile Scanner Required</p>
                    <p className="fs-10 mb-0 text-start">
                      Please go to <strong>Settings</strong> to pair your mobile device before using hands-free attendance.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-body-secondary mb-4 fs-9">
                      Ready for scanning. Please tap your <strong>{mode.toUpperCase()}</strong> card or device now.
                      Attendance will be recorded automatically.
                    </p>
                    {processing && <div className="text-primary fw-bold pulse mb-0">Processing scan...</div>}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Last Attendee Card */}
          <Col md={6} lg={5} xl={4}>
            <Card className={`shadow-lg border-0 h-100 transition-base ${lastAttendee ? 'bg-success-subtle' : 'bg-white'}`}>
              <Card.Body className="p-5 text-center d-flex flex-column justify-content-center">
                {lastAttendee ? (
                  <>
                    <div className="text-success mb-4">
                      <FontAwesomeIcon icon={faCheckCircle} size="6x" />
                    </div>
                    <h2 className="text-success mb-2">Recorded!</h2>
                    <div className="mt-4">
                      <div className="avatar avatar-4xl mb-3 mx-auto">
                        <div className="avatar-name rounded-circle bg-success text-white">
                          <span>{lastAttendee.citizen.firstName.charAt(0)}{lastAttendee.citizen.lastName.charAt(0)}</span>
                        </div>
                      </div>
                      <h3 className="mb-1 text-body-highlight">{lastAttendee.citizen.firstName} {lastAttendee.citizen.lastName}</h3>
                      <p className="text-body-tertiary fs-9 mb-0">{lastAttendee.citizen.barangay}</p>
                      <div className="mt-3 text-body-quaternary fs-10">
                        Recorded at {new Date(lastAttendee.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-body-quaternary mb-4 opacity-25">
                      <FontAwesomeIcon icon={faUser} size="6x" />
                    </div>
                    <h3 className="text-body-tertiary">Waiting for Scan...</h3>
                    <p className="text-body-quaternary fs-9">The next attendee's details will appear here after scanning.</p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer Info */}
      <div className="p-3 text-center text-body-quaternary fs-10 bg-white border-top">
        PasSibale Identity & Attendance System • Automatic Hands-Free Mode
      </div>

      <style>{`
        .pulse {
          animation: pulse-animation 1.5s infinite;
        }
        @keyframes pulse-animation {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .z-index-1000 { z-index: 1000; }
        .avatar-4xl { width: 100px; height: 100px; font-size: 2.5rem; }
      `}</style>
    </div>
  );
};

export default EventAttendanceScanner;
