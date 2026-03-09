import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, SyncQueueItem } from 'services/offlineDb';
import { getCitizens } from 'services/citizenService';
import { getDepartments, getDepartmentServices } from 'services/departmentService';
import { getEvents } from 'services/eventsService';
import { toast } from 'react-hot-toast';
import { supabase } from 'services/supabaseClient';

import bcrypt from 'bcryptjs';

interface TableSummary {
  name: string;
  count: number;
  lastUpdated?: string;
}

interface OfflineModeContextType {
  isOfflineMode: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  pendingSyncCount: number;
  tableSummary: TableSummary[];
  toggleOfflineMode: (enable: boolean, password?: string) => Promise<void>;
  syncData: () => Promise<void>;
  refreshTableSummary: () => Promise<void>;
}

const OfflineModeContext = createContext<OfflineModeContextType | undefined>(undefined);

export const OfflineModeProvider = ({ children }: { children: ReactNode }) => {
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem('isOfflineMode') === 'true';
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [tableSummary, setTableSummary] = useState<TableSummary[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('isOfflineMode', isOfflineMode.toString());
    updatePendingCount();
    refreshTableSummary();
  }, [isOfflineMode]);

  const refreshTableSummary = async () => {
    try {
      const summary: TableSummary[] = [
        { name: 'Citizens', count: await db.citizens.count() },
        { name: 'Departments', count: await db.departments.count() },
        { name: 'Services', count: await db.departmentServices.count() },
        { name: 'Events', count: await db.events.count() },
        { name: 'Attendance', count: await db.eventAttendance.count() },
        { name: 'Programs', count: await db.programs.count() },
        { name: 'Registrations', count: await db.programRegistrations.count() },
        { name: 'Audit Logs', count: await db.auditLogs.count() },
        { name: 'Activities', count: await db.citizenActivities.count() },
        { name: 'Profiles', count: await db.profiles.count() },
        { name: 'Auth Cache', count: await db.authCache.count() },
      ];
      setTableSummary(summary);
    } catch (error) {
      console.error('Error refreshing table summary:', error);
    }
  };

  const updatePendingCount = async () => {
    const count = await db.syncQueue.count();
    setPendingSyncCount(count);
  };

  const checkConnectivity = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to check actual connectivity
      const response = await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
      return !!response;
    } catch (e) {
      return false;
    }
  };

  const toggleOfflineMode = async (enable: boolean, password?: string) => {
    if (enable) {
      if (!password) {
        toast.error('Password is required to verify your identity before going offline');
        return;
      }
      // Just set the mode, sync will handle the data
      setIsOfflineMode(true);
      toast.success('System is now in Offline Mode');
    } else {
      setIsOfflineMode(false);
      toast.success('System is back Online');
    }
  };

  const syncData = async (password: string) => {
    if (!password) {
      toast.error('Password is required to sync data');
      return;
    }

    setIsSyncing(true);
    toast.loading('Starting data synchronization...', { id: 'syncing' });

    try {
      // Step 1: Verify password
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not logged in');

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (authError) throw new Error('Incorrect password');

      // Step 2: Upload local changes
      const queue = await db.syncQueue.toArray();
      if (queue.length > 0) {
        toast.loading(`Uploading ${queue.length} local changes...`, { id: 'syncing' });
        let successCount = 0;
        for (const item of queue) {
          try {
            if (item.type === 'CITIZEN_ACTIVITY') {
              if (item.action === 'INSERT') {
                await supabase.from('citizen_activities').insert([item.payload]);
              } else if (item.action === 'UPDATE') {
                await supabase.from('citizen_activities').update(item.payload).eq('id', item.payload.id);
              }
            } else if (item.type === 'EVENT_ATTENDANCE') {
              await supabase.from('event_attendance').upsert(item.payload, { onConflict: 'event_id, citizen_id' });
            } else if (item.type === 'CITIZEN_UPDATE') {
              if (item.action === 'INSERT') {
                await supabase.from('citizens').insert([item.payload]);
              } else if (item.action === 'UPDATE') {
                await supabase.from('citizens').update(item.payload).eq('id', item.payload.id);
              } else if (item.action === 'DELETE') {
                await supabase.from('citizens').delete().eq('id', item.payload.id);
              }
            } else if (item.type === ('PROGRAM_UPDATE' as any)) {
              if (item.action === 'INSERT') {
                await supabase.from('program_definitions').insert([item.payload]);
              } else if (item.action === 'UPDATE') {
                await supabase.from('program_definitions').update(item.payload).eq('id', item.payload.id);
              } else if (item.action === 'DELETE') {
                await supabase.from('program_definitions').delete().eq('id', item.payload.id);
              }
            } else if (item.type === ('PROGRAM_ENROLLMENT' as any)) {
              if (item.action === 'INSERT') {
                await supabase.from('program_enrollments').insert([item.payload]);
              } else if (item.action === 'DELETE') {
                await supabase.from('program_enrollments').delete().eq('id', item.payload.id);
              }
            } else if (item.type === ('AUDIT_LOG' as any)) {
              await supabase.from('audit_logs').insert([item.payload]);
            } else if (item.type === ('SERVICE_UPDATE' as any)) {
              if (item.action === 'INSERT') {
                await supabase.from('department_services').insert([item.payload]);
              } else if (item.action === 'UPDATE') {
                await supabase.from('department_services').update(item.payload).eq('id', item.payload.id);
              } else if (item.action === 'DELETE') {
                await supabase.from('department_services').delete().eq('id', item.payload.id);
              }
            }
            
            await db.syncQueue.delete(item.id!);
            successCount++;
          } catch (error) {
            console.error('Sync item failed:', error);
          }
        }
        if (successCount === queue.length) {
          toast.success('Local changes uploaded successfully');
        } else {
          toast.warning(`Uploaded ${successCount} of ${queue.length} changes. Some failed.`);
        }
      }

      // Step 3: Download latest data
      toast.loading('Downloading latest data from cloud...', { id: 'syncing' });
      const tables = [
        { name: 'citizens', db: db.citizens, label: 'Citizens' },
        { name: 'departments', db: db.departments, label: 'Departments' },
        { name: 'department_services', db: db.departmentServices, label: 'Services' },
        { name: 'events', db: db.events, label: 'Events' },
        { name: 'event_attendance', db: db.eventAttendance, label: 'Attendance' },
        { name: 'program_definitions', db: db.programs, label: 'Programs' },
        { name: 'program_enrollments', db: db.programRegistrations, label: 'Registrations' },
        { name: 'audit_logs', db: db.auditLogs, label: 'Audit Logs' },
        { name: 'citizen_activities', db: db.citizenActivities, label: 'Activities' },
        { name: 'profiles', db: db.profiles, label: 'Profiles' }
      ];

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table.name).select('*');
          if (error) throw error;
          await table.db.clear();
          if (data && data.length > 0) {
            await table.db.bulkAdd(data);
          }
        } catch (e) {
          console.warn(`Could not download ${table.label}:`, e);
        }
      }

      // Step 4: Cache Auth
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);
        await db.authCache.clear();
        await db.authCache.put({
          id: user.id,
          email: user.email!,
          passwordHash: passwordHash,
          role: profile.role || 'admin',
          profile: profile
        });
      }

      await refreshTableSummary();
      await updatePendingCount();
      toast.success('Synchronization complete!');

    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error(error.message || 'Synchronization failed');
    } finally {
      setIsSyncing(false);
      toast.dismiss('syncing');
    }
  };

  // Background sync check when online
  useEffect(() => {
    const handleOnline = () => {
      if (!isOfflineMode) syncData();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOfflineMode]);

  return (
    <OfflineModeContext.Provider value={{ 
      isOfflineMode, 
      isDownloading, 
      downloadProgress, 
      pendingSyncCount,
      tableSummary,
      toggleOfflineMode,
      syncData,
      refreshTableSummary,
      isSyncing
    }}>
      {children}
    </OfflineModeContext.Provider>
  );
};

export const useOfflineMode = () => {
  const context = useContext(OfflineModeContext);
  if (context === undefined) {
    throw new Error('useOfflineMode must be used within an OfflineModeProvider');
  }
  return context;
};
