import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Card, Container, Spinner, Alert } from 'react-bootstrap';
import { supabase } from 'services/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faWifi, faFingerprint, faCamera, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';

const MobileScanner = () => {
  const [searchParams] = useSearchParams();
  const session = searchParams.get('session');
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);
  // Initialize state based on window.isSecureContext if available, otherwise default to true (and check in useEffect)
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'isSecureContext' in window) {
      return window.isSecureContext;
    }
    return true;
  });
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Check if camera is supported (requires HTTPS or localhost)
    // We use isSecureContext as the primary check for getUserMedia availability on modern browsers
    const isSecure = window.isSecureContext;
    const hasMediaDevices = typeof navigator.mediaDevices !== 'undefined';
    const hasGetUserMedia = hasMediaDevices && typeof navigator.mediaDevices.getUserMedia !== 'undefined';
    
    // Camera is only truly available if we are in a secure context AND the API exists
    // (Note: On some browsers, the API exists but fails on insecure contexts, so isSecureContext is crucial)
    const canUseCamera = isSecure && hasGetUserMedia;

    setCameraAvailable(canUseCamera);
    
    if (!canUseCamera) {
       toast((t) => (
         <span>
           Camera access is limited ({!isSecure ? 'Insecure Context' : 'No Camera'}).<br/>
           {!isSecure && (
             <small className="d-block mt-1 text-muted">
               Please open this page via HTTPS.<br/>
               (If you see a security warning, click Advanced &rarr; Proceed)
             </small>
           )}
           Please use <b>File Upload</b> or try switching to HTTPS.
         </span>
       ), { icon: '⚠️', duration: 8000 });
    }
  }, []);

  useEffect(() => {
    if (session) {
      const channel = supabase.channel(`scanner:${session}`);
      
      const sendConnect = () => {
        // Try to get a friendly device name if possible
        let deviceName = 'Mobile Device';
        if (/android/i.test(navigator.userAgent)) deviceName = 'Android Phone';
        else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) deviceName = 'iPhone/iPad';
        
        channel.send({
          type: 'broadcast',
          event: 'connect',
          payload: { 
            name: deviceName,
            userAgent: navigator.userAgent 
          }
        });
      };

      channel
        .on('broadcast', { event: 'ping' }, () => {
          sendConnect();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
            sendConnect();
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    if (session) {
      const channel = supabase.channel(`scanner:${session}`);
      channel.send({
        type: 'broadcast',
        event: 'scan',
        payload: { type: 'qr', data: decodedText }
      });
      toast.success('QR Code Scanned!');
      setScanning(false);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    }
  };

  const startQrScanner = () => {
    setScanning(true);
    
    // If no camera, we will show file input instead of initializing scanner
    // Check state again to be sure
    if (!cameraAvailable) {
      return;
    }

    // Double check secure context before launching
    if (window.isSecureContext === false) {
      setCameraAvailable(false);
      return;
    }

    // Use a timeout to allow the DOM element to be ready
    setTimeout(() => {
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE]
      };

      const scanner = new Html5QrcodeScanner(
        "reader",
        config,
        /* verbose= */ false
      );
      scanner.render(handleScanSuccess, (error) => {
        // console.warn(error);
      });
      scannerRef.current = scanner;
    }, 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       const file = e.target.files[0];
       // We need an element ID even for file scan without UI
       const html5QrCode = new Html5Qrcode("reader-hidden"); 
       html5QrCode.scanFile(file, true)
        .then(decodedText => {
            handleScanSuccess(decodedText);
            // Clear instance after success
            html5QrCode.clear();
        })
        .catch(err => {
            toast.error("Failed to scan file. Try another image.");
            console.error(err);
            html5QrCode.clear();
        });
    }
  };

  const stopQrScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        setScanning(false);
      }).catch(err => {
        console.error("Failed to clear scanner", err);
        setScanning(false);
      });
    } else {
      setScanning(false);
    }
  };

  const startNfcScan = async () => {
    if (!nfcSupported) {
      toast.error('NFC not supported on this device');
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      setNfcReading(true);
      
      ndef.onreading = (event: any) => {
        const decoder = new TextDecoder();
        let payload = '';
        
        // Try to decode records
        for (const record of event.message.records) {
            if (record.recordType === "text") {
                payload = decoder.decode(record.data);
            } else {
                // Fallback for ID or other types
                payload = event.serialNumber; 
            }
        }
        
        // If no payload from records, use serial number (UID)
        if (!payload && event.serialNumber) {
            payload = event.serialNumber;
        }

        if (payload && session) {
           const channel = supabase.channel(`scanner:${session}`);
           channel.send({
             type: 'broadcast',
             event: 'scan',
             payload: { type: 'nfc', data: payload }
           });
           toast.success('NFC Tag Read!');
           setNfcReading(false); // Stop reading after one success? Or keep open?
           // Usually keep open for multiple scans, but UI feedback is needed.
        }
      };

      ndef.onreadingerror = () => {
        toast.error('NFC Read Error');
        setNfcReading(false);
      };

    } catch (error) {
      console.error(error);
      toast.error('Failed to start NFC scan');
      setNfcReading(false);
    }
  };

  if (!session) {
    return (
      <Container className="p-4 text-center">
        <Alert variant="warning">
          No session ID found. Please scan the pairing QR code from the PC application.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="p-0 min-vh-100 bg-light d-flex flex-column">
      <div className="p-3 bg-white shadow-sm d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Mobile Scanner</h5>
        {connected ? (
          <span className="text-success fw-bold fs-9"><FontAwesomeIcon icon={faWifi} className="me-1" /> Connected</span>
        ) : (
          <span className="text-danger fw-bold fs-9"><FontAwesomeIcon icon={faTimes} className="me-1" /> Disconnected</span>
        )}
      </div>

      <div className="flex-grow-1 p-3 d-flex flex-column gap-3 justify-content-center">
        {scanning ? (
          <Card className="shadow-sm">
            <Card.Body className="p-2">
               {cameraAvailable ? (
                 <div id="reader" style={{ width: '100%' }}></div>
               ) : (
                 <div className="text-center p-4">
                   <div className="mb-3 text-warning">
                      <FontAwesomeIcon icon={faCamera} size="3x" />
                      <div className="mt-2 fw-bold">Camera Unavailable</div>
                   </div>
                   <p className="text-muted fs-9">
                     {!window.isSecureContext ? (
                       <span>
                         Camera access requires a secure connection (HTTPS).<br/>
                         Please check your URL or accept the security certificate.
                       </span>
                     ) : (
                        <span>Your device does not appear to have a camera or it is blocked.</span>
                     )}
                     <br/>Please upload a QR code image instead.
                   </p>
                   <input  
                     type="file" 
                     accept="image/*" 
                     onChange={handleFileUpload} 
                     className="form-control mb-3" 
                   />
                   <div id="reader-hidden" style={{display:'none'}}></div>
                 </div>
               )}
               <Button variant="danger" className="w-100 mt-3" onClick={stopQrScanner}>
                 Cancel Scan
               </Button>
            </Card.Body>
          </Card>
        ) : (
          <>
            <Button 
              variant="primary" 
              size="lg" 
              className="py-4 shadow-sm"
              onClick={startQrScanner}
            >
              <FontAwesomeIcon icon={faQrcode} size="2x" className="mb-2 d-block" />
              Scan QR Code
            </Button>

            <Button 
              variant="info" 
              size="lg" 
              className="py-4 shadow-sm text-white"
              onClick={startNfcScan}
              disabled={!nfcSupported || nfcReading}
            >
              <FontAwesomeIcon icon={faWifi} size="2x" className="mb-2 d-block" />
              {nfcReading ? 'Bring Tag Close...' : 'Scan NFC Tag'}
            </Button>

            <Button 
              variant="secondary" 
              size="lg" 
              className="py-4 shadow-sm"
              disabled
              title="Fingerprint scanning via web is limited"
            >
              <FontAwesomeIcon icon={faFingerprint} size="2x" className="mb-2 d-block" />
              Fingerprint (N/A)
            </Button>
            <div className="text-center text-muted fs-10 px-3">
              Fingerprint scanning is not supported via standard web browsers for identity verification.
            </div>
          </>
        )}
      </div>
    </Container>
  );
};

export default MobileScanner;
