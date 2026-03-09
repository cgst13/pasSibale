
-- Create Enum Types for Consistency
CREATE TYPE user_role AS ENUM ('Super Admin', 'Municipal Admin', 'Department Head', 'Officer', 'Field Officer', 'Viewer');
CREATE TYPE employment_type AS ENUM ('Permanent', 'Contractual', 'Job Order', 'Consultant');
CREATE TYPE employment_status AS ENUM ('Active', 'Suspended', 'Inactive');

-- DEPARTMENTS TABLE
CREATE TABLE public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES TABLE (Extends auth.users)
-- This table holds system access information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'Viewer',
  status employment_status DEFAULT 'Active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CITIZENS TABLE (Separate from Users)
-- For residents of the municipality
CREATE TABLE public.citizens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  qr_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMPLOYEES TABLE (Links Profile to Department)
-- Holds employment specific information
CREATE TABLE public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  position_title TEXT NOT NULL,
  employee_id_number TEXT UNIQUE,
  employment_type employment_type NOT NULL DEFAULT 'Contractual',
  date_hired DATE DEFAULT CURRENT_DATE,
  supervisor_id UUID REFERENCES public.employees(id),
  citizen_id UUID REFERENCES public.citizens(id), -- Optional link to Citizen record
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id) -- One profile can only have one active employee record
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES (Example: Public Read for now, restrict in production)
CREATE POLICY "Allow public read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.employees FOR SELECT USING (true);

-- FUNCTION TO HANDLE NEW USER SIGNUP
-- Automatically creates a profile entry when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'Viewer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER FOR NEW USER SIGNUP
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
