import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { supabase } from 'services/supabaseClient';
import { toast } from 'react-hot-toast';

import { Event } from 'types/events';

import bcrypt from 'bcryptjs';
import { db } from 'services/offlineDb';
import { useOfflineMode } from 'providers/OfflineModeProvider';

interface KioskModeContextType {
  isKioskMode: boolean;
  isEventMode: boolean;
  selectedEvent: Event | null;
  enterKioskMode: () => void;
  enterEventMode: (event: Event) => void;
  exitKioskMode: (password: string) => Promise<boolean>;
  exitEventMode: (password: string) => Promise<boolean>;
}

const KioskModeContext = createContext<KioskModeContextType | undefined>(undefined);

export const KioskModeProvider = ({ children }: { children: ReactNode }) => {
  const { isOfflineMode } = useOfflineMode();
  const [isKioskMode, setIsKioskMode] = useState<boolean>(() => {
    return localStorage.getItem('isKioskMode') === 'true';
  });
  const [isEventMode, setIsEventMode] = useState<boolean>(() => {
    return localStorage.getItem('isEventMode') === 'true';
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(() => {
    const saved = localStorage.getItem('selectedEvent');
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('isKioskMode', isKioskMode.toString());
    localStorage.setItem('isEventMode', isEventMode.toString());
    if (selectedEvent) {
      localStorage.setItem('selectedEvent', JSON.stringify(selectedEvent));
    } else {
      localStorage.removeItem('selectedEvent');
    }
    
    if (isKioskMode || isEventMode) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error('Error attempting to enable full-screen mode:', e);
      });
      
      if (isKioskMode && location.pathname !== '/kiosk') {
        navigate('/kiosk');
      } else if (isEventMode && location.pathname !== '/kiosk/event') {
        navigate('/kiosk/event');
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((e) => {
          console.error('Error attempting to exit full-screen mode:', e);
        });
      }
    }
  }, [isKioskMode, isEventMode, selectedEvent, navigate, location.pathname]);

  const enterKioskMode = () => {
    setIsKioskMode(true);
    setIsEventMode(false);
    toast.success('Entering Kiosk Mode');
  };

  const enterEventMode = (event: Event) => {
    setSelectedEvent(event);
    setIsEventMode(true);
    setIsKioskMode(false);
    toast.success(`Entering Event Mode: ${event.title}`);
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      if (isOfflineMode) {
        // Verify against local auth cache
        const cachedUser = await db.authCache.toCollection().first();
        if (cachedUser && bcrypt.compareSync(password, cachedUser.passwordHash)) {
          return true;
        }
        toast.error('Incorrect administrator password');
        return false;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return false;

        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password,
        });

        if (error) {
          toast.error('Incorrect password');
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };

  const exitKioskMode = async (password: string): Promise<boolean> => {
    const success = await verifyPassword(password);
    if (success) {
      setIsKioskMode(false);
      toast.success('Exited Kiosk Mode');
      navigate('/');
      return true;
    }
    return false;
  };

  const exitEventMode = async (password: string): Promise<boolean> => {
    const success = await verifyPassword(password);
    if (success) {
      setIsEventMode(false);
      setSelectedEvent(null);
      toast.success('Exited Event Mode');
      navigate('/');
      return true;
    }
    return false;
  };

  return (
    <KioskModeContext.Provider value={{ 
      isKioskMode, 
      isEventMode, 
      selectedEvent, 
      enterKioskMode, 
      enterEventMode, 
      exitKioskMode,
      exitEventMode
    }}>
      {children}
    </KioskModeContext.Provider>
  );
};

export const useKioskMode = () => {
  const context = useContext(KioskModeContext);
  if (context === undefined) {
    throw new Error('useKioskMode must be used within a KioskModeProvider');
  }
  return context;
};
