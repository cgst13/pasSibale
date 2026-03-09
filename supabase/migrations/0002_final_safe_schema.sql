-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create citizens table if it doesn't exist
create table if not exists public.citizens (
  id uuid primary key default uuid_generate_v4(),
  "firstName" text not null,
  "lastName" text not null,
  "middleName" text,
  "suffix" text,
  "sex" text not null,
  "dateOfBirth" date not null,
  "age" integer,
  "civilStatus" text not null,
  "nationality" text not null,
  "religion" text,
  "bloodType" text,
  "photoUrl" text,
  "mobileNumber" text not null,
  "telephoneNumber" text,
  "email" text not null,
  "emergencyContactPerson" text not null,
  "emergencyContactNumber" text not null,
  "houseNumberStreet" text not null,
  "purokSitio" text not null,
  "barangay" text not null,
  "cityMunicipality" text not null,
  "province" text not null,
  "zipCode" text not null,
  "residencyStatus" text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create departments table if it doesn't exist
create table if not exists public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique, -- Ensure name is unique
  code text not null,
  description text,
  head_id uuid, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profiles table (links to auth.users) if it doesn't exist
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone_number text,
  avatar_url text,
  role text check (role in ('super_admin', 'municipal_admin', 'department_head', 'officer', 'field_officer', 'viewer')) default 'viewer',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone
);

-- Create employees table if it doesn't exist
create table if not exists public.employees (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  position_title text,
  employee_id_number text,
  employment_type text check (employment_type in ('permanent', 'contractual', 'job_order', 'consultant')),
  date_hired date,
  supervisor_id uuid references public.employees(id),
  citizen_id uuid references public.citizens(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) safely
do $$
begin
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'citizens' and rowsecurity = true) then
    alter table public.citizens enable row level security;
  end if;
  
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'departments' and rowsecurity = true) then
    alter table public.departments enable row level security;
  end if;
  
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'profiles' and rowsecurity = true) then
    alter table public.profiles enable row level security;
  end if;
  
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'employees' and rowsecurity = true) then
    alter table public.employees enable row level security;
  end if;
end $$;

-- Drop existing policies to avoid conflict before recreating them
drop policy if exists "Enable all for authenticated users on citizens" on public.citizens;
drop policy if exists "Enable read for anon on citizens" on public.citizens;

drop policy if exists "Enable all for authenticated users on departments" on public.departments;
drop policy if exists "Enable read for anon on departments" on public.departments;

drop policy if exists "Enable all for authenticated users on profiles" on public.profiles;
drop policy if exists "Enable read for anon on profiles" on public.profiles;

drop policy if exists "Enable all for authenticated users on employees" on public.employees;
drop policy if exists "Enable read for anon on employees" on public.employees;

-- Create policies (Allow all for authenticated users for now)
create policy "Enable all for authenticated users on citizens" on public.citizens for all to authenticated using (true) with check (true);
create policy "Enable read for anon on citizens" on public.citizens for select to anon using (true); 

create policy "Enable all for authenticated users on departments" on public.departments for all to authenticated using (true) with check (true);
create policy "Enable read for anon on departments" on public.departments for select to anon using (true);

create policy "Enable all for authenticated users on profiles" on public.profiles for all to authenticated using (true) with check (true);
create policy "Enable read for anon on profiles" on public.profiles for select to anon using (true);

create policy "Enable all for authenticated users on employees" on public.employees for all to authenticated using (true) with check (true);
create policy "Enable read for anon on employees" on public.employees for select to anon using (true);

-- Insert default departments SAFELY (Checking by name)
insert into public.departments (name, code, description)
values ('Mayor''s Office', 'MO', 'Office of the Municipal Mayor')
on conflict (name) do nothing;

insert into public.departments (name, code, description)
values ('Human Resources', 'HR', 'Human Resource Management Office')
on conflict (name) do nothing;

insert into public.departments (name, code, description)
values ('Engineering', 'ENG', 'Municipal Engineering Office')
on conflict (name) do nothing;

insert into public.departments (name, code, description)
values ('Health', 'MHO', 'Municipal Health Office')
on conflict (name) do nothing;

insert into public.departments (name, code, description)
values ('Social Welfare', 'MSWDO', 'Municipal Social Welfare and Development Office')
on conflict (name) do nothing;

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'viewer')
  on conflict (id) do nothing; 
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger first if it exists to avoid error
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
