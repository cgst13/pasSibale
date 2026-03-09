import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Col, Row, Table, Form, Badge, InputGroup, Tabs, Tab, Modal, Dropdown } from 'react-bootstrap';
import { useParams, Link } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faTimes, faClock, faUserPlus, faSave, faQrcode, faIdCard, faFingerprint, faSearch, faTrash, faPrint, faFilter, faMapMarkerAlt, faMobileAlt, faExpand, faWifi } from '@fortawesome/free-solid-svg-icons';
import AsyncSelect from 'react-select/async';
import { getEvent, getAttendanceByEvent, recordAttendance, deleteAttendance, updateEvent } from 'services/eventsService';
import { supabase } from 'services/supabaseClient';
import { searchCitizens, getCitizenByToken } from 'services/citizenService';
import { Event, EventAttendance as AttendanceType } from 'types/events';
import { toast } from 'react-hot-toast';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import PasSibaleLoader from 'components/common/PasSibaleLoader';
import DevicePairingModal from 'components/common/DevicePairingModal';
import { useScannerContext } from 'providers/ScannerProvider';

const EventAttendance = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [authToken, setAuthToken] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const automatedInputRef = useRef<HTMLInputElement>(null);
  
  const { lastScan, connected } = useScannerContext();
  const [mountTime] = useState(Date.now());

  useEffect(() => {
    if (lastScan && lastScan.timestamp > mountTime) {
        handleMobileScan(lastScan.value, lastScan.type);
    }
  }, [lastScan, mountTime]);

  // New States for Search, Filter, and Pagination (if needed)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'automated' && automatedInputRef.current) {
      automatedInputRef.current.focus();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let [eventData, attendanceData] = await Promise.all([
        getEvent(id!),
        getAttendanceByEvent(id!)
      ]);

      // Auto-update event status based on date
      if (eventData) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const startDate = eventData.start_date;
        const endDate = eventData.end_date || eventData.start_date;
        
        let newStatus = eventData.status;

        if (today < startDate) {
            newStatus = 'Upcoming';
        } else if (today > endDate) {
            newStatus = 'Completed';
        } else {
            newStatus = 'Ongoing';
        }

        if (newStatus !== eventData.status) {
            try {
                await updateEvent(eventData.id, { status: newStatus });
                eventData.status = newStatus;
                // toast.success(`Event status auto-updated to ${newStatus}`);
            } catch (err) {
                console.error("Failed to auto-update status", err);
            }
        }
      }

      setEvent(eventData);
      setAttendanceList(attendanceData || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCitizenOptions = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      const citizens = await searchCitizens(inputValue);
      return citizens.map(c => ({
        label: `${c.firstName} ${c.lastName} ${c.middleName ? c.middleName + ' ' : ''}${c.suffix || ''}`,
        value: c.id,
        citizen: c
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleProcessAttendance = async (citizen: any) => {
    if (!event) return;

    // Strict Status Check
    if (event.status === 'Upcoming') {
        toast.error('Cannot take attendance: Event is upcoming.');
        return;
    }
    if (event.status === 'Completed' || event.status === 'Cancelled') {
         toast.error(`Cannot take attendance: Event is ${event.status.toLowerCase()}.`);
         return;
    }
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const nowISO = now.toISOString();

    const existingAttendance = attendanceList.find(a => a.citizen_id === citizen.id);
    let newLogs = existingAttendance?.logs ? [...existingAttendance.logs] : [];
    let status = existingAttendance?.status || 'Present';
    let timeIn = existingAttendance?.time_in;
    let timeOut = existingAttendance?.time_out;

    // Check if event has configuration
    if (event.attendance_config && event.attendance_config.length > 0) {
        // Find matching slots
        const inSlot = event.attendance_config.find(slot => 
            currentTime >= slot.time_in_start && currentTime <= slot.time_in_end
        );
        const outSlot = event.attendance_config.find(slot => 
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
                    // Time Out
                    newLogs[logIndex].time_out = nowISO;
                    timeOut = nowISO; // Update latest time out
                    actionTaken = true;
                    toast.success(`Timed Out for ${outSlot.label}`);
                } else if (!inSlot) {
                     // Already timed out and not in a new In slot
                     toast.error(`Already timed out for ${outSlot.label}`);
                     return;
                }
            } else if (!inSlot) {
                // Trying to time out but never timed in - ALLOW IT per user request
                newLogs.push({
                    slot_id: outSlot.id,
                    time_out: nowISO
                });
                timeOut = nowISO;
                // If this is the first record (no time_in), explicitly set it to null to avoid DEFAULT NOW()
                if (timeIn === undefined) {
                    timeIn = null;
                }
                actionTaken = true;
                toast.success(`Timed Out for ${outSlot.label} (No Time In)`);
            }
        }

        // Try Time In if no action yet
        if (!actionTaken && inSlot) {
            const logIndex = newLogs.findIndex(l => l.slot_id === inSlot.id);
            if (logIndex === -1) {
                // Time In
                newLogs.push({
                    slot_id: inSlot.id,
                    time_in: nowISO
                });
                if (!timeIn) {
                    timeIn = nowISO;
                }
                actionTaken = true;
                toast.success(`Timed In for ${inSlot.label}`);
            } else {
                 if (!newLogs[logIndex].time_out) {
                     toast.error(`Already Timed In for ${inSlot.label}`);
                     return;
                 } else {
                     // Already completed this slot
                     toast.error(`Already completed ${inSlot.label}`);
                     return;
                 }
            }
        }

        if (!actionTaken) return; // Should have been caught by earlier checks

    } else {
        // Legacy / No Config behavior
        if (existingAttendance) {
             if (!existingAttendance.time_out) {
                 timeOut = nowISO;
                 toast.success('Timed Out');
             } else {
                 toast.error('Already Timed Out');
                 return;
             }
        } else {
            // New Time In
            timeIn = nowISO;
            toast.success('Timed In');
        }
    }

    try {
        setAdding(true);
        const payload = {
            event_id: event.id,
            citizen_id: citizen.id,
            status: status,
            time_in: timeIn,
            time_out: timeOut,
            logs: newLogs,
            remarks: existingAttendance?.remarks || ''
        };

        const saved = await recordAttendance(payload);
        
        // Enrich with citizen data for display if it's new
        const enrichedSaved = {
            ...saved,
            citizen: existingAttendance?.citizen || {
                firstName: citizen.firstName,
                lastName: citizen.lastName,
                middleName: citizen.middleName,
                suffix: citizen.suffix,
                barangay: citizen.barangay
            }
        };

        setAttendanceList(prev => {
            const exists = prev.some(a => a.citizen_id === citizen.id);
            if (exists) {
                return prev.map(a => a.citizen_id === citizen.id ? enrichedSaved : a);
            } else {
                return [enrichedSaved, ...prev];
            }
        });
    } catch (error) {
        console.error(error);
        toast.error('Failed to record attendance');
    } finally {
        setAdding(false);
    }
  };

  const handleAddAttendee = (option: any) => {
      if (option && option.citizen) {
          handleProcessAttendance(option.citizen);
      }
  };

  const processToken = async (token: string) => {
    if (!token) return;
    try {
      setAdding(true);
      const citizen = await getCitizenByToken(token);
      setAdding(false);
      
      if (!citizen) {
        toast.error('Citizen not found or invalid token');
        return;
      }
      await handleProcessAttendance(citizen);
    } catch (error) {
      setAdding(false);
      console.error(error);
      toast.error('Error processing token');
    }
  };

  const handleAutomatedSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authToken.trim()) return;

    await processToken(authToken.trim());
    setAuthToken('');
    
    // Refocus for continuous scanning
    setTimeout(() => {
      if (automatedInputRef.current) automatedInputRef.current.focus();
    }, 100);
  };

  const handleMobileScan = (value: string, type: 'qr' | 'nfc' | 'fingerprint') => {
    if (type === 'fingerprint') {
        toast.error('Remote fingerprint scanning is not fully supported yet.');
        return;
    }
    processToken(value);
  };

  const handleDeleteClick = (id: string) => {
      setDeleteTargetId(id);
      setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
      if (!deleteTargetId || !confirmPassword) return;
      
      setDeleting(true);
      try {
          // Verify password
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !user.email) {
              toast.error('User not identified');
              return;
          }

          const { error: authError } = await supabase.auth.signInWithPassword({
              email: user.email,
              password: confirmPassword
          });

          if (authError) {
              toast.error('Incorrect password');
              setDeleting(false);
              return;
          }

          // Proceed to delete
          await deleteAttendance(deleteTargetId);
          
          setAttendanceList(prev => prev.filter(a => a.id !== deleteTargetId));
          toast.success('Attendance record deleted');
          setShowDeleteModal(false);
          setConfirmPassword('');
          setDeleteTargetId(null);
      } catch (error) {
          console.error(error);
          toast.error('Failed to delete record');
      } finally {
          setDeleting(false);
      }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', url: '/' },
    { label: 'Events', url: '/events' },
    { label: 'Attendance', active: true }
  ];

  if (loading) return <PasSibaleLoader />;
  if (!event) return <div className="p-5 text-center">Event not found</div>;

  const hasConfig = event.attendance_config && event.attendance_config.length > 0;

  // Filter Logic
  const uniqueBarangays = Array.from(new Set(attendanceList
      .map(a => a.citizen?.barangay)
      .filter((b): b is string => !!b)
  )).sort();

  const filteredAttendanceList = attendanceList.filter(a => {
      const citizenName = `${a.citizen?.firstName || ''} ${a.citizen?.lastName || ''} ${a.citizen?.middleName || ''}`.toLowerCase();
      const matchesSearch = searchTerm === '' || citizenName.includes(searchTerm.toLowerCase());
      const matchesBarangay = filterBarangay === '' || a.citizen?.barangay === filterBarangay;
      return matchesSearch && matchesBarangay;
  });

  const handlePrintAll = () => {
      setSearchTerm('');
      setFilterBarangay('');
      setTimeout(() => {
          window.print();
      }, 500);
  };

  const handlePrintByBarangay = () => {
      // If no barangay is selected, maybe prompt or just print current view (which includes all if none selected)
      // The requirement says "Print By Barangay", implying we might want to ensure a filter is active or just rename the "Current View" action.
      // Since "Current View" respects the filter, renaming it is sufficient if the user just wants to print what they see (filtered by barangay).
      // However, if they want to iterate through all, that's complex. 
      // Assuming user selects a barangay then clicks "Print By Barangay".
      window.print();
  };

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .d-print-none { display: none !important; }
          .d-print-block { display: block !important; }
          .card { border: none !important; box-shadow: none !important; }
          .table-responsive { overflow: visible !important; }
        }
      `}</style>

      <div className="d-print-none">
          <PageBreadcrumb items={breadcrumbItems} />
      </div>

      <div className="mb-9">
        <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
          <div>
              <div className="d-flex align-items-center gap-3">
                  <h2 className="mb-0">Event Attendance</h2>
                  <Badge bg={event.status === 'Upcoming' ? 'info' : event.status === 'Ongoing' ? 'success' : 'secondary'} className="fs-9">
                      {event.status}
                  </Badge>
              </div>
              <div className="text-body-secondary mt-2 fs-9">
                  <span className="fw-bold text-body-highlight">{event.title}</span>
                  <span className="mx-2">•</span>
                  <FontAwesomeIcon icon={faClock} className="me-1" /> {new Date(event.start_date).toLocaleDateString()}
                  {event.location && (
                      <>
                          <span className="mx-2">•</span>
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" /> {event.location}
                      </>
                  )}
                  <span className="mx-2">•</span>
                  <strong>{filteredAttendanceList.length}</strong> Attendees
              </div>
          </div>
          <Button as={Link} to="/events" variant="outline-secondary" size="sm">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to List
          </Button>
        </div>

        <Row className="g-3 mb-4">
            <Col xs={12} lg={3} className="d-print-none">
                <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="p-3">
                        <h6 className="mb-3 text-body-secondary">Register Attendee</h6>
                        
                        {event.status !== 'Ongoing' && (
                            <div className="alert alert-warning py-2 px-3 fs-10 mb-3">
                                <FontAwesomeIcon icon={faTimes} className="me-2" />
                                Event is <strong>{event.status}</strong>.
                            </div>
                        )}

                        <Tabs
                          activeKey={activeTab}
                          onSelect={(k) => setActiveTab(k || 'manual')}
                          className="mb-3 small-tabs"
                          fill
                          variant="pills"
                        >
                          <Tab eventKey="manual" title={<span className="fs-10"><FontAwesomeIcon icon={faSearch} className="me-1" />Search</span>} disabled={event.status !== 'Ongoing'}>
                            <Form.Group className="mb-2">
                                <AsyncSelect
                                    cacheOptions
                                    defaultOptions
                                    loadOptions={loadCitizenOptions}
                                    onChange={handleAddAttendee}
                                    placeholder="Search name..."
                                    isLoading={adding}
                                    value={null}
                                    isDisabled={event.status !== 'Ongoing'}
                                    styles={{
                                        control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.875rem' }),
                                        valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                                        input: (base) => ({ ...base, margin: 0, padding: 0 }),
                                    }}
                                />
                            </Form.Group>
                          </Tab>
                          <Tab eventKey="automated" title={<span className="fs-10"><FontAwesomeIcon icon={faQrcode} className="me-1" />Scan</span>} disabled={event.status !== 'Ongoing'}>
                             <div className="d-grid mb-3">
                                {!connected ? (
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm" 
                                      className="mb-2"
                                      onClick={() => setShowPairingModal(true)}
                                      disabled={adding || event.status !== 'Ongoing'}
                                    >
                                      <FontAwesomeIcon icon={faMobileAlt} className="me-2" />
                                      Use Phone as Scanner
                                    </Button>
                                ) : (
                                    <div className="alert alert-success py-2 px-3 fs-10 mb-2 d-flex align-items-center justify-content-between">
                                        <span>
                                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                                            Mobile Connected
                                        </span>
                                        <Button 
                                            variant="link" 
                                            size="sm" 
                                            className="p-0 text-success fs-10"
                                            onClick={() => setShowPairingModal(true)}
                                        >
                                            Change
                                        </Button>
                                    </div>
                                )}
                             </div>

                             <div className="d-flex flex-column gap-2 mb-3">
                                <h6 className="fs-10 text-body-tertiary mb-1">Hands-Free Mode</h6>
                                <Button 
                                    as={Link} 
                                    to={`/events/attendance/scanner/${id}?mode=qr`} 
                                    variant="phoenix-primary" 
                                    size="sm"
                                    className="d-flex align-items-center justify-content-between"
                                >
                                    <span><FontAwesomeIcon icon={faQrcode} className="me-2" />QR Auto-Scan</span>
                                    <FontAwesomeIcon icon={faExpand} />
                                </Button>
                                <Button 
                                    as={Link} 
                                    to={`/events/attendance/scanner/${id}?mode=nfc`} 
                                    variant="phoenix-info" 
                                    size="sm"
                                    className="d-flex align-items-center justify-content-between"
                                >
                                    <span><FontAwesomeIcon icon={faWifi} className="me-2" />NFC Auto-Tap</span>
                                    <FontAwesomeIcon icon={faExpand} />
                                </Button>
                                <Button 
                                    as={Link} 
                                    to={`/events/attendance/scanner/${id}?mode=fingerprint`} 
                                    variant="phoenix-secondary" 
                                    size="sm"
                                    className="d-flex align-items-center justify-content-between disabled"
                                    disabled
                                >
                                    <span><FontAwesomeIcon icon={faFingerprint} className="me-2" />Fingerprint Scan</span>
                                    <FontAwesomeIcon icon={faExpand} />
                                </Button>
                             </div>

                             <Form onSubmit={handleAutomatedSubmit}>
                                <Form.Group className="mb-2">
                                    <InputGroup size="sm">
                                        <InputGroup.Text>
                                            <FontAwesomeIcon icon={faQrcode} />
                                        </InputGroup.Text>
                                        <Form.Control
                                            ref={automatedInputRef}
                                            type="text"
                                            placeholder="Scan ID..."
                                            value={authToken}
                                            onChange={(e) => setAuthToken(e.target.value)}
                                            disabled={adding || event.status !== 'Ongoing'}
                                            autoComplete="off"
                                        />
                                        <Button variant="primary" type="submit" disabled={adding || !authToken.trim() || event.status !== 'Ongoing'}>
                                            {adding ? '...' : <FontAwesomeIcon icon={faCheck} />}
                                        </Button>
                                    </InputGroup>
                                </Form.Group>
                             </Form>
                          </Tab>
                        </Tabs>

                        {hasConfig && (
                            <div className="mt-3 pt-3 border-top">
                                <strong className="fs-10 text-body-tertiary d-block mb-1">Active Schedule</strong>
                                <ul className="list-unstyled mb-0">
                                    {event.attendance_config!.map(slot => (
                                        <li key={slot.id} className="fs-10 text-muted mb-1">
                                            <Badge bg="light" text="dark" className="border me-1">{slot.label}</Badge>
                                            {slot.time_in_start}-{slot.time_in_end} / {slot.time_out_start}-{slot.time_out_end}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
            
            <Col xs={12} lg={9}>
                <div id="printable-area">
                    {/* Print Header */}
                    <div className="d-none d-print-block mb-3">
                        <h3 className="mb-1">{event.title}</h3>
                        <div className="mb-3 text-muted">
                            <div><strong>Date:</strong> {new Date(event.start_date).toLocaleDateString()}</div>
                            {event.location && <div><strong>Location:</strong> {event.location}</div>}
                            <div><strong>Total Attendees:</strong> {filteredAttendanceList.length}</div>
                            {filterBarangay && <div><strong>Barangay:</strong> {filterBarangay}</div>}
                        </div>
                    </div>

                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className="bg-body-tertiary border-bottom px-3 py-2 d-flex justify-content-between align-items-center d-print-none">
                            <h6 className="mb-0 text-body-secondary">
                                Attendance List <span className="text-body-tertiary fw-normal">({filteredAttendanceList.length})</span>
                            </h6>
                            <div className="d-flex gap-2 d-print-none">
                                <InputGroup size="sm" style={{ width: '180px' }}>
                                    <InputGroup.Text className="bg-body-highlight"><FontAwesomeIcon icon={faSearch} className="fs-10" /></InputGroup.Text>
                                    <Form.Control 
                                        className="fs-10"
                                        placeholder="Search..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                                <Form.Select 
                                    size="sm" 
                                    style={{ width: '150px' }}
                                    className="fs-10"
                                    value={filterBarangay}
                                    onChange={(e) => setFilterBarangay(e.target.value)}
                                >
                                    <option value="">All Barangays</option>
                                    {uniqueBarangays.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </Form.Select>
                                
                                <Dropdown align="end">
                                    <Dropdown.Toggle variant="outline-secondary" size="sm" className="fs-10">
                                        <FontAwesomeIcon icon={faPrint} className="me-1" /> Print
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={handlePrintAll}>Print All</Dropdown.Item>
                                        <Dropdown.Item onClick={handlePrintByBarangay}>Print By Barangay</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead className="bg-body-tertiary">
                                    <tr>
                                        <th className="ps-3 py-2 fs-10 text-uppercase text-body-tertiary">Citizen</th>
                                        <th className="py-2 fs-10 text-uppercase text-body-tertiary">Status</th>
                                        {hasConfig ? (
                                            event.attendance_config!.map(slot => (
                                                <React.Fragment key={slot.id}>
                                                    <th className="py-2 text-nowrap fs-10 text-uppercase text-body-tertiary">{slot.label} In</th>
                                                    <th className="py-2 text-nowrap fs-10 text-uppercase text-body-tertiary">{slot.label} Out</th>
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <>
                                                <th className="py-2 fs-10 text-uppercase text-body-tertiary">Time In</th>
                                                <th className="py-2 fs-10 text-uppercase text-body-tertiary">Time Out</th>
                                            </>
                                        )}
                                        <th className="pe-3 py-2 text-end d-print-none fs-10 text-uppercase text-body-tertiary">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttendanceList.length === 0 ? (
                                        <tr>
                                            <td colSpan={hasConfig ? 4 : 5} className="text-center py-5 text-body-tertiary">
                                                No attendees found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAttendanceList.map(attendee => (
                                            <tr key={attendee.id}>
                                                <td className="ps-3 py-2">
                                                    <div className="fw-semibold text-body-highlight fs-9">
                                                        {attendee.citizen?.firstName} {attendee.citizen?.lastName}
                                                    </div>
                                                    <div className="text-body-tertiary fs-10">
                                                        {attendee.citizen?.barangay || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="py-2">
                                                    <Badge bg={
                                                        attendee.status === 'Present' ? 'success' : 
                                                        attendee.status === 'Late' ? 'warning' : 
                                                        attendee.status === 'Absent' ? 'danger' : 'secondary'
                                                    } className="fs-10">
                                                        {attendee.status}
                                                    </Badge>
                                                </td>
                                                {hasConfig ? (
                                                    event.attendance_config!.map(slot => {
                                                        const log = attendee.logs?.find(l => l.slot_id === slot.id);
                                                        return (
                                                            <React.Fragment key={slot.id}>
                                                                <td className="py-2 text-nowrap fs-10 text-body-secondary">
                                                                    {log?.time_in ? new Date(log.time_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                                                </td>
                                                                <td className="py-2 text-nowrap fs-10 text-body-secondary">
                                                                    {log?.time_out ? new Date(log.time_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    })
                                                ) : (
                                                    <>
                                                        <td className="py-2 fs-10 text-body-secondary">
                                                            {attendee.time_in ? new Date(attendee.time_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                                        </td>
                                                        <td className="py-2 fs-10 text-body-secondary">
                                                            {attendee.time_out ? new Date(attendee.time_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="pe-3 py-2 text-end d-print-none">
                                                    <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteClick(attendee.id)} size="sm">
                                                        <FontAwesomeIcon icon={faTrash} className="fs-10" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
                </div>
            </Col>
        </Row>
      </div>
      
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
              <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <p>Are you sure you want to delete this attendance record? This action cannot be undone.</p>
              <Form.Group>
                  <Form.Label>Enter your password to confirm:</Form.Label>
                  <Form.Control 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Password"
                  />
              </Form.Group>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting || !confirmPassword}>
                  {deleting ? 'Deleting...' : 'Delete'}
              </Button>
          </Modal.Footer>
      </Modal>
      <DevicePairingModal 
        show={showPairingModal} 
        onHide={() => setShowPairingModal(false)} 
        onScan={handleMobileScan} 
      />
    </div>
  );
};

export default EventAttendance;
