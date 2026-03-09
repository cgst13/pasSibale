import { useParams, Link, useNavigate } from 'react-router';
import { Button, Col, Row, Card, Nav, Tab, Modal, Form } from 'react-bootstrap';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import Avatar from 'components/base/Avatar';
import Badge from 'components/base/Badge';
import { getCitizen, updateCitizen, deleteCitizen } from 'services/citizenService';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Citizen } from 'types/citizen';
import { toast } from 'react-hot-toast';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import ConfirmationModal from 'components/common/ConfirmationModal';
import { QRCodeSVG } from 'qrcode.react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint, faIdCard } from '@fortawesome/free-solid-svg-icons';
import { 
  UilUser, 
  UilMapMarker, 
  UilPhone, 
  UilEnvelope, 
  UilQrcodeScan, 
  UilEdit, 
  UilArrowLeft,
  UilHeartMedical,
  UilWifi,
  UilCheckCircle,
  UilSpinnerAlt,
  UilPrint,
  UilArchive,
  UilTrash,
  UilDatabase
} from '@iconscout/react-unicons';
import CitizenProgramsTab from './CitizenProgramsTab';
import CitizenEventsTab from './CitizenEventsTab';

const CitizenDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showIssueCardModal, setShowIssueCardModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNfcReplaceModal, setShowNfcReplaceModal] = useState(false);
  const [showFingerprintReplaceModal, setShowFingerprintReplaceModal] = useState(false);
  
  // NFC Modal State
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [nfcInput, setNfcInput] = useState('');
  const nfcInputRef = useRef<HTMLInputElement>(null);

  // Fingerprint Modal State
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [fingerprintInput, setFingerprintInput] = useState('');
  const fingerprintInputRef = useRef<HTMLTextAreaElement>(null);
  const [showQrZoom, setShowQrZoom] = useState(false);

  useEffect(() => {
    const fetchCitizen = async () => {
      if (id) {
        try {
          const data = await getCitizen(id);
          setCitizen(data);
        } catch (error) {
          console.error(error);
          toast.error('Failed to load citizen details');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCitizen();
  }, [id]);

  // Focus the input when modal opens
  useEffect(() => {
    if (showNfcModal && nfcInputRef.current) {
      setTimeout(() => nfcInputRef.current?.focus(), 100);
    }
  }, [showNfcModal]);

  // Focus the input when fingerprint modal opens
  useEffect(() => {
    if (showFingerprintModal && fingerprintInputRef.current) {
      setTimeout(() => fingerprintInputRef.current?.focus(), 100);
    }
  }, [showFingerprintModal]);

  const handleNfcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen || !nfcInput) return;

    try {
      const updatedCitizen = await updateCitizen(citizen.id, { nfcCardId: nfcInput });
      if (updatedCitizen) {
         setCitizen(prev => prev ? ({ ...prev, nfcCardId: nfcInput }) : null);
         toast.success('NFC Card linked successfully!');
         setShowNfcModal(false);
         setNfcInput('');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to link NFC Card');
    }
  };

  const handleFingerprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen || !fingerprintInput) return;

    try {
      const updatedCitizen = await updateCitizen(citizen.id, { fingerprintTemplate: fingerprintInput });
      if (updatedCitizen) {
         setCitizen(prev => prev ? ({ ...prev, fingerprintTemplate: fingerprintInput }) : null);
         toast.success('Fingerprint registered successfully!');
         setShowFingerprintModal(false);
         setFingerprintInput('');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to register Fingerprint');
    }
  };

  const handlePrintDetails = () => {
    window.print();
  };

  const handleArchiveCitizen = async () => {
    if (!citizen) return;
    try {
      await updateCitizen(citizen.id, { status: 'Archived' }); // Or 'Deceased' if chosen
      setCitizen(prev => prev ? ({ ...prev, status: 'Archived' }) : null);
      toast.success('Citizen archived successfully');
      setShowArchiveModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to archive citizen');
    }
  };

  const handleDeleteCitizen = async () => {
    if (!citizen) return;
    try {
      await deleteCitizen(citizen.id);
      toast.success('Citizen deleted successfully');
      navigate('/citizens'); // Redirect to list
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete citizen');
    }
  };

  const handleNfcClick = () => {
    if (citizen?.nfcCardId) {
      setShowNfcReplaceModal(true);
    } else {
      setShowNfcModal(true);
    }
  };

  const handleFingerprintClick = () => {
    if (citizen?.fingerprintTemplate) {
      setShowFingerprintReplaceModal(true);
    } else {
      setShowFingerprintModal(true);
    }
  };

  if (loading) {
    return <PasSibaleLoader />;
  }

  if (!citizen) {
    return (
      <div className="text-center p-5">
        <h3>Citizen not found</h3>
        <Button as={Link} to="/citizens/list" variant="primary" className="mt-3">
          Back to List
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Citizens', url: '/citizens/list' },
    { label: 'View Citizen', active: true }
  ];

  const fullName = `${citizen.firstName} ${citizen.middleName || ''} ${citizen.lastName} ${citizen.suffix || ''}`.trim();

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
    <div>
      <div className="d-print-none">
        <PageBreadcrumb items={breadcrumbItems} />
      </div>
      
      <div className="pb-5">
        <Row className="g-5">
          {/* Left Column: Profile Card */}
          <Col xl={4}>
            <Card className="h-100 border-0 shadow-sm position-relative">
              {/* Administrative Actions Toolbar */}
              <div className="position-absolute top-0 start-0 m-3 d-flex flex-column gap-2 d-print-none" style={{ zIndex: 10 }}>
                <Button 
                  as={Link}
                  to={`/citizens/edit/${citizen.id}`}
                  variant="phoenix-secondary" 
                  className="rounded-circle p-2" 
                  title="Edit Citizen"
                >
                  <UilEdit size={20} />
                </Button>
                <Button 
                  variant="phoenix-secondary" 
                  className="rounded-circle p-2" 
                  title="Issue ID Card"
                  onClick={() => setShowIssueCardModal(true)}
                >
                  <FontAwesomeIcon icon={faIdCard} size="lg" />
                </Button>
                <Button 
                  variant="phoenix-secondary" 
                  className="rounded-circle p-2" 
                  title="Print Details"
                  onClick={handlePrintDetails}
                >
                  <UilPrint size={20} />
                </Button>
                <Button 
                  variant="phoenix-secondary" 
                  className="rounded-circle p-2" 
                  title="Archive Citizen"
                  onClick={() => setShowArchiveModal(true)}
                >
                  <UilArchive size={20} />
                </Button>
                <Button 
                  variant="phoenix-danger" 
                  className="rounded-circle p-2 text-danger" 
                  title="Delete Citizen"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <UilTrash size={20} />
                </Button>
              </div>

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

                {/* System IDs Section (QR, NFC, Biometrics) */}
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
                    className="bg-body-tertiary p-2 rounded-3 border border-translucent text-center d-flex flex-column align-items-center justify-content-center cursor-pointer hover-bg-200 transition-base" 
                    style={{ minWidth: '100px', cursor: 'pointer' }}
                    onClick={handleNfcClick}
                    title="Click to Manage NFC Card"
                  >
                     {citizen.nfcCardId ? (
                        <>
                          <UilWifi size={40} className="text-success mb-2" />
                          <div className="fs-10 fw-bold text-success">NFC Linked</div>
                          <div className="fs-11 text-body-tertiary font-monospace text-truncate" style={{ maxWidth: '80px' }}>{citizen.nfcCardId}</div>
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
                    className="bg-body-tertiary p-2 rounded-3 border border-translucent text-center d-flex flex-column align-items-center justify-content-center cursor-pointer hover-bg-200 transition-base" 
                    style={{ minWidth: '100px', cursor: 'pointer' }}
                    onClick={handleFingerprintClick}
                    title="Click to Manage Fingerprint"
                  >
                     {citizen.fingerprintTemplate ? (
                        <>
                          <FontAwesomeIcon icon={faFingerprint} size="2x" className="text-success mb-2" />
                          <div className="fs-10 fw-bold text-success">Biometrics</div>
                          <div className="fs-11 text-body-tertiary">Registered</div>
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
                      <CitizenProgramsTab citizenId={citizen.id} />
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

      {/* Issue Card Modal */}
      <Modal show={showIssueCardModal} onHide={() => setShowIssueCardModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Issue ID Card</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column align-items-center py-4">
          <div id="printable-id-card" className="id-card-container position-relative overflow-hidden bg-white shadow-sm rounded-3 border" style={{ width: '340px', height: '215px', fontFamily: 'Arial, sans-serif' }}>
             {/* Card Design Background */}
             <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(135deg, #eff2f6 0%, #e3e6ed 100%)', zIndex: 0 }}></div>
             
             {/* Header */}
             <div className="position-relative d-flex align-items-center px-3 py-2 border-bottom border-translucent bg-white bg-opacity-75" style={{ zIndex: 1 }}>
               <div className="me-2 text-primary fw-bold" style={{ fontSize: '14px' }}>MUNICIPALITY OF PHOENIX</div>
               <div className="ms-auto text-uppercase fw-bold text-body-tertiary" style={{ fontSize: '10px' }}>Citizen ID</div>
             </div>

             {/* Content */}
             <div className="position-relative d-flex p-3" style={{ zIndex: 1 }}>
               {/* Photo */}
               <div className="me-3">
                 <div className="rounded border border-2 border-white shadow-sm overflow-hidden" style={{ width: '80px', height: '80px' }}>
                    {citizen?.photoUrl ? (
                      <img src={citizen.photoUrl} alt="Citizen" className="w-100 h-100 object-fit-cover" />
                    ) : (
                      <div className="w-100 h-100 bg-secondary-subtle d-flex align-items-center justify-content-center text-secondary fw-bold text-uppercase fs-9">
                        {citizen?.firstName?.[0]}{citizen?.lastName?.[0]}
                      </div>
                    )}
                 </div>
               </div>
               
               {/* Details */}
               <div className="flex-grow-1">
                 <h5 className="mb-0 text-uppercase text-primary fw-bold" style={{ fontSize: '14px' }}>{citizen?.lastName}, {citizen?.firstName}</h5>
                 <p className="mb-1 text-body-secondary" style={{ fontSize: '10px' }}>{citizen?.middleName}</p>
                 
                 <div className="mt-2">
                   <p className="mb-0 fw-bold text-uppercase text-body-tertiary" style={{ fontSize: '8px' }}>Citizen ID</p>
                   <p className="mb-1 font-monospace fw-bold text-dark" style={{ fontSize: '10px' }}>{citizen?.id.slice(0, 8)}...</p>
                 </div>
                 
                 <div className="mt-1">
                   <p className="mb-0 fw-bold text-uppercase text-body-tertiary" style={{ fontSize: '8px' }}>Date of Birth</p>
                   <p className="mb-0 text-dark" style={{ fontSize: '10px' }}>{citizen?.dateOfBirth}</p>
                 </div>
               </div>

               {/* QR Code */}
               <div className="ms-2 d-flex flex-column align-items-center justify-content-end">
                 {citizen?.qrCode && (
                   <div className="bg-white p-1 rounded border">
                      <QRCodeSVG value={citizen.qrCode} size={60} />
                   </div>
                 )}
               </div>
             </div>
             
             {/* Footer Stripe */}
             <div className="position-absolute bottom-0 start-0 w-100 bg-primary" style={{ height: '8px', zIndex: 1 }}></div>
          </div>
          <p className="text-muted mt-3 mb-0 fs-9">Preview of the NFC Card Design</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowIssueCardModal(false)}>Close</Button>
          <Button variant="primary" onClick={() => {
             const printContent = document.getElementById('printable-id-card');
             const WindowPrt = window.open('', '', 'left=0,top=0,width=600,height=400,toolbar=0,scrollbars=0,status=0');
             if (WindowPrt && printContent) {
               WindowPrt.document.write(`
                 <html>
                   <head>
                     <title>Print ID Card</title>
                     <style>
                       @page { size: auto; margin: 0mm; }
                       body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #fff; }
                       /* Copy styles from inline to here for printing consistency if needed, 
                          but inline styles usually work well for simple elements. 
                          We ensure bootstrap classes are not relied upon for layout in print view or we mock them.
                          Since we used standard flex and inline styles, it should render fine.
                       */
                     </style>
                   </head>
                   <body>
                     ${printContent.outerHTML}
                   </body>
                 </html>
               `);
               WindowPrt.document.close();
               WindowPrt.focus();
               setTimeout(() => {
                 WindowPrt.print();
                 WindowPrt.close();
               }, 250);
             }
          }}>
            <UilPrint size={18} className="me-2" /> Print Card
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Archive Modal */}
      <ConfirmationModal
        show={showArchiveModal}
        onHide={() => setShowArchiveModal(false)}
        onConfirm={handleArchiveCitizen}
        title="Archive Citizen"
        message={
          <>
            <p>Are you sure you want to archive this citizen record?</p>
            <p className="text-muted fs-9">Archived records are hidden from the main list but can be restored later.</p>
          </>
        }
        confirmText="Confirm Archive"
        variant="warning"
        icon="warning"
      />

      {/* Delete Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCitizen}
        title="Delete Citizen Record"
        message={
          <>
            <p>You are about to permanently delete the record for <strong>{citizen?.firstName} {citizen?.lastName}</strong>.</p>
            <p className="text-danger fs-9 fw-bold">This action cannot be undone.</p>
          </>
        }
        confirmText="Delete Permanently"
        variant="danger"
        icon="trash"
      />

      {/* NFC Replacement Confirmation Modal */}
      <ConfirmationModal
        show={showNfcReplaceModal}
        onHide={() => setShowNfcReplaceModal(false)}
        onConfirm={() => setShowNfcModal(true)}
        title="Replace NFC Card"
        message="This citizen already has a linked NFC card. Do you want to replace it with a new one?"
        confirmText="Proceed"
        variant="primary"
        icon="info"
      />

      {/* Fingerprint Replacement Confirmation Modal */}
      <ConfirmationModal
        show={showFingerprintReplaceModal}
        onHide={() => setShowFingerprintReplaceModal(false)}
        onConfirm={() => setShowFingerprintModal(true)}
        title="Replace Fingerprint"
        message="This citizen already has a registered fingerprint. Do you want to replace it with a new one?"
        confirmText="Proceed"
        variant="primary"
        icon="info"
      />

      {/* NFC Linking Modal */}
      <Modal show={showNfcModal} onHide={() => setShowNfcModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="px-3 pt-3">Link NFC Card</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5 px-5">
          <div className="mb-4 d-flex justify-content-center">
            <div className={`rounded-circle p-4 d-flex align-items-center justify-content-center border-4 border ${nfcInput ? 'border-success bg-success-subtle' : 'border-primary bg-primary-subtle'}`} style={{ width: '120px', height: '120px', transition: 'all 0.3s ease' }}>
              {nfcInput ? (
                <UilCheckCircle size={64} className="text-success" />
              ) : (
                <UilWifi size={64} className="text-primary animate-pulse" />
              )}
            </div>
          </div>
          
          <h4 className="mb-3">{nfcInput ? 'Card Detected!' : 'Tap NFC Card to Reader'}</h4>
          
          <div className="mb-4">
            {!nfcInput ? (
              <div className="text-body-secondary" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <p className="mb-2">Please follow these steps:</p>
                <ol className="text-start d-inline-block">
                  <li>Ensure your NFC reader is connected.</li>
                  <li>Click the input box below to focus (if not focused).</li>
                  <li>Place the NFC card on the reader.</li>
                </ol>
              </div>
            ) : (
               <div className="alert alert-success d-inline-block px-4 py-2 mb-0">
                 <span className="fw-bold">Card ID: </span> 
                 <span className="font-monospace">{nfcInput}</span>
               </div>
            )}
          </div>

          <Form onSubmit={handleNfcSubmit}>
            <Form.Group className="mb-4">
              <Form.Control 
                ref={nfcInputRef}
                type="text" 
                placeholder="Click here and scan card..." 
                value={nfcInput}
                onChange={(e) => setNfcInput(e.target.value)}
                className={`text-center fw-bold fs-2 font-monospace ${nfcInput ? 'is-valid' : ''}`}
                autoFocus
                autoComplete="off"
              />
              <Form.Text className="text-muted">
                The input field above must be focused to capture the card data.
              </Form.Text>
            </Form.Group>
            
            <div className="d-grid gap-2 col-md-8 mx-auto">
              <Button variant={nfcInput ? "success" : "secondary"} size="lg" type="submit" disabled={!nfcInput}>
                {nfcInput ? (
                   <>
                     <UilCheckCircle size={20} className="me-2" /> Link This Card
                   </>
                ) : 'Waiting for Scan...'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Fingerprint Modal */}
      <Modal show={showFingerprintModal} onHide={() => setShowFingerprintModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="px-3 pt-3">Register Fingerprint</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5 px-5">
          <div className="mb-4 d-flex justify-content-center">
             <div className={`rounded-circle p-4 d-flex align-items-center justify-content-center border-4 border ${fingerprintInput ? 'border-success bg-success-subtle' : 'border-primary bg-primary-subtle'}`} style={{ width: '120px', height: '120px', transition: 'all 0.3s ease' }}>
              {fingerprintInput ? (
                <UilCheckCircle size={64} className="text-success" />
              ) : (
                <FontAwesomeIcon icon={faFingerprint} size="4x" className="text-primary animate-pulse" />
              )}
            </div>
          </div>

          <h4 className="mb-3">{fingerprintInput ? 'Fingerprint Captured!' : 'Scan Fingerprint'}</h4>

          <div className="mb-4">
            {!fingerprintInput ? (
              <div className="text-body-secondary" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <p className="mb-2">Instructions:</p>
                <ol className="text-start d-inline-block">
                  <li>Connect the fingerprint scanner.</li>
                  <li>Click the input box below.</li>
                  <li>Place the citizen's finger on the scanner.</li>
                </ol>
              </div>
            ) : (
               <div className="text-success">
                 <p className="mb-0 fw-semibold">Template data received successfully.</p>
                 <small className="text-body-tertiary">Data length: {fingerprintInput.length} characters</small>
               </div>
            )}
          </div>

          <Form onSubmit={handleFingerprintSubmit}>
            <Form.Group className="mb-4">
              <Form.Control 
                as="textarea"
                rows={4}
                ref={fingerprintInputRef}
                placeholder="Waiting for fingerprint data..." 
                value={fingerprintInput}
                onChange={(e) => setFingerprintInput(e.target.value)}
                className={`font-monospace fs-10 ${fingerprintInput ? 'is-valid border-success' : ''}`}
                autoFocus
                readOnly={false} 
              />
               <Form.Text className="text-muted">
                Raw template data will appear here. Do not edit manually.
              </Form.Text>
            </Form.Group>
            
            <div className="d-grid gap-2 col-md-8 mx-auto">
              <Button variant={fingerprintInput ? "success" : "secondary"} size="lg" type="submit" disabled={!fingerprintInput}>
                 {fingerprintInput ? (
                   <>
                     <UilCheckCircle size={20} className="me-2" /> Save Fingerprint
                   </>
                ) : 'Waiting for Scan...'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CitizenDetails;
