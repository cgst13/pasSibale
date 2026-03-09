export interface AttendanceConfig {
  id: string;
  label: string;
  time_in_start: string; // HH:mm
  time_in_end: string;   // HH:mm
  time_out_start: string; // HH:mm
  time_out_end: string;   // HH:mm
}

export interface AttendanceLog {
  slot_id: string;
  time_in?: string; // ISO String
  time_out?: string; // ISO String
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  location?: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  created_at?: string;
  updated_at?: string;
  attendance_config?: AttendanceConfig[];
}

export interface EventAttendance {
  id: string;
  event_id: string;
  citizen_id: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  time_in?: string | null; // Keep for compatibility or first check-in
  time_out?: string | null; // Keep for compatibility or last check-out
  remarks?: string;
  created_at?: string;
  logs?: AttendanceLog[];
  // Join fields
  citizen?: {
    firstName: string;
    lastName: string;
    middleName?: string;
    suffix?: string;
    barangay?: string;
  };
  event?: Event;
}
