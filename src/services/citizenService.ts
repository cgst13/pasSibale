import { supabase, supabaseAdmin } from './supabaseClient';
import { Citizen } from 'types/citizen';
import { db } from './offlineDb';

const isOffline = () => localStorage.getItem('isOfflineMode') === 'true';

export const getCitizens = async () => {
  if (isOffline()) {
    return await db.citizens.orderBy('created_at').reverse().toArray();
  }

  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .order('created_at', { ascending: false }); // Assuming there is a created_at column
  
  if (error) {
    console.error('Error fetching citizens:', error);
    throw error;
  }
  return data as Citizen[];
};

export const searchCitizens = async (query: string) => {
  if (!query) return [];

  const sanitizedQuery = query.trim();
  
  if (isOffline()) {
    const lowerQuery = sanitizedQuery.toLowerCase();
    return await db.citizens
      .filter(c => 
        c.firstName.toLowerCase().includes(lowerQuery) || 
        c.lastName.toLowerCase().includes(lowerQuery) ||
        c.id.toLowerCase().includes(lowerQuery)
      )
      .limit(10)
      .toArray();
  }

  // Basic search for now to avoid 500 errors with complex filters
  // Just search first name OR last name OR ID
  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .or(`firstName.ilike.%${sanitizedQuery}%,lastName.ilike.%${sanitizedQuery}%,id.eq.${sanitizedQuery}`)
    .limit(10);

  if (error) {
    // If ID search fails (invalid UUID syntax), try name only
    if (error.code === '22P02') { // Postgres invalid text representation code
       const { data: nameData, error: nameError } = await supabase
        .from('citizens')
        .select('*')
        .or(`firstName.ilike.%${sanitizedQuery}%,lastName.ilike.%${sanitizedQuery}%`)
        .limit(10);
        
       if (nameError) {
         console.error('Error searching citizens by name:', nameError);
         return [];
       }
       return nameData as Citizen[];
    }
    
    console.error('Error searching citizens:', error);
    return [];
  }
  return data as Citizen[];
};

export const getCitizen = async (id: string) => {
  if (isOffline()) {
    const citizen = await db.citizens.get(id);
    return citizen as Citizen;
  }

  const { data, error } = await supabase
    .from('citizens')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching citizen:', error);
    throw error;
  }
  return data as Citizen;
};

export const createCitizen = async (citizen: Omit<Citizen, 'id'>) => {
  if (isOffline()) {
    const newCitizen = {
      ...citizen,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    } as Citizen;
    await db.citizens.add(newCitizen);
    await db.syncQueue.add({
      type: 'CITIZEN_UPDATE',
      action: 'INSERT',
      payload: newCitizen,
      timestamp: Date.now()
    });
    return newCitizen;
  }

  const { data, error } = await supabase
    .from('citizens')
    .insert([citizen])
    .select()
    .single();

  if (error) {
    console.error('Error creating citizen:', error);
    throw error;
  }
  return data as Citizen;
};

export const updateCitizen = async (id: string, citizen: Partial<Citizen>) => {
  if (isOffline()) {
    await db.citizens.update(id, citizen);
    const updated = await db.citizens.get(id);
    await db.syncQueue.add({
      type: 'CITIZEN_UPDATE',
      action: 'UPDATE',
      payload: updated,
      timestamp: Date.now()
    });
    return updated as Citizen;
  }

  const { data, error } = await supabase
    .from('citizens')
    .update(citizen)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating citizen:', error);
    throw error;
  }
  return data as Citizen;
};

export const getCitizenByToken = async (token: string) => {
  if (isOffline()) {
    return await db.citizens
      .filter(c => c.qrCode === token || c.nfcCardId === token || c.id === token)
      .first() || null;
  }

  // Try to find citizen by ID (if valid UUID), qrCode, or nfcCardId
  // Since UUID check might fail for non-UUID tokens, we'll try to search by qrCode or nfcCardId first
  // Actually, we can use OR syntax but we need to be careful with types
  
  // First, check if token is a valid UUID to potentially search by ID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  
  let query = supabase.from('citizens').select('*');
  
  if (isUuid) {
    query = query.or(`id.eq.${token},qrCode.eq.${token},nfcCardId.eq.${token}`);
  } else {
    query = query.or(`qrCode.eq.${token},nfcCardId.eq.${token}`);
  }

  const { data, error } = await query.single();

  if (error) {
    // If not found, it returns an error usually
    if (error.code === 'PGRST116') { // No rows found
      return null;
    }
    console.error('Error fetching citizen by token:', error);
    throw error;
  }
  return data as Citizen;
};

export const deleteCitizen = async (id: string) => {
  if (isOffline()) {
    await db.citizens.delete(id);
    await db.syncQueue.add({
      type: 'CITIZEN_UPDATE',
      action: 'DELETE',
      payload: { id },
      timestamp: Date.now()
    });
    return;
  }

  const { error } = await supabase
    .from('citizens')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting citizen:', error);
    throw error;
  }
};

export const uploadCitizenPhoto = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
  const filePath = `citizens/${fileName}`;

  // Use supabaseAdmin if available to bypass RLS for uploads and bucket creation
  // Fallback to standard client if admin key is missing (will rely on RLS policies)
  const client = supabaseAdmin || supabase;

  if (supabaseAdmin) {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.find(b => b.name === 'citizen-photos');
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket('citizen-photos', { public: true });
    } else if (!bucketExists.public) {
      await supabaseAdmin.storage.updateBucket('citizen-photos', { public: true });
    }
  }

  const { error: uploadError } = await client.storage
    .from('citizen-photos')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type
    });

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('citizen-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
