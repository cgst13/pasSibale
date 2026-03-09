import React, { useEffect, useState } from 'react';
import { Card, Col, Container, Row, Button, Form, InputGroup, Nav, Tab, Badge, Modal } from 'react-bootstrap';
import { useScannerContext } from 'providers/ScannerProvider';
import { QRCodeSVG } from 'qrcode.react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMobileAlt, faCheckCircle, faSpinner, faExclamationTriangle, 
  faRedo, faNetworkWired, faGlobe, faLock, faCopy, 
  faInfoCircle, faDesktop, faMobile, faPalette, faArrowsRotate,
  faCog, faWifi, faWindowMaximize, faCloudDownloadAlt, faCloudUploadAlt,
  faSync, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import ColorScheme from 'components/settings-panel/ColorScheme';
import RTLMode from 'components/settings-panel/RTLMode';
import NavigationType from 'components/settings-panel/NavigationType';
import VerticalNavbarAppearance from 'components/settings-panel/VerticalNavbarAppearance';
import HorizontalNavbarShape from 'components/settings-panel/HorizontalNavbarShape';
import TopNavbarAppearance from 'components/settings-panel/TopNavbarAppearance';
import { useSettingsPanelContext } from 'providers/SettingsPanelProvider';
import { useAppContext } from 'providers/AppProvider';
import { useOfflineMode } from 'providers/OfflineModeProvider';
import { RESET } from 'reducers/ConfigReducer';
import PageBreadcrumb from 'components/common/PageBreadcrumb';
import { ProgressBar } from 'react-bootstrap';

interface SettingsProps {
  section?: 'general' | 'connectivity' | 'offline' | 'interface';
}

const Settings = ({ section = 'general' }: SettingsProps) => {
  const activeTab = section;

  const { 
    isOfflineMode, 
    isDownloading, 
    downloadProgress, 
    pendingSyncCount,
    tableSummary,
    toggleOfflineMode,
    syncData
  } = useOfflineMode();

  const { 
    connected, 
    sessionId, 
    scannerUrl, 
    ipAddress, 
    setIpAddress, 
    startPairing, 
    disconnect, 
    deviceInfo, 
    isNative 
  } = useScannerContext();

  const { configDispatch } = useAppContext();
  const { settingsPanelConfig: { disableResetButton } } = useSettingsPanelContext();
  
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    setIsLocalhost(isLocal);
    setCurrentUrl(window.location.origin);
    
    if (!sessionId) {
        startPairing();
    }
  }, [sessionId, startPairing]);

  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIpAddress(e.target.value);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const [showOfflineAuthModal, setShowOfflineAuthModal] = useState(false);
  const [offlineAuthPassword, setOfflineAuthPassword] = useState('');

  const handleToggleOffline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!isOfflineMode) {
      if (!offlineAuthPassword) {
        setShowOfflineAuthModal(true);
        return;
      }
      await toggleOfflineMode(true, offlineAuthPassword);
      setShowOfflineAuthModal(false);
      setOfflineAuthPassword('');
    } else {
      await toggleOfflineMode(false);
    }
  };

  const [showSyncAuthModal, setShowSyncAuthModal] = useState(false);
  const [syncAuthPassword, setSyncAuthPassword] = useState('');

  const handleSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!syncAuthPassword) return;

    await syncData(syncAuthPassword);
    setShowSyncAuthModal(false);
    setSyncAuthPassword('');
  };

  const breadcrumbItems = [
    { label: 'Settings', active: false },
    { label: activeTab.charAt(0).toUpperCase() + activeTab.slice(1), active: true }
  ];

  return (
    <Container fluid className="px-0">
      <PageBreadcrumb items={breadcrumbItems} />
      
      {/* Offline Auth Modal */}
      <Modal show={showOfflineAuthModal} onHide={() => setShowOfflineAuthModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bolder">Verify Identity</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="text-body-secondary mb-4">
            Please enter your password to securely cache your credentials for offline access. 
            This ensures you can still log in and manage the kiosks without internet.
          </p>
          <Form onSubmit={handleToggleOffline}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold fs-10 text-uppercase">Your Password</Form.Label>
              <Form.Control 
                type="password" 
                value={offlineAuthPassword} 
                onChange={(e) => setOfflineAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="form-control-lg border-2"
                autoFocus
              />
            </Form.Group>
            <div className="d-grid mt-4">
              <Button variant="primary" type="submit" size="lg" className="fw-bold py-3 shadow-sm" disabled={!offlineAuthPassword}>
                VERIFY & GO OFFLINE
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      <div className="mb-4">
        <h2 className="mb-2">Settings</h2>
        <p className="text-body-secondary">Manage your application preferences and device connectivity.</p>
      </div>

      {/* Sync Auth Modal */}
      <Modal show={showSyncAuthModal} onHide={() => setShowSyncAuthModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bolder">Verify Identity</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="text-body-secondary mb-4">
            Please enter your password to authorize the data synchronization.
          </p>
          <Form onSubmit={handleSync}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold fs-10 text-uppercase">Your Password</Form.Label>
              <Form.Control 
                type="password" 
                value={syncAuthPassword} 
                onChange={(e) => setSyncAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="form-control-lg border-2"
                autoFocus
              />
            </Form.Group>
            <div className="d-grid mt-4">
              <Button variant="primary" type="submit" size="lg" className="fw-bold py-3 shadow-sm" disabled={!syncAuthPassword || isSyncing}>
                {isSyncing ? 'SYNCING...' : 'VERIFY & SYNC'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Tab.Container activeKey={activeTab}>
        <div className="animate-fade-in">
          <Tab.Content>
            {/* GENERAL TAB */}
            <Tab.Pane eventKey="general">
              <Row className="g-4">
                <Col md={12}>
                  <Card className="shadow-none border">
                    <Card.Header className="bg-body-tertiary">
                      <h5 className="mb-0">
                        <FontAwesomeIcon icon={isNative ? faMobile : faDesktop} className="me-2 text-primary" />
                        Platform Information
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-4">
                        <div className={`avatar avatar-3xl me-3 rounded-circle d-flex align-items-center justify-content-center bg-${isNative ? 'success' : 'info'}-subtle text-${isNative ? 'success' : 'info'}`}>
                          <FontAwesomeIcon icon={isNative ? faMobile : faDesktop} size="lg" />
                        </div>
                        <div>
                          <h4 className="mb-1">{isNative ? 'Native Android App' : 'Web Browser Application'}</h4>
                          <div className="fs-10 text-body-tertiary">Running on {window.navigator.platform}</div>
                        </div>
                      </div>
                      <div className="bg-body-tertiary p-3 rounded-3 border border-translucent">
                        <h6 className="mb-2 fs-10 text-uppercase fw-bold text-body-tertiary">Environment Details</h6>
                        <p className="fs-9 text-body-secondary mb-0">
                          {isNative 
                            ? 'This application is running as a native Android app via Capacitor. You have direct access to device hardware features.' 
                            : 'This application is running in a web browser. Use the Mobile Scanner connection to link your phone for scanning features.'}
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* OFFLINE & SYNC TAB */}
            <Tab.Pane eventKey="offline">
              <Row className="g-4">
                <Col md={12}>
                  <Card className="shadow-none border overflow-hidden">
                    <Card.Header className="bg-body-tertiary d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <FontAwesomeIcon icon={faSync} className={`me-2 ${isOfflineMode ? 'text-warning' : 'text-success'}`} />
                        Offline Data & Synchronization
                      </h5>
                      {isOfflineMode && (
                        <Badge bg="warning-subtle" className="text-warning rounded-pill px-3 fs-10">
                          OFFLINE MODE ACTIVE
                        </Badge>
                      )}
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row className="align-items-center">
                        <Col lg={7}>
                          <h4 className="mb-2">Work without Internet</h4>
                          <p className="text-body-secondary fs-9 mb-4 mb-lg-0">
                            Enable Offline Mode to continue using the Kiosk and Event systems even without a stable connection. 
                            Data will be stored locally and synced automatically when you go back online.
                          </p>
                        </Col>
                        <Col lg={5} className="text-lg-end">
                          <div className="d-flex flex-column gap-2 align-items-lg-end">
                            <Button 
                              variant="primary"
                              onClick={() => setShowSyncAuthModal(true)}
                              className="fw-bold px-4 py-2"
                              disabled={isDownloading || isSyncing}
                            >
                              <FontAwesomeIcon icon={faSync} className="me-2" />
                              SYNC DATA
                            </Button>
                            
                            {pendingSyncCount > 0 && (
                              <div className="text-warning p-0 fs-10 fw-bolder">
                                <FontAwesomeIcon icon={faExclamationCircle} className="me-1" />
                                {pendingSyncCount} PENDING CHANGES
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>

                      <div className="row g-3 mt-4">
                        <Col md={12}>
                          <div className="bg-body-tertiary p-4 rounded-4 border border-translucent">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                              <h6 className="mb-0 fs-9 text-uppercase fw-bold text-body-tertiary ls-1">Offline Database Summary</h6>
                              <Badge bg="primary-subtle" className="text-primary rounded-pill px-3 fs-11">
                                {tableSummary.reduce((acc, curr) => acc + curr.count, 0)} TOTAL RECORDS
                              </Badge>
                            </div>
                            <Row className="g-3">
                              {tableSummary.map((table) => (
                                <Col key={table.name} xs={6} md={4} lg={2}>
                                  <div className="bg-white dark__bg-gray-1100 p-3 rounded-3 border text-center h-100 shadow-none transition-base hover-border-primary">
                                    <div className="display-6 fw-bolder text-primary mb-1">{table.count}</div>
                                    <div className="fs-11 fw-bold text-body-tertiary text-uppercase" style={{ fontSize: '0.65rem' }}>{table.name}</div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        </Col>
                        
                        <Col md={4}>
                          <div className="p-3 border rounded-3 bg-body-highlight h-100">
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div className="p-2 bg-info-subtle text-info rounded-2">
                                <FontAwesomeIcon icon={faSync} />
                              </div>
                              <h6 className="mb-0">Auto-Sync</h6>
                            </div>
                            <p className="fs-10 text-body-secondary mb-0">Changes are queued locally and uploaded once a connection is detected.</p>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="p-3 border rounded-3 bg-body-highlight h-100">
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div className="p-2 bg-success-subtle text-success rounded-2">
                                <FontAwesomeIcon icon={faLock} />
                              </div>
                              <h6 className="mb-0">Local Cache</h6>
                            </div>
                            <p className="fs-10 text-body-secondary mb-0">Citizen records and event details are securely stored in IndexedDB.</p>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="p-3 border rounded-3 bg-body-highlight h-100">
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div className="p-2 bg-primary-subtle text-primary rounded-2">
                                <FontAwesomeIcon icon={faWindowMaximize} />
                              </div>
                              <h6 className="mb-0">Kiosk Support</h6>
                            </div>
                            <p className="fs-10 text-body-secondary mb-0">Full support for Department and Event kiosks while offline.</p>
                          </div>
                        </Col>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* CONNECTIVITY TAB */}
            <Tab.Pane eventKey="connectivity">
              <Row className="g-4">
                <Col md={12} xl={6}>
                  <Card className="h-100 shadow-none border">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-body-tertiary">
                      <h5 className="mb-0">
                        <FontAwesomeIcon icon={faMobileAlt} className="me-2" />
                        Mobile Scanner
                      </h5>
                      {connected && (
                        <Badge bg="success-subtle" className="text-success rounded-pill px-3">
                          <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Connected
                        </Badge>
                      )}
                    </Card.Header>
                    <Card.Body className="p-4 text-center">
                      {!connected ? (
                        <>
                          <p className="mb-4 text-body-secondary fs-9">Scan this QR code with your phone to use it as an external scanner.</p>
                          <div className="d-inline-block p-3 bg-white border rounded-3 mb-4 shadow-sm">
                            {scannerUrl && <QRCodeSVG value={scannerUrl} size={180} />}
                          </div>
                          <div className="d-flex justify-content-center align-items-center text-primary mb-4">
                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                            <span className="fw-bold">Waiting for connection...</span>
                          </div>
                          <Button variant="phoenix-secondary" size="sm" className="mb-4" onClick={startPairing}>
                            <FontAwesomeIcon icon={faRedo} className="me-2" /> Generate New Code
                          </Button>
                          <div className="p-3 bg-body-tertiary rounded-3 text-start border border-translucent">
                            <h6 className="fs-10 text-uppercase text-body-tertiary fw-bold mb-2">Manual Connection</h6>
                            <InputGroup size="sm">
                              <Form.Control value={scannerUrl} readOnly className="fs-10 bg-white" />
                              <Button variant="phoenix-primary" onClick={() => copyToClipboard(scannerUrl)}><FontAwesomeIcon icon={faCopy} /></Button>
                            </InputGroup>
                          </div>
                        </>
                      ) : (
                        <div className="py-5">
                          <div className="mb-3 text-success"><FontAwesomeIcon icon={faCheckCircle} size="5x" /></div>
                          <h3>Device Connected!</h3>
                          <p className="text-body-secondary mb-4">{deviceInfo?.name || 'Mobile Device'}</p>
                          <Button variant="outline-danger" size="sm" onClick={disconnect}>Disconnect Device</Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={12} xl={6}>
                  <Card className="h-100 shadow-none border">
                    <Card.Header className="bg-body-tertiary">
                      <h5 className="mb-0">
                        <FontAwesomeIcon icon={faNetworkWired} className="me-2" />
                        Network Access (LAN)
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <p className="text-body-secondary fs-9 mb-4">Allow other computers or devices on the same network to access this system.</p>
                      {isLocalhost ? (
                        <div className="alert alert-subtle-info mb-4">
                          <div className="d-flex mb-2">
                            <FontAwesomeIcon icon={faInfoCircle} className="me-2 mt-1" />
                            <div className="fw-bold">Localhost Only</div>
                          </div>
                          <p className="fs-10 mb-3">You are currently accessing via <code>localhost</code>. Other devices cannot see this address.</p>
                          <label className="fw-bold mb-1 text-uppercase fs-11 text-body-tertiary">Your PC's Local IP</label>
                          <InputGroup size="sm">
                            <Form.Control value={ipAddress} onChange={handleIpChange} placeholder="Enter IP (e.g. 192.168.1.5)" />
                            <Button variant="phoenix-primary" onClick={() => copyToClipboard(`https://${ipAddress}:5001`)}><FontAwesomeIcon icon={faCopy} /></Button>
                          </InputGroup>
                        </div>
                      ) : (
                        <div className="alert alert-subtle-success mb-4">
                          <div className="d-flex mb-2">
                            <FontAwesomeIcon icon={faGlobe} className="me-2 mt-1" />
                            <div className="fw-bold">Network Active</div>
                          </div>
                          <div className="d-flex align-items-center mt-2 bg-white p-2 rounded border">
                            <code className="flex-grow-1 text-primary fw-bold">{currentUrl}</code>
                            <Button variant="link" size="sm" className="p-0 ms-2" onClick={() => copyToClipboard(currentUrl)}><FontAwesomeIcon icon={faCopy} /></Button>
                          </div>
                        </div>
                      )}
                      <div className="text-center mb-4">
                        <div className="d-inline-block p-3 bg-white border rounded-3 mb-2 shadow-sm">
                          <QRCodeSVG value={isLocalhost ? `https://${ipAddress}:5001` : currentUrl} size={150} />
                        </div>
                        <div className="fs-10 text-muted">Scan to join on another device</div>
                      </div>
                      <div className="bg-body-tertiary p-3 rounded-3 border border-translucent">
                        <h6 className="fs-10 text-uppercase text-body-tertiary fw-bold mb-2">Troubleshooting</h6>
                        <ul className="fs-10 text-body-secondary mb-0 ps-3">
                          <li className="mb-1">Ensure both devices are on the <strong>same WiFi</strong>.</li>
                          <li className="mb-1">Allow <code>Port 5001</code> in Windows Firewall.</li>
                          <li>Always use <strong>HTTPS</strong> for camera features.</li>
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* INTERFACE TAB */}
            <Tab.Pane eventKey="interface">
              <Card className="shadow-none border">
                <Card.Header className="d-flex justify-content-between align-items-center bg-body-tertiary">
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faPalette} className="me-2" />
                    Interface & Theme
                  </h5>
                  {!disableResetButton && (
                    <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => configDispatch({ type: RESET })}>
                      <FontAwesomeIcon icon={faArrowsRotate} className="me-1" /> Reset to Default
                    </Button>
                  )}
                </Card.Header>
                <Card.Body className="p-4 scrollbar" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                  <Row className="g-5">
                    <Col md={6}>
                      <div className="mb-5">
                        <h6 className="mb-3 fs-9 text-uppercase text-body-tertiary fw-bold border-bottom pb-2">Color Scheme</h6>
                        <ColorScheme />
                      </div>
                      <div className="mb-5">
                        <h6 className="mb-3 fs-9 text-uppercase text-body-tertiary fw-bold border-bottom pb-2">Direction</h6>
                        <RTLMode />
                      </div>
                      <div>
                        <h6 className="mb-3 fs-9 text-uppercase text-body-tertiary fw-bold border-bottom pb-2">Navigation Type</h6>
                        <NavigationType />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-5">
                        <h6 className="mb-3 fs-9 text-uppercase text-body-tertiary fw-bold border-bottom pb-2">Vertical Navbar Appearance</h6>
                        <VerticalNavbarAppearance />
                      </div>
                      <div className="mb-5">
                        <h6 className="mb-3 fs-9 text-uppercase text-body-tertiary fw-bold border-bottom pb-2">Horizontal Navbar Shape</h6>
                        <HorizontalNavbarShape />
                      </div>
                      <div>
                        <h6 className="mb-3 fs-9 text-uppercase text-body-tertiary fw-bold border-bottom pb-2">Top Navbar Appearance</h6>
                        <TopNavbarAppearance />
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </div>
      </Tab.Container>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .nav-pills .nav-link { color: var(--phoenix-body-color); transition: all 0.2s; border: 1px solid transparent; }
        .nav-pills .nav-link:hover { background-color: var(--phoenix-gray-100); }
        .nav-pills .nav-link.active { background-color: var(--phoenix-primary-subtle); color: var(--phoenix-primary); border-color: var(--phoenix-primary-subtle); }
      `}</style>
    </Container>
  );
};

export default Settings;
