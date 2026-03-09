
-- Create program_definitions table
CREATE TABLE IF NOT EXISTS public.program_definitions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    fields jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create program_enrollments table
CREATE TABLE IF NOT EXISTS public.program_enrollments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id uuid REFERENCES public.program_definitions(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'Active',
    enrollment_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.program_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for authenticated users for now)
CREATE POLICY "Enable read access for authenticated users" ON public.program_definitions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.program_definitions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.program_definitions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON public.program_definitions
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.program_enrollments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.program_enrollments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.program_enrollments
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON public.program_enrollments
    FOR DELETE TO authenticated USING (true);
