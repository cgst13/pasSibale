import Dexie, { Table } from 'dexie';
import { Citizen } from 'types/citizen';
import { Department, DepartmentService, CitizenActivity } from 'types/department';
import { Event, EventAttendance } from 'types/events';

export interface SyncQueueItem {
  id?: number;
  type: 'CITIZEN_ACTIVITY' | 'EVENT_ATTENDANCE' | 'CITIZEN_UPDATE';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
}

export interface AuthCache {
  id: string; // user id
  email: string;
  passwordHash: string; // We'll store a simple representation or just a flag for demo, but realistically a hash
  role: string;
  profile: any;
}

export class PasSibaleOfflineDB extends Dexie {
  citizens!: Table<Citizen>;
  departments!: Table<Department>;
  departmentServices!: Table<DepartmentService>;
  events!: Table<Event>;
  citizenActivities!: Table<CitizenActivity>;
  eventAttendance!: Table<EventAttendance>;
  syncQueue!: Table<SyncQueueItem>;
  authCache!: Table<AuthCache>;
  programs!: Table<any>;
  programRegistrations!: Table<any>;
  auditLogs!: Table<any>;
  profiles!: Table<any>;

  constructor() {
    super('PasSibaleOfflineDB');
    this.version(4).stores({
      citizens: 'id, firstName, lastName, qrCode, nfcCardId',
      departments: 'id, name',
      departmentServices: 'id, department_id',
      events: 'id, status',
      citizenActivities: 'id, citizen_id, status, time_in',
      eventAttendance: 'id, event_id, citizen_id',
      syncQueue: '++id, type, timestamp',
      authCache: 'id, email',
      programs: 'id, title',
      programRegistrations: 'id, program_id, citizen_id',
      auditLogs: 'id, timestamp',
      profiles: 'id, email'
    });
  }
}

export const db = new PasSibaleOfflineDB();
