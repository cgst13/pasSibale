import { supabase } from './supabaseClient';
import { Event, EventAttendance } from 'types/events';
import { db } from './offlineDb';

const isOffline = () => localStorage.getItem('isOfflineMode') === 'true';

export const getEvents = async () => {
  if (isOffline()) {
    return await db.events.toArray();
  }
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
  return data as Event[];
};

export const getEvent = async (id: string) => {
  if (isOffline()) {
    const data = await db.events.get(id);
    if (!data) throw new Error('Event not found offline');
    return data;
  }
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
  return data as Event;
};

export const createEvent = async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
  if (isOffline()) {
    const id = crypto.randomUUID();
    const newEvent = { ...event, id, created_at: new Date().toISOString() } as Event;
    await db.events.add(newEvent);
    return newEvent;
  }
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }
  return data as Event;
};

export const updateEvent = async (id: string, updates: Partial<Event>) => {
  if (isOffline()) {
    await db.events.update(id, updates);
    return await db.events.get(id);
  }
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }
  return data as Event;
};

export const deleteEvent = async (id: string) => {
  if (isOffline()) {
    return await db.events.delete(id);
  }
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const getAttendanceByEvent = async (eventId: string) => {
  if (isOffline()) {
    // Note: We'd need to join with citizens, but Dexie doesn't do joins easily.
    // We'll return the attendance records and the caller can map the citizen data.
    const attendance = await db.eventAttendance.where('event_id').equals(eventId).toArray();
    const enriched = await Promise.all(attendance.map(async (a) => {
      const citizen = await db.citizens.get(a.citizen_id);
      return { ...a, citizen };
    }));
    return enriched as EventAttendance[];
  }
  const { data, error } = await supabase
    .from('event_attendance')
    .select(`
      *,
      citizen:citizens(*)
    `)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event attendance:', error);
    throw error;
  }
  return data as EventAttendance[];
};

export const recordAttendance = async (attendance: Omit<EventAttendance, 'id' | 'created_at' | 'citizen'>) => {
  if (isOffline()) {
    // Check if exists
    const existing = await db.eventAttendance
      .where('event_id').equals(attendance.event_id)
      .and(a => a.citizen_id === attendance.citizen_id)
      .first();
    
    const id = existing?.id || crypto.randomUUID();
    const payload = { ...attendance, id };
    
    await db.eventAttendance.put(payload);
    await db.syncQueue.add({
      type: 'EVENT_ATTENDANCE',
      action: existing ? 'UPDATE' : 'INSERT',
      payload: payload,
      timestamp: Date.now()
    });
    return payload as EventAttendance;
  }
  const { data, error } = await supabase
    .from('event_attendance')
    .upsert(attendance, { onConflict: 'event_id, citizen_id' })
    .select()
    .single();

  if (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
  return data as EventAttendance;
};

export const deleteAttendance = async (attendanceId: string) => {
  if (isOffline()) {
    return await db.eventAttendance.delete(attendanceId);
  }
  const { error } = await supabase
    .from('event_attendance')
    .delete()
    .eq('id', attendanceId);

  if (error) {
    console.error('Error deleting attendance:', error);
    throw error;
  }
};

export const getEventsByCitizen = async (citizenId: string) => {
  if (isOffline()) {
    const attendance = await db.eventAttendance.where('citizen_id').equals(citizenId).toArray();
    const enriched = await Promise.all(attendance.map(async (a) => {
      const event = await db.events.get(a.event_id);
      return { ...a, event };
    }));
    return enriched;
  }
  const { data, error } = await supabase
    .from('event_attendance')
    .select(`
      *,
      event:events(*)
    `)
    .eq('citizen_id', citizenId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching citizen events:', error);
    throw error;
  }
  return data;
};
