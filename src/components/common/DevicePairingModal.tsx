import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from 'services/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobileAlt, faCheckCircle, faSpinner, faExclamationTriangle, faCopy } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';

interface DevicePairingModalProps {
  show: boolean;
  onHide: () => void;
  onScan: (value: string, type: 'qr' | 'nfc' | 'fingerprint') => void;
}

const DevicePairingModal = ({ show, onHide, onScan }: DevicePairingModalProps) => {
  const [sessionId, setSessionId] = useState('');
  const [connected, setConnected] = useState(false);
  const [scannerUrl, setScannerUrl] = useState('');
  const [ipAddress, setIpAddress] = useState<string>(() => {
    try {
      // @ts-ignore - __LOCAL_IP__ is defined in vite.config.ts
      return typeof __LOCAL_IP__ !== 'undefined' ? __LOCAL_IP__ : '';
    } catch (e) {
      return '';
    }
  });
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (show) {
      // Generate a random session ID
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      setConnected(false);
      
      const hostname = window.location.hostname;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      setIsLocalhost(isLocal);

      // Use auto-detected IP if available, otherwise fallback to hostname
      // @ts-ignore
      const detectedIp = typeof __LOCAL_IP__ !== 'undefined' ? __LOCAL_IP__ : hostname;
      const initialHost = isLocal ? (ipAddress || detectedIp) : hostname;
      
      if (isLocal && !ipAddress) {
        setIpAddress(detectedIp);
      }

      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      const url = `${protocol}//${initialHost}${port}/mobile-scanner?session=${newSessionId}`;
      setScannerUrl(url);

      // Subscribe to the session channel
      const channel = supabase.channel(`scanner:${newSessionId}`);

      channel
        .on('broadcast', { event: 'connect' }, () => {
          setConnected(true);
          toast.success('Mobile scanner connected!');
        })
        .on('broadcast', { event: 'scan' }, (payload) => {
          // payload.payload contains { type, data }
          if (payload.payload) {
             const { type, data } = payload.payload;
             onScan(data, type);
             toast.success(`Received ${type.toUpperCase()} scan`);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [show, onScan]);

  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIp = e.target.value;
    setIpAddress(newIp);
    
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    const url = `${protocol}//${newIp}${port}/mobile-scanner?session=${sessionId}`;
    setScannerUrl(url);
  };

  const copyToClipboard = () => {
    if (scannerUrl) {
      navigator.clipboard.writeText(scannerUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faMobileAlt} className="me-2" />
          Connect Mobile Scanner
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-4">
        {!connected ? (
          <>
            <p className="mb-3 text-body-secondary">
              Scan this QR code with your phone to use it as an external scanner.
            </p>
            
            {isLocalhost && (
              <div className="alert alert-warning fs-10 text-start mb-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                <strong>Localhost Detected:</strong> Phones cannot connect to "localhost". 
                Please enter your PC's local IP address below (e.g., 192.168.1.5).
                <div className="mt-2 text-muted">
                  <small>Note: Camera access requires HTTPS. On local IP (HTTP), you may need to use file upload.</small>
                </div>
                <InputGroup size="sm" className="mt-2">
                   <InputGroup.Text>Server IP</InputGroup.Text>
                   <Form.Control 
                     value={ipAddress} 
                     onChange={handleIpChange}
                     placeholder="e.g. 192.168.1.x"
                   />
                </InputGroup>
              </div>
            )}

            <div className="d-inline-block p-3 bg-white border rounded mb-3">
              {scannerUrl && <QRCodeSVG value={scannerUrl} size={200} />}
            </div>
            
            <div className="d-flex justify-content-center align-items-center text-primary mb-3">
              <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
              <span>Waiting for connection...</span>
            </div>

            <div className="p-3 bg-light rounded text-start">
              <h6 className="fs-10 text-uppercase text-body-tertiary fw-bold mb-2">Manual Connection</h6>
              <p className="fs-10 text-muted mb-2">If you can't scan the QR code, type this address into your phone's browser:</p>
              <InputGroup size="sm">
                <Form.Control 
                  value={scannerUrl} 
                  readOnly 
                  className="fs-10 text-body-highlight bg-white"
                />
                <Button variant="phoenix-primary" onClick={copyToClipboard}>
                  <FontAwesomeIcon icon={faCopy} />
                </Button>
              </InputGroup>
              <div className="mt-2 text-center">
                <a href={scannerUrl} target="_blank" rel="noreferrer" className="fs-10 text-decoration-none">
                  Open in this browser &rarr;
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="py-4">
            <div className="mb-3 text-success">
              <FontAwesomeIcon icon={faCheckCircle} size="4x" />
            </div>
            <h5>Device Connected!</h5>
            <p className="text-body-secondary">
              You can now use your phone to scan QR codes, NFC tags, or fingerprints.
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DevicePairingModal;
