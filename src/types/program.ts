import { Citizen } from './citizen';

export interface ProgramField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[]; // For select inputs
  defaultValue?: string | number | boolean;
}

export interface ProgramDefinition {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  fields: ProgramField[];
  status?: 'Active' | 'Inactive' | 'Archived' | 'Pending';
  created_at: string;
  table_config?: {
    columns: string[];
  };
  eligibility_criteria?: {
    minAge?: number | null;
    maxAge?: number | null;
    sex?: 'Male' | 'Female' | null;
    barangay?: string[] | null;
    custom?: string | null;
  };
}

export interface ProgramEnrollment {
  id: string;
  program_id: string;
  citizen_id: string;
  data: Record<string, any>;
  status: 'Active' | 'Inactive' | 'Pending' | 'Completed' | 'Dropped';
  enrollment_date: string;
  created_at: string;
  program?: ProgramDefinition; // For joined queries
  citizen?: Citizen;
}
