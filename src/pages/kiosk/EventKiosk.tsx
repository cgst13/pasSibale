import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Badge, Spinner, Modal, Form, Button, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarCheck, faClock, faUser, faArrowLeft, faCheckCircle, 
  faWifi, faQrcode, faFingerprint, faSignOut, faAddressCard,
  faMapMarkerAlt, faInfoCircle, faCalendarAlt, faUserShield,
  faSearch, faUserPlus, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useScannerContext } from 'providers/ScannerProvider';
import { useKioskMode } from 'providers/KioskModeProvider';
import { getCitizenByToken, searchCitizens } from 'services/citizenService';
import { recordAttendance, getAttendanceByEvent } from 'services/eventsService';
import { Citizen } from 'types/citizen';
import { EventAttendance } from 'types/events';
import { toast } from 'react-hot-toast';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import { Link } from 'react-router';
import { supabase } from 'services/supabaseClient';
import { useOfflineMode } from 'providers/OfflineModeProvider';
import { db } from 'services/offlineDb';
import logo from 'assets/img/icons/logo.png';

import bcrypt from 'bcryptjs';

type EventKioskStep = 'VERIFY_IDENTITY' | 'SCAN_ACTION' | 'MANUAL_AUTH' | 'MANUAL_SEARCH' | 'SUCCESS';

const EventKiosk = () => {
  const { selectedEvent, exitEventMode, isEventMode } = useKioskMode();
  const { isOfflineMode } = useOfflineMode();
  const [step, setStep] = useState<EventKioskStep>('VERIFY_IDENTITY');
  const [scanMode, setScanMode] = useState<'qr' | 'nfc' | 'fingerprint' | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [attendanceList, setAttendanceList] = useState<EventAttendance[]>([]);
  
  const [currentCitizen, setCurrentCitizen] = useState<Citizen | null>(null);
  const [lastActionResult, setLastActionResult] = useState<{ 
    type: 'IN' | 'OUT' | 'PRESENT', 
    citizen: Citizen, 
    label?: string 
  } | null>(null);

  const { lastScan, connected } = useScannerContext();
  
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
    if (selectedEvent) {
      fetchAttendance();
    }
  }, [selectedEvent]);

  const fetchAttendance = async () => {
    if (!selectedEvent) return;
    try {
      setLoading(true);
      const data = await getAttendanceByEvent(selectedEvent.id);
      setAttendanceList(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleExitKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    setExiting(true);
    const success = await exitEventMode(exitPassword);
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

  const handleCitizenSelect = async (citizen: Citizen) => {
    setProcessing(true);
    await processAttendance(citizen);
    setProcessing(false);
  };

  const processAttendance = async (citizen: Citizen) => {
    if (!selectedEvent) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const nowISO = now.toISOString();

    const existingAttendance = attendanceList.find(a => a.citizen_id === citizen.id);
    let newLogs = existingAttendance?.logs ? [...existingAttendance.logs] : [];
    let status = existingAttendance?.status || 'Present';
    let timeIn = existingAttendance?.time_in;
    let timeOut = existingAttendance?.time_out;
    let resultType: 'IN' | 'OUT' | 'PRESENT' = 'PRESENT';
    let resultLabel = '';

    // Check if event has configuration
    if (selectedEvent.attendance_config && selectedEvent.attendance_config.length > 0) {
        const inSlot = selectedEvent.attendance_config.find(slot => 
            currentTime >= slot.time_in_start && currentTime <= slot.time_in_end
        );
        const outSlot = selectedEvent.attendance_config.find(slot => 
            currentTime >= slot.time_out_start && currentTime <= slot.time_out_end
        );

        if (!inSlot && !outSlot) {
            toast.error(`Not currently in any allowed attendance period. (Time: ${currentTime})`);
            return;
        }

        let actionTaken = false;

        // Try Time Out first
        if (outSlot) {
            const logIndex = newLogs.findIndex(l => l.slot_id === outSlot.id);
            if (logIndex >= 0) {
                if (!newLogs[logIndex].time_out) {
                    newLogs[logIndex].time_out = nowISO;
                    timeOut = nowISO;
                    actionTaken = true;
                    resultType = 'OUT';
                    resultLabel = outSlot.label;
                } else if (!inSlot) {
                     toast.error(`Already timed out for ${outSlot.label}`);
                     return;
                }
            } else if (!inSlot) {
                newLogs.push({ slot_id: outSlot.id, time_out: nowISO });
                timeOut = nowISO;
                if (timeIn === undefined) timeIn = null;
                actionTaken = true;
                resultType = 'OUT';
                resultLabel = outSlot.label;
            }
        }

        // Try Time In if no action yet
        if (!actionTaken && inSlot) {
            const logIndex = newLogs.findIndex(l => l.slot_id === inSlot.id);
            if (logIndex === -1) {
                newLogs.push({ slot_id: inSlot.id, time_in: nowISO });
                if (!timeIn) timeIn = nowISO;
                actionTaken = true;
                resultType = 'IN';
                resultLabel = inSlot.label;
            } else {
                 if (!newLogs[logIndex].time_out) {
                     toast.error(`Already Timed In for ${inSlot.label}`);
                     return;
                 } else {
                     toast.error(`Already completed ${inSlot.label}`);
                     return;
                 }
            }
        }

        if (!actionTaken) return;
    } else {
        // Simple Present behavior
        if (existingAttendance) {
             if (!existingAttendance.time_out) {
                 timeOut = nowISO;
                 resultType = 'OUT';
             } else {
                 toast.error('Already Timed Out');
                 return;
             }
        } else {
            timeIn = nowISO;
            resultType = 'IN';
        }
    }

    try {
        setProcessing(true);
        const payload = {
            event_id: selectedEvent.id,
            citizen_id: citizen.id,
            status: status as 'Present' | 'Absent' | 'Late' | 'Excused',
            time_in: timeIn,
            time_out: timeOut,
            logs: newLogs,
            remarks: existingAttendance?.remarks || ''
        };

        const saved = await recordAttendance(payload);
        
        // Update local state
        setAttendanceList(prev => {
            const exists = prev.some(a => a.citizen_id === citizen.id);
            if (exists) {
                return prev.map(a => a.citizen_id === citizen.id ? { ...saved, citizen: citizen as any } : a);
            } else {
                return [{ ...saved, citizen: citizen as any }, ...prev];
            }
        });

        setLastActionResult({ type: resultType, citizen, label: resultLabel });
        setStep('SUCCESS');
    } catch (error) {
        console.error(error);
        toast.error('Failed to record attendance');
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
      await processAttendance(citizen);
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  }, [step, processing, scanMode, attendanceList]);

  useEffect(() => {
    if (lastScan && lastScan.timestamp > mountTime) {
      handleScan(lastScan.value, lastScan.type);
    }
  }, [lastScan, mountTime, handleScan]);

  const resetKiosk = () => {
    setStep('VERIFY_IDENTITY');
    setScanMode(null);
    setCurrentCitizen(null);
  };

  useEffect(() => {
    if (step === 'SUCCESS') {
      const timer = setTimeout(resetKiosk, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (!selectedEvent) return <div className="p-5 text-center">No event selected</div>;
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
            <Button 
              variant="subtle-danger" 
              size="sm" 
              className="rounded-pill px-3 fw-bold fs-10 border-0 shadow-none" 
              onClick={() => setShowExitModal(true)}
            >
              <FontAwesomeIcon icon={faSignOut} className="me-2" /> EXIT EVENT MODE
            </Button>
          </div>

          <div className="d-none d-lg-flex align-items-center gap-2 animate-fade-in ms-3 border-start ps-3">
            <div className="d-flex align-items-center px-3 py-1 bg-primary-subtle rounded-pill border border-primary-subtle shadow-sm">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2 fs-11" />
              <span className="fs-10 fw-bold text-primary text-uppercase">{selectedEvent.title}</span>
            </div>
            {selectedEvent.location && (
              <div className="d-flex align-items-center px-3 py-1 bg-info-subtle rounded-pill border border-info-subtle shadow-sm">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-info me-2 fs-11" />
                <span className="fs-10 fw-bold text-info text-uppercase">{selectedEvent.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-4">
          <div className="text-end d-none d-md-block">
            <div className="fs-11 text-body-tertiary fw-bold text-uppercase ls-1 mb-0 opacity-75">Event Station</div>
            <div className="fw-bolder fs-10 text-primary">EV-01</div>
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
          <p className="text-body-secondary mb-4">Enter administrator password to exit Event Mode.</p>
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

      {/* Main Content Area */}
      <Container fluid className="flex-grow-1 p-0 d-flex flex-column kiosk-main">
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          
          <div className="w-100" style={{ maxWidth: '1200px' }}>
            
            {step === 'VERIFY_IDENTITY' && (
              <div className="animate-fade-in text-center">
                <div className="mb-5">
                  <Badge bg="primary-subtle" className="text-primary px-3 py-2 rounded-pill mb-3 fs-10 border border-primary-subtle shadow-none">
                    EVENT ATTENDANCE SYSTEM
                  </Badge>
                  <div className="display-4 fw-bolder text-primary mb-2">VERIFY YOUR IDENTITY</div>
                  <p className="fs-7 text-body-tertiary">Please scan your ID to record your attendance for <strong>{selectedEvent.title}</strong>.</p>
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

                {selectedEvent.attendance_config && selectedEvent.attendance_config.length > 0 && (
                  <div className="mt-5 pt-4">
                    <h6 className="fs-10 text-uppercase fw-bold text-body-tertiary ls-1 mb-3">Attendance Windows</h6>
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      {selectedEvent.attendance_config.map(slot => (
                        <Badge key={slot.id} bg="light" className="text-body-highlight border px-3 py-2 rounded-pill fs-11">
                          <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                          {slot.label}: {slot.time_in_start}-{slot.time_in_end} / {slot.time_out_start}-{slot.time_out_end}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step: Manual Auth */}
            {step === 'MANUAL_AUTH' && (
              <div className="animate-fade-in text-center">
                <div className="kiosk-icon-circle-lg bg-warning-subtle text-warning mx-auto mb-4">
                  <FontAwesomeIcon icon={faUserShield} size="3x" />
                </div>
                <div className="display-5 fw-bolder mb-2 text-uppercase">STAFF VERIFICATION</div>
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
                    <Button variant="link" className="text-secondary fw-bold text-uppercase" onClick={() => setStep('VERIFY_IDENTITY')}>
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
                  <div className="display-5 fw-bolder text-primary mb-2 text-uppercase">MANUAL CITIZEN SEARCH</div>
                  <p className="text-body-secondary">Search by name for manual attendance recording.</p>
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
                        <h4 className="fw-bolder text-uppercase">NO CITIZENS FOUND</h4>
                        <p className="mb-0">Please check the spelling and try again.</p>
                      </div>
                    ) : (
                      <div className="text-center py-5 text-body-tertiary">
                        <FontAwesomeIcon icon={faUserPlus} size="3x" className="mb-3 opacity-25" />
                        <h4 className="fw-bolder text-uppercase">READY TO SEARCH</h4>
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

            {step === 'SUCCESS' && lastActionResult && (
              <div className="animate-fade-in text-center">
                <div className="success-check-container mb-5">
                  <div className="success-check-bg"></div>
                  <div className="kiosk-icon-circle-xl bg-success text-white shadow-lg position-relative z-index-1">
                    <FontAwesomeIcon icon={faCheckCircle} size="4x" />
                  </div>
                </div>
                <div className={`display-3 fw-bolder mb-3 text-uppercase ${lastActionResult.type === 'IN' ? 'text-success' : lastActionResult.type === 'OUT' ? 'text-warning' : 'text-primary'}`}>
                  {lastActionResult.type === 'IN' ? 'CHECKED IN!' : lastActionResult.type === 'OUT' ? 'CHECKED OUT!' : 'PRESENT!'}
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
                  
                  <div className={`alert alert-subtle-${lastActionResult.type === 'IN' ? 'success' : lastActionResult.type === 'OUT' ? 'warning' : 'primary'} border-0 py-3 rounded-3`}>
                    <h5 className="mb-0 fw-bold">
                      {lastActionResult.label ? `${lastActionResult.label}: ` : ''}
                      {lastActionResult.type === 'IN' ? 'TIME IN RECORDED' : lastActionResult.type === 'OUT' ? 'TIME OUT RECORDED' : 'ATTENDANCE LOGGED'}
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

        {/* Footer */}
        <div className="p-4 border-top bg-light-subtle d-flex justify-content-between align-items-center kiosk-footer">
          <div className="d-flex align-items-center gap-3">
             <div className="bg-white p-2 rounded-2 border shadow-none">
                <img src={logo} alt="Logo" width="24" />
             </div>
             <div>
                <div className="fs-10 fw-bolder text-body-highlight text-uppercase mb-0">PASSI BALE EVENTS</div>
                <div className="fs-11 text-body-tertiary fw-bold">Municipal Hall Activity Tracking</div>
             </div>
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

        .kiosk-icon-circle-lg { width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; border-radius: 36px; }
        .kiosk-icon-circle-xl { width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }

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

        .avatar-5xl { width: 140px; height: 140px; }
      `}</style>
    </div>
  );
};

export default EventKiosk;
