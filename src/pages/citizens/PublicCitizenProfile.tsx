import { useParams } from 'react-router';
import { Col, Row, Card, Nav, Tab } from 'react-bootstrap';
import Avatar from 'components/base/Avatar';
import Badge from 'components/base/Badge';
import { getCitizen } from 'services/citizenService';
import { useEffect, useState, ReactNode } from 'react';
import { Citizen } from 'types/citizen';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import { QRCodeSVG } from 'qrcode.react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { 
  UilUser, 
  UilMapMarker, 
  UilPhone, 
  UilHeartMedical,
  UilWifi,
  UilCheckCircle,
  UilDatabase
} from '@iconscout/react-unicons';
import CitizenProgramsTab from './CitizenProgramsTab';
import CitizenEventsTab from './CitizenEventsTab';

const PublicCitizenProfile = () => {
  const { id } = useParams();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQrZoom, setShowQrZoom] = useState(false);

  useEffect(() => {
    const fetchCitizen = async () => {
      if (id) {
        try {
          const data = await getCitizen(id);
          setCitizen(data);
        } catch (err) {
          console.error(err);
          setError('Failed to load citizen details or profile is not public.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCitizen();
  }, [id]);

  if (loading) {
    return <PasSibaleLoader />;
  }

  if (error || !citizen) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-body-tertiary">
        <div className="text-center p-5 bg-white rounded-3 shadow-sm">
          <h3 className="text-danger mb-3">Profile Unavailable</h3>
          <p className="text-body-tertiary mb-0">{error || 'Citizen not found'}</p>
        </div>
      </div>
    );
  }

  const InfoRow = ({ label, value, icon, className }: { label: string, value: string | number | ReactNode | undefined, icon?: ReactNode, className?: string }) => (
    <div className={`mb-3 ${className}`}>
      <div className="d-flex align-items-center mb-1">
        {icon && <span className="me-2 text-primary">{icon}</span>}
        <span className="text-body-tertiary fs-10 text-uppercase fw-bold ls-1">{label}</span>
      </div>
      <div className="fs-9 text-body-highlight fw-semibold text-break">{value || <span className="text-body-quaternary fst-italic">N/A</span>}</div>
    </div>
  );

  return (
    <div className="min-vh-100 bg-body-tertiary py-5 px-3">
      <div className="container-lg">
        <Row className="g-5 justify-content-center">
          {/* Left Column: Profile Card */}
          <Col xl={4}>
            <Card className="h-100 border-0 shadow-sm position-relative">
              <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
                <div className="position-relative mb-4">
                  <Avatar size="5xl" src={citizen.photoUrl} rounded="circle" className="border border-4 border-white shadow" />
                  <div className="position-absolute bottom-0 end-0">
                    <Badge variant="phoenix" bg={citizen.residencyStatus === 'Permanent' ? 'success' : 'warning'} className="rounded-pill fs-9 py-1 px-2">
                      {citizen.residencyStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-center mb-5">
                  <h4 className="fw-bolder mb-1">{citizen.firstName} {citizen.middleName} {citizen.lastName}</h4>
                  <p className="text-body-tertiary fs-9 mb-0 font-monospace">ID: {citizen.id}</p>
                </div>

                {/* System IDs Section (Display Only) */}
                <div className="d-flex justify-content-center gap-3 w-100 mt-4 flex-wrap">
                  {/* QR Code */}
                  {citizen.qrCode && (
                    <div className="position-relative">
                      <div className="bg-body-tertiary p-2 rounded-3 border border-translucent text-center cursor-pointer hover-bg-200 transition-base" style={{ minWidth: '100px' }}
                           onMouseEnter={() => setShowQrZoom(true)}
                           onMouseLeave={() => setShowQrZoom(false)}>
                        <QRCodeSVG value={`${window.location.origin}/public/citizen/${citizen.id}`} size={80} />
                        <p className="mt-1 mb-0 fs-10 text-body-tertiary fw-bold">QR Code</p>
                      </div>
                      
                      {/* Zoomed QR Code Popover */}
                      {showQrZoom && (
                        <div className="position-absolute bottom-100 start-50 translate-middle-x mb-2 p-3 bg-white rounded-3 shadow-lg border border-translucent text-center" style={{ zIndex: 1050, width: '280px' }}>
                          <h6 className="fw-bold text-primary mb-3">Scan to View Profile</h6>
                          <div className="p-2 bg-white rounded border border-translucent d-inline-block">
                            <QRCodeSVG value={`${window.location.origin}/public/citizen/${citizen.id}`} size={240} />
                          </div>
                          <p className="mt-2 mb-0 fs-10 text-body-tertiary">ID: {citizen.id}</p>
                          <div className="position-absolute top-100 start-50 translate-middle-x text-white" style={{ marginTop: '-1px' }}>
                            <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 10L0 0H20L10 10Z" fill="currentColor" className="text-white filter-drop-shadow" />
                              <path d="M10 9L1 0H19L10 9Z" fill="white" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* NFC Status */}
                  <div 
                    className="bg-body-tertiary p-2 rounded-3 border border-translucent text-center d-flex flex-column align-items-center justify-content-center" 
                    style={{ minWidth: '100px' }}
                  >
                     {citizen.nfcCardId ? (
                        <>
                          <UilWifi size={40} className="text-success mb-2" />
                          <div className="fs-10 fw-bold text-success">NFC Linked</div>
                        </>
                     ) : (
                        <>
                          <UilWifi size={40} className="text-body-quaternary mb-2" />
                          <div className="fs-10 text-body-tertiary">No NFC</div>
                        </>
                     )}
                  </div>

                  {/* Fingerprint Status */}
                  <div 
                    className="bg-body-tertiary p-2 rounded-3 border border-translucent text-center d-flex flex-column align-items-center justify-content-center" 
                    style={{ minWidth: '100px' }}
                  >
                     {citizen.fingerprintTemplate ? (
                        <>
                          <FontAwesomeIcon icon={faFingerprint} size="2x" className="text-success mb-2" />
                          <div className="fs-10 fw-bold text-success">Biometrics</div>
                        </>
                     ) : (
                        <>
                          <FontAwesomeIcon icon={faFingerprint} size="2x" className="text-body-quaternary mb-2" />
                          <div className="fs-10 text-body-tertiary">No Biometrics</div>
                        </>
                     )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column: Detailed Information */}
          <Col xl={8}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-0">
                <Tab.Container defaultActiveKey="personal">
                  <div className="border-bottom border-translucent px-4 pt-3">
                    <Nav variant="underline" className="mb-0 border-0 flex-nowrap overflow-auto">
                      <Nav.Item>
                        <Nav.Link eventKey="personal" className="py-3 px-3 d-flex align-items-center">
                          <UilUser size={18} className="me-2" /> Personal Info
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="programs" className="py-3 px-3 d-flex align-items-center">
                          <UilDatabase size={18} className="me-2" /> Programs
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="events" className="py-3 px-3 d-flex align-items-center">
                          <UilCheckCircle size={18} className="me-2" /> Events
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </div>

                  <Tab.Content className="p-4">
                    <Tab.Pane eventKey="personal">
                      <div className="mb-5">
                        <div className="d-flex align-items-center mb-4">
                          <UilUser size={20} className="text-primary me-2" />
                          <h6 className="text-body-highlight fw-bold mb-0 text-uppercase ls-1">Personal Details</h6>
                        </div>
                        <Row className="g-3">
                          <Col md={6} xl={4}><InfoRow label="First Name" value={citizen.firstName} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Middle Name" value={citizen.middleName} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Last Name" value={citizen.lastName} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Suffix" value={citizen.suffix} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Sex" value={citizen.sex} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Civil Status" value={citizen.civilStatus} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Date of Birth" value={citizen.dateOfBirth} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Age" value={citizen.age} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Nationality" value={citizen.nationality} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Religion" value={citizen.religion} /></Col>
                          <Col md={6} xl={4}><InfoRow label="Blood Type" value={citizen.bloodType} /></Col>
                        </Row>
                      </div>
                      
                      <div className="mb-5">
                        <div className="d-flex align-items-center mb-4">
                          <UilPhone size={20} className="text-primary me-2" />
                          <h6 className="text-body-highlight fw-bold mb-0 text-uppercase ls-1">Contact Information</h6>
                        </div>
                        <Row className="g-3">
                          <Col md={6}><InfoRow label="Mobile Number" value={citizen.mobileNumber} /></Col>
                          <Col md={6}><InfoRow label="Email Address" value={citizen.email} /></Col>
                        </Row>
                      </div>

                      <div className="mb-5">
                        <div className="d-flex align-items-center mb-4">
                          <UilMapMarker size={20} className="text-primary me-2" />
                          <h6 className="text-body-highlight fw-bold mb-0 text-uppercase ls-1">Residential Address</h6>
                        </div>
                        <Row className="g-3">
                          <Col md={12}><InfoRow label="Full Address" value={`${citizen.houseNumberStreet}, ${citizen.purokSitio}, ${citizen.barangay}, ${citizen.cityMunicipality}, ${citizen.province}`} className="mb-3" /></Col>
                          <Col md={4}><InfoRow label="Region" value="Region IV-B (MIMAROPA)" /></Col>
                          <Col md={4}><InfoRow label="Province" value={citizen.province} /></Col>
                          <Col md={4}><InfoRow label="City / Municipality" value={citizen.cityMunicipality} /></Col>
                          <Col md={4}><InfoRow label="Barangay" value={citizen.barangay} /></Col>
                          <Col md={4}><InfoRow label="Purok / Sitio" value={citizen.purokSitio} /></Col>
                          <Col md={4}><InfoRow label="Zip Code" value={citizen.zipCode} /></Col>
                        </Row>
                      </div>

                      <div>
                        <div className="d-flex align-items-center mb-4">
                          <UilHeartMedical size={20} className="text-primary me-2" />
                          <h6 className="text-body-highlight fw-bold mb-0 text-uppercase ls-1">Emergency Contact</h6>
                        </div>
                        <Row className="g-3">
                          <Col md={6}><InfoRow label="Contact Person" value={citizen.emergencyContactPerson} /></Col>
                          <Col md={6}><InfoRow label="Contact Number" value={citizen.emergencyContactNumber} /></Col>
                        </Row>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="programs">
                      <CitizenProgramsTab citizenId={citizen.id} readOnly={true} />
                    </Tab.Pane>

                    <Tab.Pane eventKey="events">
                      <CitizenEventsTab citizenId={citizen.id} />
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PublicCitizenProfile;
