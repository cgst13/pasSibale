import { supabase } from './supabaseClient';
import { Department, DepartmentService, CitizenActivity } from 'types/department';
import { db } from './offlineDb';

const isOffline = () => localStorage.getItem('isOfflineMode') === 'true';

export const getDepartments = async (): Promise<Department[]> => {
  if (isOffline()) {
    return await db.departments.toArray();
  }

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
  return data as Department[];
};

export const getDepartmentServices = async (departmentId?: string) => {
  if (isOffline()) {
    let services;
    if (departmentId) {
      services = await db.departmentServices.where('department_id').equals(departmentId).toArray();
    } else {
      services = await db.departmentServices.toArray();
    }
    
    return await Promise.all(services.map(async (service) => {
      const department = await db.departments.get(service.department_id);
      return { ...service, departments: department };
    })) as DepartmentService[];
  }

  let query = supabase
    .from('department_services')
    .select(`
      *,
      departments(*)
    `)
    .order('name');

  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
  return data as DepartmentService[];
};

export const createDepartmentService = async (service: Omit<DepartmentService, 'id' | 'created_at' | 'departments'>) => {
  if (isOffline()) {
    const newService = {
      ...service,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    } as DepartmentService;
    await db.departmentServices.add(newService);
    await db.syncQueue.add({
      type: 'SERVICE_UPDATE' as any,
      action: 'INSERT',
      payload: newService,
      timestamp: Date.now()
    });
    return newService;
  }

  const { data, error } = await supabase
    .from('department_services')
    .insert(service)
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    throw error;
  }
  return data as DepartmentService;
};

export const updateDepartmentService = async (id: string, updates: Partial<DepartmentService>) => {
  if (isOffline()) {
    await db.departmentServices.update(id, updates);
    const updated = await db.departmentServices.get(id);
    await db.syncQueue.add({
      type: 'SERVICE_UPDATE' as any,
      action: 'UPDATE',
      payload: updated,
      timestamp: Date.now()
    });
    return updated as DepartmentService;
  }

  const { data, error } = await supabase
    .from('department_services')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error);
    throw error;
  }
  return data as DepartmentService;
};

export const deleteDepartmentService = async (id: string) => {
  if (isOffline()) {
    await db.departmentServices.delete(id);
    await db.syncQueue.add({
      type: 'SERVICE_UPDATE' as any,
      action: 'DELETE',
      payload: { id },
      timestamp: Date.now()
    });
    return;
  }

  const { error } = await supabase
    .from('department_services')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

export const getActiveCitizenActivity = async (citizenId: string): Promise<CitizenActivity | null> => {
  if (isOffline()) {
    const data = await db.citizenActivities
      .where('citizen_id')
      .equals(citizenId)
      .and(a => a.status === 'IN_PROGRESS')
      .first();
    return data || null;
  }
  const { data, error } = await supabase
    .from('citizen_activities')
    .select('*, departments(name)')
    .eq('citizen_id', citizenId)
    .eq('status', 'IN_PROGRESS')
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

export const timeInCitizen = async (
  citizenId: string, 
  deptId: string, 
  serviceId?: string, 
  purpose?: string
): Promise<CitizenActivity> => {
  // Check if already in progress somewhere
  const active = await getActiveCitizenActivity(citizenId);
  if (active) {
    const deptName = isOffline() ? (await db.departments.get(active.department_id))?.name : active.departments?.name;
    throw new Error(`Citizen is still active at ${deptName || 'another department'}. Please timeout first.`);
  }

  if (isOffline()) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dept = await db.departments.get(deptId);
    
    const newActivity = {
      id,
      citizen_id: citizenId,
      department_id: deptId,
      service_id: serviceId,
      purpose_description: purpose,
      time_in: now,
      status: 'IN_PROGRESS' as const,
      departments: { name: dept?.name || 'Unknown' }
    };
    
    await db.citizenActivities.add(newActivity);
    await db.syncQueue.add({
      type: 'CITIZEN_ACTIVITY',
      action: 'INSERT',
      payload: {
        id,
        citizen_id: citizenId,
        department_id: deptId,
        service_id: serviceId,
        purpose_description: purpose,
        time_in: now,
        status: 'IN_PROGRESS'
      },
      timestamp: Date.now()
    });
    return newActivity;
  }

  const { data, error } = await supabase
    .from('citizen_activities')
    .insert([{
      citizen_id: citizenId,
      department_id: deptId,
      service_id: serviceId,
      purpose_description: purpose,
      time_in: new Date().toISOString(),
      status: 'IN_PROGRESS'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const timeOutCitizen = async (activityId: string): Promise<void> => {
  if (isOffline()) {
    const now = new Date().toISOString();
    await db.citizenActivities.update(activityId, {
      time_out: now,
      status: 'COMPLETED'
    });
    await db.syncQueue.add({
      type: 'CITIZEN_ACTIVITY',
      action: 'UPDATE',
      payload: { id: activityId, time_out: now, status: 'COMPLETED' },
      timestamp: Date.now()
    });
    return;
  }
  const { error } = await supabase
    .from('citizen_activities')
    .update({
      time_out: new Date().toISOString(),
      status: 'COMPLETED'
    })
    .eq('id', activityId);

  if (error) throw error;
};

export const getKioskLogs = async (limit = 200): Promise<CitizenActivity[]> => {
  if (isOffline()) {
    const activities = await db.citizenActivities.orderBy('time_in').reverse().limit(limit).toArray();
    return await Promise.all(activities.map(async (activity) => {
      const citizen = await db.citizens.get(activity.citizen_id);
      const department = await db.departments.get(activity.department_id);
      return { ...activity, citizens: citizen, departments: department } as any;
    }));
  }

  const { data, error } = await supabase
    .from('citizen_activities')
    .select(`
      *,
      citizens(*),
      departments(*)
    `)
    .order('time_in', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching kiosk logs:', error);
    throw error;
  }
  return data as CitizenActivity[];
};

export const createKioskActivity = async (activity: Omit<CitizenActivity, 'id'>) => {
  if (isOffline()) {
    const newActivity = { ...activity, id: crypto.randomUUID() } as CitizenActivity;
    await db.citizenActivities.add(newActivity);
    await db.syncQueue.add({
      type: 'CITIZEN_ACTIVITY',
      action: 'INSERT',
      payload: newActivity,
      timestamp: Date.now()
    });
    return newActivity;
  }

  const { data, error } = await supabase
    .from('citizen_activities')
    .insert([activity])
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
  return data as CitizenActivity;
};
