
export type UserRole = 
  | 'super_admin' 
  | 'municipal_admin' 
  | 'department_head' 
  | 'officer' 
  | 'field_officer' 
  | 'viewer';

export type EmploymentType = 
  | 'permanent' 
  | 'contractual' 
  | 'job_order' 
  | 'consultant';

export type EmploymentStatus = 
  | 'active' 
  | 'suspended' 
  | 'inactive'
  | 'terminated'
  | 'resigned'
  | 'invited'
  | 'banned';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  head_id?: string;
}

export interface UserProfile {
  id: string; // Links to auth.users
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: UserRole;
  status: EmploymentStatus;
  created_at: string;
  last_login?: string;
}

export interface Employee {
  id: string;
  profile_id: string; // Links to UserProfile
  department_id: string; // Links to Department
  position_title: string;
  employee_id_number?: string;
  employment_type: EmploymentType;
  date_hired: string;
  supervisor_id?: string;
  citizen_id?: string; // Optional link to Citizen record
}

// Combined type for UI display
export interface UserEmployeeView extends UserProfile {
  department_name?: string;
  position_title?: string;
  employment_type?: EmploymentType;
  employee_id_number?: string;
}
