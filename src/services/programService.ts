import { supabase, supabaseAdmin } from './supabaseClient';
import { ProgramDefinition, ProgramEnrollment } from 'types/program';
import { db } from './offlineDb';

const isOffline = () => localStorage.getItem('isOfflineMode') === 'true';

export const getPrograms = async () => {
  if (isOffline()) {
    const programs = await db.programs.toArray();
    return await Promise.all(programs.map(async (program) => {
      const enrollmentCount = await db.programRegistrations
        .where('program_id')
        .equals(program.id)
        .count();
      return {
        ...program,
        enrollment_count: enrollmentCount
      };
    })) as (ProgramDefinition & { enrollment_count: number })[];
  }

  const { data, error } = await supabase
    .from('program_definitions')
    .select(`
      *,
      enrollment_count:program_enrollments(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching programs:', error);
    throw error;
  }
  return data.map(program => ({
    ...program,
    enrollment_count: program.enrollment_count?.[0]?.count || 0
  })) as (ProgramDefinition & { enrollment_count: number })[];
};

export const getProgram = async (id: string) => {
  if (isOffline()) {
    const program = await db.programs.get(id);
    return program as ProgramDefinition;
  }

  const { data, error } = await supabase
    .from('program_definitions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching program:', error);
    throw error;
  }
  return data as ProgramDefinition;
};

export const createProgram = async (program: Omit<ProgramDefinition, 'id' | 'created_at'>) => {
  if (isOffline()) {
    const newProgram = {
      ...program,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    await db.programs.add(newProgram);
    await db.syncQueue.add({
      type: 'PROGRAM_UPDATE' as any,
      action: 'INSERT',
      payload: newProgram,
      timestamp: Date.now()
    });
    return newProgram as ProgramDefinition;
  }

  const { data, error } = await supabase
    .from('program_definitions')
    .insert(program)
    .select()
    .single();

  if (error) {
    console.error('Error creating program:', error);
    throw error;
  }
  return data as ProgramDefinition;
};

export const updateProgram = async (id: string, updates: Partial<ProgramDefinition>) => {
  if (isOffline()) {
    await db.programs.update(id, updates);
    const updated = await db.programs.get(id);
    await db.syncQueue.add({
      type: 'PROGRAM_UPDATE' as any,
      action: 'UPDATE',
      payload: updated,
      timestamp: Date.now()
    });
    return updated as ProgramDefinition;
  }

  // Ensure we're not trying to update fields that don't exist or are read-only if any
  const cleanUpdates = { ...updates };
  
  const { data, error } = await supabase
    .from('program_definitions')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating program:', error);
    throw error;
  }
  return data as ProgramDefinition;
};

export const deleteProgram = async (id: string) => {
  if (isOffline()) {
    const program = await db.programs.get(id);
    await db.programs.delete(id);
    await db.syncQueue.add({
      type: 'PROGRAM_UPDATE' as any,
      action: 'DELETE',
      payload: { id },
      timestamp: Date.now()
    });
    return;
  }

  const { error } = await supabase
    .from('program_definitions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting program:', error);
    throw error;
  }
};

export const getEnrollmentsByCitizen = async (citizenId: string) => {
  if (isOffline()) {
    const enrollments = await db.programRegistrations
      .where('citizen_id')
      .equals(citizenId)
      .toArray();
    
    return await Promise.all(enrollments.map(async (enrollment) => {
      const program = await db.programs.get(enrollment.program_id);
      return {
        ...enrollment,
        program
      };
    })) as ProgramEnrollment[];
  }

  const { data, error } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      program:program_definitions(*)
    `)
    .eq('citizen_id', citizenId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching enrollments:', error);
    throw error;
  }
  return data as ProgramEnrollment[];
};

export const getEnrollmentsByProgram = async (programId: string) => {
  if (isOffline()) {
    const enrollments = await db.programRegistrations
      .where('program_id')
      .equals(programId)
      .toArray();
    
    return await Promise.all(enrollments.map(async (enrollment) => {
      const citizen = await db.citizens.get(enrollment.citizen_id);
      return {
        ...enrollment,
        citizen
      };
    })) as ProgramEnrollment[];
  }

  const { data, error } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      citizen:citizens(*)
    `)
    .eq('program_id', programId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching enrollments:', error);
    throw error;
  }
  return data as ProgramEnrollment[];
};

export const createEnrollment = async (enrollment: Omit<ProgramEnrollment, 'id' | 'created_at' | 'program'>) => {
  if (isOffline()) {
    const newEnrollment = {
      ...enrollment,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    await db.programRegistrations.add(newEnrollment);
    await db.syncQueue.add({
      type: 'PROGRAM_ENROLLMENT' as any,
      action: 'INSERT',
      payload: newEnrollment,
      timestamp: Date.now()
    });
    return newEnrollment as ProgramEnrollment;
  }

  const { data, error } = await supabase
    .from('program_enrollments')
    .insert(enrollment)
    .select()
    .single();

  if (error) {
    console.error('Error creating enrollment:', error);
    throw error;
  }
  return data as ProgramEnrollment;
};

export const getProgramEnrollmentCount = async (programId: string) => {
  if (isOffline()) {
    return await db.programRegistrations
      .where('program_id')
      .equals(programId)
      .count();
  }

  const { count, error } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId);
  
  if (error) {
    console.error('Error fetching enrollment count:', error);
    return 0;
  }
  return count || 0;
};

export const deleteEnrollment = async (id: string) => {
  if (isOffline()) {
    await db.programRegistrations.delete(id);
    await db.syncQueue.add({
      type: 'PROGRAM_ENROLLMENT' as any,
      action: 'DELETE',
      payload: { id },
      timestamp: Date.now()
    });
    return;
  }

  const { error } = await supabase
    .from('program_enrollments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting enrollment:', error);
    throw error;
  }
};

export const uploadProgramLogo = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
  const filePath = `programs/${fileName}`;

  // Use supabaseAdmin if available to bypass RLS for uploads and bucket creation
  // Fallback to standard client if admin key is missing (will rely on RLS policies)
  const client = supabaseAdmin || supabase;

  if (supabaseAdmin) {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.find(b => b.name === 'program-logos');
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket('program-logos', { public: true });
    } else if (!bucketExists.public) {
      await supabaseAdmin.storage.updateBucket('program-logos', { public: true });
    }
  }

  const { error: uploadError } = await client.storage
    .from('program-logos')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type
    });

  if (uploadError) {
    console.error('Error uploading logo:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('program-logos')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
