import { supabase } from './supabaseClient';
import { AuditLog } from 'types/audit';
import { db } from './offlineDb';

const isOffline = () => localStorage.getItem('isOfflineMode') === 'true';

export const getAuditLogs = async (limit = 50, offset = 0): Promise<AuditLog[]> => {
  if (isOffline()) {
    return await db.auditLogs.orderBy('created_at').reverse().offset(offset).limit(limit).toArray();
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching audit logs:', error);
    // For demo purposes, if table doesn't exist, return empty array instead of throwing
    if (error.code === '42P01') return []; 
    throw error;
  }

  return data || [];
};

export const createAuditLog = async (log: Partial<AuditLog>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const payload = {
    ...log,
    user_id: user?.id,
    user_email: user?.email,
    user_agent: navigator.userAgent,
    created_at: new Date().toISOString()
  };

  if (isOffline()) {
    const offlineLog = { ...payload, id: crypto.randomUUID() };
    await db.auditLogs.add(offlineLog);
    // Audit logs are typically not synced back to Supabase if generated offline 
    // to avoid flooding, but for this project we'll sync them.
    await db.syncQueue.add({
      type: 'AUDIT_LOG' as any,
      action: 'INSERT',
      payload: offlineLog,
      timestamp: Date.now()
    });
    return;
  }

  const { error } = await supabase.from('audit_logs').insert([payload]);

  if (error) {
    console.error('Error creating audit log:', error);
  }
};
