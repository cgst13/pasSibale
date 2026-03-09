export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface DepartmentService {
  id: string;
  department_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  requirements: string[];
  status: 'Active' | 'Inactive';
  departments?: Department;
}

export interface CitizenActivity {
  id: string;
  citizen_id: string;
  department_id: string;
  service_id?: string;
  purpose_description?: string;
  time_in: string;
  time_out?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
