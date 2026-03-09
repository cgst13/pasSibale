import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from 'services/supabaseClient';
import { toast } from 'react-hot-toast';

import { isNative } from 'utils/platform';

export type ScanType = 'qr' | 'nfc' | 'fingerprint';

export interface DeviceInfo {
  name: string;
  userAgent: string;
  connectedAt: number;
}

interface ScannerContextType {
  connected: boolean;
  sessionId: string;
  scannerUrl: string;
  ipAddress: string;
  setIpAddress: (ip: string) => void;
  startPairing: () => void;
  disconnect: () => void;
  lastScan: { value: string; type: ScanType; timestamp: number } | null;
  deviceInfo: DeviceInfo | null;
  isNative: boolean;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const [scannerUrl, setScannerUrl] = useState('');
  
  const native = isNative();
  
  // Auto-detect local IP from Vite define
  const [ipAddress, setIpAddress] = useState<string>(() => {
    try {
      // @ts-ignore - __LOCAL_IP__ is defined in vite.config.ts
      return typeof __LOCAL_IP__ !== 'undefined' ? __LOCAL_IP__ : '';
    } catch (e) {
      return '';
    }
  });
  
  const [lastScan, setLastScan] = useState<{ value: string; type: ScanType; timestamp: number } | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  // Helper to generate URL
  const generateUrl = useCallback((id: string, ip?: string) => {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // Use the provided IP, or the auto-detected IP if on localhost
    let host = ip || (isLocal ? (typeof __LOCAL_IP__ !== 'undefined' ? __LOCAL_IP__ : hostname) : hostname);
    
    if (isLocal && !ip && ipAddress) {
        host = ipAddress;
    }

    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    return `${protocol}//${host}${port}/mobile-scanner?session=${id}`;
  }, [ipAddress]);

  // Connect to Supabase channel
  const connectToChannel = useCallback((id: string) => {
    const channel = supabase.channel(`scanner:${id}`);

    channel
      .on('broadcast', { event: 'connect' }, (payload) => {
        setConnected(true);
        if (payload.payload) {
          setDeviceInfo({
            name: payload.payload.name || 'Unknown Device',
            userAgent: payload.payload.userAgent || 'Unknown',
            connectedAt: Date.now()
          });
        }
        // We don't want to spam toasts on every refresh, maybe just on first connect?
        // But for now let's keep it to verify it works.
        // toast.success('Mobile scanner connected!'); 
      })
      .on('broadcast', { event: 'scan' }, (payload) => {
        if (payload.payload) {
           const { type, data } = payload.payload;
           // We use a timestamp to ensure even duplicate scans trigger updates if needed
           setLastScan({ value: data, type: type as ScanType, timestamp: Date.now() });
           toast.success(`Received ${String(type).toUpperCase()} scan`);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Send a ping to see if any mobile scanner is already connected
          channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: {}
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initialize from storage or start fresh
  useEffect(() => {
    const storedSession = localStorage.getItem('scanner_session_id');
    if (storedSession) {
      setSessionId(storedSession);
      setScannerUrl(generateUrl(storedSession));
    }
  }, [generateUrl]);

  const startPairing = useCallback(() => {
    // Generate new session
    const newSession = crypto.randomUUID();
    localStorage.setItem('scanner_session_id', newSession);
    setSessionId(newSession);
    setConnected(false);
    setScannerUrl(generateUrl(newSession));
    
    // The useEffect will pick up the new session ID change if we structure it right,
    // but here we might want to force a reconnect.
    // Actually, setting sessionId state will trigger a re-render, 
    // but we need the effect to depend on sessionId.
  }, [generateUrl]);
  
  // Effect to handle channel connection when sessionId changes
  useEffect(() => {
      if (!sessionId) return;
      
      const cleanup = connectToChannel(sessionId);
      return cleanup;
  }, [sessionId, connectToChannel]);


  const disconnect = useCallback(() => {
    localStorage.removeItem('scanner_session_id');
    setSessionId('');
    setConnected(false);
    setDeviceInfo(null);
    setScannerUrl('');
    supabase.removeAllChannels();
  }, []);

  const handleSetIpAddress = useCallback((ip: string) => {
      setIpAddress(ip);
      if (sessionId) {
          setScannerUrl(generateUrl(sessionId, ip));
      }
  }, [sessionId, generateUrl]);

  return (
    <ScannerContext.Provider value={{
      connected,
      sessionId,
      scannerUrl,
      ipAddress,
      setIpAddress: handleSetIpAddress,
      startPairing,
      disconnect,
      lastScan,
      deviceInfo,
      isNative: native
    }}>
      {children}
    </ScannerContext.Provider>
  );
};

export const useScannerContext = () => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScannerContext must be used within a ScannerProvider');
  }
  return context;
};

export default ScannerProvider;
