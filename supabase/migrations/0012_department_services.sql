
CREATE TABLE IF NOT EXISTS public.department_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes integer NOT NULL DEFAULT 15,
    requirements text[],
    status text DEFAULT 'Active',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.department_services ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for authenticated users for now)
CREATE POLICY "Enable read access for authenticated users" ON public.department_services
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.department_services
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.department_services
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON public.department_services
    FOR DELETE TO authenticated USING (true);
