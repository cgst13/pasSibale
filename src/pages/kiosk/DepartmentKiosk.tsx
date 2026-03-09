import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Badge, Spinner, Modal, Form, Button, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faClock, faSignInAlt, faSignOutAlt, faUser, faInfoCircle, faArrowLeft, faCheckCircle, faWifi, faQrcode, faFingerprint, faChevronRight, faChevronLeft, faSignOut, faUserShield, faSearch, faUserPlus, faBriefcase, faAddressCard } from '@fortawesome/free-solid-svg-icons';
import { useScannerContext } from 'providers/ScannerProvider';
import { useKioskMode } from 'providers/KioskModeProvider';
import { getDepartments, getDepartmentServices, getActiveCitizenActivity, timeInCitizen, timeOutCitizen } from 'services/departmentService';
import { getCitizenByToken, searchCitizens } from 'services/citizenService';
import { Department, DepartmentService } from 'types/department';
import { Citizen } from 'types/citizen';
import { toast } from 'react-hot-toast';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import { Link } from 'react-router';
import { supabase } from 'services/supabaseClient';
import { useOfflineMode } from 'providers/OfflineModeProvider';
import { db } from 'services/offlineDb';
import bcrypt from 'bcryptjs';
import logo from 'assets/img/icons/logo.png';

type KioskStep = 'VERIFY_IDENTITY' | 'SCAN_ACTION' | 'MANUAL_AUTH' | 'MANUAL_SEARCH' | 'SELECT_DEPT' | 'SELECT_SERVICE' | 'SUCCESS';

const DepartmentKiosk = () => {
  const [step, setStep] = useState<KioskStep>('VERIFY_IDENTITY');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [services, setServices] = useState<DepartmentService[]>([]);
  const [selectedService, setSelectedService] = useState<DepartmentService | null>(null);
  const [scanMode, setScanMode] = useState<'qr' | 'nfc' | 'fingerprint' | 'manual' | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [currentCitizen, setCurrentCitizen] = useState<Citizen | null>(null);
  const [activeActivity, setActiveActivity] = useState<any>(null);
  const [lastActionResult, setLastActionResult] = useState<{ type: 'IN' | 'OUT', citizen: Citizen, deptName: string } | null>(null);

  const { lastScan, connected } = useScannerContext();
  const { isKioskMode, exitKioskMode } = useKioskMode();
  const { isOfflineMode } = useOfflineMode();
  
  // Manual Override States
  const [manualAuthPassword, setManualAuthPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Citizen[]>([]);
  const [searching, setSearching] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);
  const [exitPassword, setExitPassword] = useState('');
  const [exiting, setExiting] = useState(false);
  const [mountTime] = useState(Date.now());

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleExitKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    setExiting(true);
    const success = await exitKioskMode(exitPassword);
    if (success) {
      setShowExitModal(false);
    }
    setExiting(false);
    setExitPassword('');
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (isOfflineMode) {
        // Verify against local auth cache
        const cachedUser = await db.authCache.toCollection().first();
        if (cachedUser && bcrypt.compareSync(manualAuthPassword, cachedUser.passwordHash)) {
          setStep('MANUAL_SEARCH');
          setManualAuthPassword('');
        } else {
          toast.error('Incorrect administrator password');
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          toast.error('No authenticated user found');
          return;
        }

        // Verify password
        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: manualAuthPassword,
        });

        if (error) {
          toast.error('Incorrect password');
          return;
        }

        setStep('MANUAL_SEARCH');
        setManualAuthPassword('');
      }
    } catch (error) {
      console.error('Manual Auth Error:', error);
      toast.error('Verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCitizenSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchCitizens(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const processIdentityVerification = async (citizen: Citizen) => {
    try {
      setCurrentCitizen(citizen);
      const active = await getActiveCitizenActivity(citizen.id);
      
      if (active) {
        // AUTO TIMEOUT if already active anywhere
        await timeOutCitizen(active.id);

        setLastActionResult({ 
          type: 'OUT', 
          citizen, 
          deptName: active.departments?.name || 'Unknown Office' 
        });
        setStep('SUCCESS');
      } else {
        // PROCEED TO TIME IN FLOW
        setStep('SELECT_DEPT');
      }
    } catch (error: any) {
      toast.error(error.message || 'Identity verification failed');
    }
  };

  const handleCitizenSelect = async (citizen: Citizen) => {
    setProcessing(true);
    await processIdentityVerification(citizen);
    setProcessing(false);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeptSelect = async (dept: Department) => {
    setSelectedDept(dept);
    try {
      setProcessing(true);
      const deptServices = await getDepartmentServices(dept.id);
      setServices(deptServices);
      setStep('SELECT_SERVICE');
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setProcessing(false);
    }
  };

  const handleServiceSelect = async (service: DepartmentService | null) => {
    if (!currentCitizen || !selectedDept) return;
    
    setProcessing(true);
    try {
      await timeInCitizen(currentCitizen.id, selectedDept.id, service?.id);
      setSelectedService(service);
      setLastActionResult({ 
        type: 'IN', 
        citizen: currentCitizen, 
        deptName: selectedDept.name 
      });
      setStep('SUCCESS');
    } catch (error: any) {
      toast.error(error.message || 'Time-in failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleScanModeSelect = (mode: 'qr' | 'nfc' | 'fingerprint') => {
    setScanMode(mode);
    setStep('SCAN_ACTION');
  };

  const handleScan = useCallback(async (token: string, type: string) => {
    if (step !== 'SCAN_ACTION' || processing) return;
    if (scanMode && type !== scanMode) return;
    
    setProcessing(true);
    try {
      const citizen = await getCitizenByToken(token);

      if (!citizen) {
        toast.error('Citizen not found');
        return;
      }
      await processIdentityVerification(citizen);
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  }, [step, processing, scanMode]);

  useEffect(() => {
    if (lastScan && lastScan.timestamp > mountTime) {
      handleScan(lastScan.value, lastScan.type);
    }
  }, [lastScan, mountTime, handleScan]);

  const resetKiosk = () => {
    setStep('VERIFY_IDENTITY');
    setSelectedDept(null);
    setSelectedService(null);
    setScanMode(null);
    setCurrentCitizen(null);
    setActiveActivity(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (step === 'SUCCESS') {
      const timer = setTimeout(resetKiosk, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (loading) return <PasSibaleLoader />;

  return (
    <div className="bg-white min-vh-100 d-flex flex-column overflow-hidden position-fixed top-0 start-0 end-0 bottom-0 z-index-1000 kiosk-container">
      {/* Modern Enhanced Header */}
      <div className="px-4 py-2 bg-white-80 backdrop-blur border-bottom shadow-sm d-flex justify-content-between align-items-center z-index-10 kiosk-header">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center me-3">
            <img src={logo} alt="Logo" width="32" className="me-2" />
            <div className="vr h-25 my-auto mx-2 opacity-25 d-none d-md-block"></div>
            <h5 className="mb-0 fw-bolder text-primary letter-spacing-tight d-none d-sm-block">PASSI BALE</h5>
          </div>

          <div className="d-flex align-items-center gap-2">
            {isKioskMode ? (
              <Button 
                variant="subtle-danger" 
                size="sm" 
                className="rounded-pill px-3 fw-bold fs-10 border-0 shadow-none" 
                onClick={() => setShowExitModal(true)}
              >
                <FontAwesomeIcon icon={faSignOut} className="me-2" /> EXIT KIOSK
              </Button>
            ) : (
              <Button 
                as={Link} 
                to="/" 
                variant="subtle-secondary" 
                size="sm" 
                className="rounded-pill px-3 fw-bold fs-10 border-0 shadow-none"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> DASHBOARD
              </Button>
            )}
          </div>

          {/* Activity Info in Header */}
          <div className="d-none d-lg-flex align-items-center gap-2 animate-fade-in ms-3 border-start ps-3">
            {currentCitizen && (
              <div className="d-flex align-items-center px-3 py-1 bg-primary-subtle rounded-pill border border-primary-subtle shadow-sm">
                <div className="avatar avatar-xs me-2">
                  {currentCitizen.photoUrl ? (
                    <img src={currentCitizen.photoUrl} alt="" className="rounded-circle object-fit-cover" />
                  ) : (
                    <div className="avatar-name rounded-circle bg-primary text-white fs-11">
                      {currentCitizen.firstName.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="fs-10 fw-bold text-primary text-uppercase">{currentCitizen.firstName} {currentCitizen.lastName}</span>
              </div>
            )}
            {selectedDept && (
              <div className="d-flex align-items-center px-3 py-1 bg-info-subtle rounded-pill border border-info-subtle shadow-sm">
                <FontAwesomeIcon icon={faBuilding} className="text-info me-2 fs-11" />
                <span className="fs-10 fw-bold text-info text-uppercase">{selectedDept.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-4">
          <div className="text-end d-none d-md-block">
            <div className="fs-11 text-body-tertiary fw-bold text-uppercase ls-1 mb-0 opacity-75">Kiosk Station</div>
            <div className="fw-bolder fs-10 text-primary">ST-01</div>
          </div>
          
          <div className="d-flex align-items-center gap-2 bg-light-subtle rounded-pill ps-2 pe-3 py-1 border">
            <div className={`status-dot ${connected ? 'bg-success' : 'bg-danger'} ${connected ? 'animate-pulse' : ''}`}></div>
            <span className={`fs-10 fw-bolder ${connected ? 'text-success' : 'text-danger'}`}>
              {connected ? 'STABLE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Exit Modal */}
      <Modal show={showExitModal} onHide={() => !exiting && setShowExitModal(false)} centered backdrop="static" className="kiosk-modal">
        <Modal.Header closeButton={!exiting} className="border-0 pb-0">
          <Modal.Title className="fw-bolder">Security Check</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="text-body-secondary mb-4">Enter administrator password to exit Kiosk Mode.</p>
          <Form onSubmit={handleExitKiosk}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold fs-10 text-uppercase">Admin Password</Form.Label>
              <Form.Control 
                type="password" 
                value={exitPassword} 
                onChange={(e) => setExitPassword(e.target.value)}
                placeholder="••••••••"
                className="form-control-lg border-2"
                autoFocus
                disabled={exiting}
              />
            </Form.Group>
            <div className="d-grid mt-4">
              <Button variant="primary" type="submit" size="lg" className="fw-bold py-3 shadow-sm" disabled={exiting || !exitPassword}>
                {exiting ? <Spinner animation="border" size="sm" /> : 'CONFIRM & EXIT'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Main Content Area - Full Screen Content */}
      <Container fluid className="flex-grow-1 p-0 d-flex flex-column kiosk-main">
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          
          <div className="w-100" style={{ maxWidth: '1200px' }}>
            
            {/* Step 1: Identity Type (Now First) */}
            {step === 'VERIFY_IDENTITY' && (
              <div className="animate-fade-in text-center">
                <div className="mb-5">
                  <div className="display-4 fw-bolder text-primary mb-2">VERIFY YOUR IDENTITY</div>
                  <p className="fs-7 text-body-tertiary">Choose how you would like to sign in or sign out.</p>
                </div>
                <Row className="g-4 justify-content-center">
                  <Col sm={6} lg={4}>
                    <button className="kiosk-card border-0 w-100 p-5 rounded-4 shadow-sm bg-white d-flex flex-column align-items-center gap-4 transition-all" onClick={() => handleScanModeSelect('qr')}>
                      <div className="kiosk-icon-circle-lg bg-primary-subtle text-primary">
                        <FontAwesomeIcon icon={faQrcode} size="3x" />
                      </div>
                      <div>
                        <div className="fw-bolder fs-7 mb-1">QR CODE ID</div>
                        <div className="fs-10 text-body-tertiary text-uppercase ls-1">Scan digital or printed ID</div>
                      </div>
                    </button>
                  </Col>
                  <Col sm={6} lg={4}>
                    <button className="kiosk-card border-0 w-100 p-5 rounded-4 shadow-sm bg-white d-flex flex-column align-items-center gap-4 transition-all" onClick={() => handleScanModeSelect('nfc')}>
                      <div className="kiosk-icon-circle-lg bg-info-subtle text-info">
                        <FontAwesomeIcon icon={faAddressCard} size="3x" />
                      </div>
                      <div>
                        <div className="fw-bolder fs-7 mb-1">SMART CARD</div>
                        <div className="fs-10 text-body-tertiary text-uppercase ls-1">Tap your NFC card</div>
                      </div>
                    </button>
                  </Col>
                  <Col sm={6} lg={4}>
                    <button className="kiosk-card border-0 w-100 p-5 rounded-4 shadow-sm bg-white d-flex flex-column align-items-center gap-4 transition-all opacity-50 cursor-not-allowed" disabled>
                      <div className="kiosk-icon-circle-lg bg-secondary-subtle text-secondary">
                        <FontAwesomeIcon icon={faFingerprint} size="3x" />
                      </div>
                      <div>
                        <div className="fw-bolder fs-7 mb-1">FINGERPRINT</div>
                        <div className="fs-10 text-body-tertiary text-uppercase ls-1">Currently Offline</div>
                      </div>
                    </button>
                  </Col>
                </Row>
                <div className="mt-5">
                  <Button variant="outline-secondary" className="rounded-pill px-4 fw-bold" onClick={() => setStep('MANUAL_AUTH')}>
                    <FontAwesomeIcon icon={faUserShield} className="me-2" /> STAFF MANUAL OVERRIDE
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Departments (Now for New Sessions) */}
            {step === 'SELECT_DEPT' && (
              <div className="animate-fade-in text-center">
                <div className="mb-5">
                  <div className="display-4 fw-bolder text-primary mb-2">WHERE ARE YOU VISITING?</div>
                  <p className="fs-7 text-body-tertiary">Select the office you would like to visit today.</p>
                </div>
                <Row className="g-4 justify-content-center">
                  {departments.map(dept => (
                    <Col key={dept.id} sm={6} lg={4} xl={3}>
                      <button 
                        className="kiosk-card border-0 w-100 p-4 rounded-4 shadow-sm bg-light-subtle d-flex flex-column align-items-center gap-3 transition-all"
                        onClick={() => handleDeptSelect(dept)}
                      >
                        <div className="kiosk-icon-circle bg-primary-subtle text-primary">
                          <FontAwesomeIcon icon={faBuilding} size="2x" />
                        </div>
                        <div className="fw-bolder fs-8 text-uppercase">{dept.name}</div>
                        <div className="fs-10 text-body-tertiary text-uppercase ls-1 fw-bold">{dept.code}</div>
                      </button>
                    </Col>
                  ))}
                </Row>
                <Button variant="link" className="mt-5 text-secondary fw-bold text-uppercase" onClick={() => resetKiosk()}>
                  <FontAwesomeIcon icon={faChevronLeft} className="me-2" /> Cancel & Restart
                </Button>
              </div>
            )}

            {/* Step 3: Services */}
            {step === 'SELECT_SERVICE' && (
              <div className="animate-fade-in text-center">
                <div className="mb-5">
                  <div className="display-4 fw-bolder text-primary mb-2">PURPOSE OF VISIT</div>
                  <p className="fs-7 text-body-tertiary">What service can we help you with at <strong>{selectedDept?.name}</strong>?</p>
                </div>
                <Row className="g-4 justify-content-center">
                  <Col sm={12} md={8} lg={6}>
                    <div className="d-flex flex-column gap-3">
                      <button 
                        className="kiosk-list-item border-0 w-100 p-4 rounded-4 shadow-sm bg-primary text-white d-flex align-items-center justify-content-between transition-all"
                        onClick={() => handleServiceSelect(null)}
                      >
                        <div className="d-flex align-items-center gap-3 text-start">
                          <div className="kiosk-icon-circle-sm bg-white-20 text-white">
                            <FontAwesomeIcon icon={faInfoCircle} />
                          </div>
                          <div>
                            <div className="fw-bolder fs-8">GENERAL INQUIRY</div>
                            <div className="fs-10 opacity-75">Other concerns or unspecified visit</div>
                          </div>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>

                      {services.map(service => (
                        <button 
                          key={service.id}
                          className="kiosk-list-item border-0 w-100 p-4 rounded-4 shadow-sm bg-white d-flex align-items-center justify-content-between transition-all border border-translucent"
                          onClick={() => handleServiceSelect(service)}
                        >
                          <div className="d-flex align-items-center gap-3 text-start">
                            <div className="kiosk-icon-circle-sm bg-info-subtle text-info">
                              <FontAwesomeIcon icon={faBriefcase} />
                            </div>
                            <div>
                              <div className="fw-bolder fs-8 text-uppercase">{service.name}</div>
                              {service.description && <div className="fs-10 text-body-tertiary">{service.description}</div>}
                            </div>
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-body-quaternary" />
                        </button>
                      ))}
                    </div>
                    <Button variant="link" className="mt-5 text-secondary fw-bold text-uppercase" onClick={() => setStep('SELECT_DEPT')}>
                      <FontAwesomeIcon icon={faChevronLeft} className="me-2" /> Back to Offices
                    </Button>
                  </Col>
                </Row>
              </div>
            )}

            {/* Step: Scan Action */}
            {step === 'SCAN_ACTION' && (
              <div className="animate-fade-in text-center py-5">
                <div className="scan-ripple-container mb-5">
                  <div className="scan-ripple"></div>
                  <div className="scan-ripple delay-1"></div>
                  <div className="scan-ripple delay-2"></div>
                  <div className="kiosk-icon-circle-xl bg-primary text-white position-relative z-index-1 shadow-lg">
                    <FontAwesomeIcon icon={scanMode === 'qr' ? faQrcode : scanMode === 'nfc' ? faWifi : faFingerprint} size="4x" />
                  </div>
                </div>
                <div className="display-5 fw-bolder text-primary mb-3 text-uppercase">PLEASE SCAN NOW</div>
                <p className="fs-6 text-body-tertiary mb-5">Position your <strong>{scanMode?.toUpperCase()} ID</strong> towards the reader.</p>
                
                {processing && (
                  <div className="mt-4 animate-fade-in">
                    <Spinner animation="grow" variant="primary" size="sm" className="me-2" />
                    <Spinner animation="grow" variant="primary" size="sm" className="me-2" />
                    <Spinner animation="grow" variant="primary" size="sm" />
                    <div className="mt-3 fw-bold text-primary">PROCESSING...</div>
                  </div>
                )}

                <div className="mt-5 pt-5">
                  <Button variant="outline-secondary" size="lg" className="rounded-pill px-5 fw-bold" onClick={() => setStep('VERIFY_IDENTITY')}>
                    CANCEL SCAN
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Manual Auth */}
            {step === 'MANUAL_AUTH' && (
              <div className="animate-fade-in text-center">
                <div className="kiosk-icon-circle-lg bg-warning-subtle text-warning mx-auto mb-4">
                  <FontAwesomeIcon icon={faUserShield} size="3x" />
                </div>
                <div className="display-5 fw-bolder mb-2">STAFF VERIFICATION</div>
                <p className="text-body-secondary mb-5">Enter administrator password to enable manual search.</p>
                
                <Form onSubmit={handleManualAuth} className="mx-auto text-start" style={{ maxWidth: '400px' }}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold fs-10 text-uppercase text-body-tertiary">Admin Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={manualAuthPassword}
                      onChange={(e) => setManualAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-control-lg border-2"
                      autoFocus
                      disabled={processing}
                    />
                  </Form.Group>
                  <div className="d-grid gap-3">
                    <Button variant="primary" size="lg" type="submit" className="py-3 fw-bold shadow-sm" disabled={processing || !manualAuthPassword}>
                      {processing ? <Spinner animation="border" size="sm" /> : 'VERIFY & PROCEED'}
                    </Button>
                    <Button variant="link" className="text-secondary fw-bold" onClick={() => setStep('VERIFY_IDENTITY')}>
                      CANCEL
                    </Button>
                  </div>
                </Form>
              </div>
            )}

            {/* Step: Manual Search */}
            {step === 'MANUAL_SEARCH' && (
              <div className="animate-fade-in w-100" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="text-center mb-5">
                  <div className="display-5 fw-bolder text-primary mb-2">MANUAL CITIZEN SEARCH</div>
                  <p className="text-body-secondary">Search by name for manual check-in.</p>
                </div>

                <div className="mb-4 shadow-sm rounded-4 overflow-hidden border border-2 border-primary">
                  <InputGroup size="lg">
                    <InputGroup.Text className="bg-white border-0 ps-4">
                      <FontAwesomeIcon icon={faSearch} className="text-primary" />
                    </InputGroup.Text>
                    <Form.Control 
                      placeholder="Search citizen name..."
                      value={searchQuery}
                      onChange={handleCitizenSearch}
                      className="border-0 py-4 fs-8 fw-bold"
                      autoFocus
                    />
                  </InputGroup>
                </div>

                <div className="bg-white rounded-4 border border-translucent shadow-sm overflow-hidden" style={{ minHeight: '300px', maxHeight: '50vh' }}>
                  <div className="scrollbar h-100">
                    {searching ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-3 fw-bold text-body-tertiary">Searching database...</div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {searchResults.map(citizen => (
                          <button 
                            key={citizen.id}
                            className="list-group-item list-group-item-action p-4 border-bottom d-flex align-items-center justify-content-between kiosk-list-btn"
                            onClick={() => handleCitizenSelect(citizen)}
                            disabled={processing}
                          >
                            <div className="d-flex align-items-center gap-4">
                              <div className="avatar avatar-xl">
                                {citizen.photoUrl ? (
                                  <img src={citizen.photoUrl} alt="" className="rounded-circle shadow-sm object-fit-cover" />
                                ) : (
                                  <div className="avatar-name rounded-circle bg-primary-subtle text-primary fw-bolder fs-8">
                                    {citizen.firstName.charAt(0)}{citizen.lastName.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="text-start">
                                <div className="fw-bolder fs-8 text-body-highlight text-uppercase">{citizen.firstName} {citizen.lastName}</div>
                                <div className="fs-10 text-body-tertiary fw-bold text-uppercase">{citizen.barangay}</div>
                              </div>
                            </div>
                            <div className="kiosk-btn-circle bg-light text-primary">
                              <FontAwesomeIcon icon={faChevronRight} />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery.length >= 2 ? (
                      <div className="text-center py-5 text-body-tertiary">
                        <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
                        <h4 className="fw-bolder">NO CITIZENS FOUND</h4>
                        <p className="mb-0">Please check the spelling and try again.</p>
                      </div>
                    ) : (
                      <div className="text-center py-5 text-body-tertiary">
                        <FontAwesomeIcon icon={faUserPlus} size="3x" className="mb-3 opacity-25" />
                        <h4 className="fw-bolder">READY TO SEARCH</h4>
                        <p className="mb-0">Start typing the citizen's name above.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-5 text-center">
                  <Button variant="outline-danger" className="rounded-pill px-4 fw-bold" onClick={() => setStep('VERIFY_IDENTITY')}>
                    CANCEL OVERRIDE
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === 'SUCCESS' && lastActionResult && (
              <div className="animate-fade-in text-center">
                <div className="success-check-container mb-5">
                  <div className="success-check-bg"></div>
                  <div className="kiosk-icon-circle-xl bg-success text-white shadow-lg position-relative z-index-1">
                    <FontAwesomeIcon icon={faCheckCircle} size="4x" />
                  </div>
                </div>
                <div className={`display-3 fw-bolder mb-3 text-uppercase ${lastActionResult.type === 'IN' ? 'text-success' : 'text-warning'}`}>
                  {lastActionResult.type === 'IN' ? 'WELCOME!' : 'THANK YOU!'}
                </div>
                <div className="bg-light-subtle p-5 rounded-4 border border-translucent shadow-sm max-w-sm mx-auto">
                  <div className="avatar avatar-5xl mb-4 mx-auto">
                    {lastActionResult.citizen.photoUrl ? (
                      <img src={lastActionResult.citizen.photoUrl} alt="" className="rounded-circle shadow-sm border border-2 border-white object-fit-cover" />
                    ) : (
                      <div className="avatar-name rounded-circle bg-primary text-white display-5 fw-bolder shadow-sm">
                        {lastActionResult.citizen.firstName.charAt(0)}{lastActionResult.citizen.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h1 className="fw-bolder text-body-highlight mb-2 text-uppercase">{lastActionResult.citizen.firstName} {lastActionResult.citizen.lastName}</h1>
                  <p className="fs-7 text-body-tertiary fw-bold text-uppercase mb-4">{lastActionResult.citizen.barangay}</p>
                  
                  <div className="alert alert-subtle-success border-0 py-3 rounded-3">
                    <h5 className="mb-0 fw-bold">
                      {lastActionResult.type === 'IN' 
                        ? `TIMED IN: ${lastActionResult.deptName}`
                        : `TIMED OUT: ${lastActionResult.deptName}`}
                    </h5>
                  </div>
                  
                  <div className="mt-5 fs-10 text-body-tertiary fw-bold ls-1 text-uppercase">
                    SYSTEM WILL RESET IN 5 SECONDS
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Enhanced Footer / Progress Indicator */}
        <div className="p-4 border-top bg-light-subtle d-flex justify-content-between align-items-center kiosk-footer">
          <div className="d-flex gap-2">
            {[1, 2, 3].map((i) => {
              const currentStepIdx = ['VERIFY_IDENTITY', 'SCAN_ACTION', 'MANUAL_AUTH', 'MANUAL_SEARCH', 'SELECT_DEPT', 'SELECT_SERVICE', 'SUCCESS'].indexOf(step);
              let isActive = false;
              if (i === 1) isActive = true; // Always verified identity first
              if (i === 2 && ['SELECT_DEPT', 'SELECT_SERVICE', 'SUCCESS'].includes(step)) isActive = true;
              if (i === 3 && ['SELECT_SERVICE', 'SUCCESS'].includes(step)) isActive = true;
              
              return (
                <div 
                  key={i} 
                  className={`kiosk-progress-bar ${isActive ? 'active' : ''}`}
                ></div>
              );
            })}
          </div>
          <div className="fs-9 fw-bolder text-body-tertiary text-uppercase ls-1">
            {step.replace('_', ' ')}
          </div>
        </div>
      </Container>

      <style>{`
        .kiosk-container { font-family: 'Public Sans', sans-serif; letter-spacing: -0.01em; }
        .letter-spacing-tight { letter-spacing: -0.05em; }
        .ls-1 { letter-spacing: 0.1em; }
        .z-index-1000 { z-index: 1000; }
        .bg-white-20 { background: rgba(255, 255, 255, 0.2); }
        .bg-white-80 { background: rgba(255, 255, 255, 0.85); }
        .backdrop-blur { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .transition-all { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .cursor-not-allowed { cursor: not-allowed; }
        .max-w-sm { max-width: 500px; }
        
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

        .kiosk-card {
          background: #ffffff;
          border: 2px solid var(--phoenix-border-color-translucent) !important;
        }
        .kiosk-card:hover:not(:disabled) {
          transform: translateY(-8px);
          border-color: var(--phoenix-primary) !important;
          box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.08) !important;
        }
        .kiosk-card:active:not(:disabled) { transform: translateY(-2px); }

        .kiosk-list-item:hover {
          transform: translateX(8px);
          box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.05) !important;
        }
        .kiosk-list-btn:hover { background-color: var(--phoenix-primary-subtle); }

        .kiosk-icon-circle { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 24px; }
        .kiosk-icon-circle-sm { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
        .kiosk-icon-circle-lg { width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; border-radius: 36px; }
        .kiosk-icon-circle-xl { width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .kiosk-btn-circle { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }

        .kiosk-progress-bar { width: 60px; height: 8px; border-radius: 4px; background: var(--phoenix-border-color-translucent); transition: all 0.4s; }
        .kiosk-progress-bar.active { background: var(--phoenix-primary); width: 100px; }

        .scan-ripple-container { position: relative; width: 200px; height: 200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
        .scan-ripple { position: absolute; width: 100%; height: 100%; border: 4px solid var(--phoenix-primary); border-radius: 50%; opacity: 0; animation: ripple 3s infinite; }
        .scan-ripple.delay-1 { animation-delay: 1s; }
        .scan-ripple.delay-2 { animation-delay: 2s; }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .success-check-container { position: relative; width: 180px; height: 180px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
        .success-check-bg { position: absolute; width: 100%; height: 100%; background: var(--phoenix-success-subtle); border-radius: 50%; animation: success-grow 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes success-grow { from { transform: scale(0); } to { transform: scale(1.5); } }
      `}</style>
    </div>
  );
};

export default DepartmentKiosk;
