export interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SCAN';
  entity_type: 'CITIZEN' | 'EVENT' | 'PROGRAM' | 'USER' | 'ATTENDANCE' | 'SYSTEM';
  entity_id?: string;
  details: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
}
