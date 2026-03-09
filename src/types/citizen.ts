export interface Citizen {
  id: string; // System Generated Citizen ID
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  sex: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // ISO Date string
  age: number; // Auto-calculated
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated';
  nationality: string;
  religion?: string;
  bloodType?: string;
  photoUrl?: string;

  // Contact Information
  mobileNumber: string;
  email: string;
  emergencyContactPerson: string;
  emergencyContactNumber: string;

  // Address Information
  houseNumberStreet: string;
  purokSitio: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  zipCode: string;
  residencyStatus: 'Permanent' | 'Temporary';
  qrCode?: string | null;
  nfcCardId?: string | null;
  fingerprintTemplate?: string | null;
  status?: 'Active' | 'Deceased' | 'Archived';
}
