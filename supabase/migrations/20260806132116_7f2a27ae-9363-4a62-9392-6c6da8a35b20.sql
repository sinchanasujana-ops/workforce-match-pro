CREATE TYPE public.app_role AS ENUM ('worker', 'employer');
CREATE TYPE public.worker_category AS ENUM ('skilled', 'semi-skilled', 'unskilled');
CREATE TYPE public.application_status AS ENUM ('pending', 'shortlisted', 'hired', 'rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'worker',
  full_name text NOT NULL DEFAULT '',
  phone text,
  category public.worker_category,
  trade text,
  experience_years integer DEFAULT 0,
  location text,
  company_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category public.worker_category NOT NULL DEFAULT 'skilled',
  employer_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  wage text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active jobs" ON public.jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Employers can view their own jobs" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = employer_id);
CREATE POLICY "Employers can create jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Employers can update their own jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Employers can delete their own jobs" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = employer_id);

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, worker_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers can view their own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = worker_id);
CREATE POLICY "Employers can view applications for their jobs" ON public.applications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.employer_id = auth.uid()));
CREATE POLICY "Workers can apply" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Workers can withdraw their applications" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = worker_id);
CREATE POLICY "Employers can update applications for their jobs" ON public.applications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.employer_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.employer_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'worker'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.jobs (title, category, employer_name, location, wage, duration, description, skills) VALUES
('Senior Electrician', 'skilled', 'Sunrise Constructions', 'Bengaluru, Karnataka', '₹950 / day', '6 months', 'Lead electrical installation for a residential complex of 4 towers.', ARRAY['Wiring','Panel installation','Safety certified']),
('Plumber', 'skilled', 'GreenHomes Pvt Ltd', 'Pune, Maharashtra', '₹800 / day', '3 months', 'Plumbing work for villa project; daily wages plus food.', ARRAY['Pipe fitting','Bathroom fittings']),
('CNC Machine Operator', 'semi-skilled', 'Bharat Auto Parts', 'Chennai, Tamil Nadu', '₹22,000 / month', 'Permanent', 'Operate CNC lathe in auto parts manufacturing unit. Training provided.', ARRAY['CNC operation','Quality check']),
('Construction Helper', 'unskilled', 'Metro Infra', 'Hyderabad, Telangana', '₹550 / day', '8 months', 'Site helper for metro flyover project. Accommodation provided.', ARRAY['Hard working','Team player']),
('Tea Plantation Worker', 'unskilled', 'Hill Estate Co.', 'Munnar, Kerala', '₹450 / day', 'Seasonal', 'Tea leaf plucking season. Housing and meals included.', ARRAY['Outdoor work']),
('Welder (Arc & MIG)', 'skilled', 'SteelWorks India', 'Surat, Gujarat', '₹1,100 / day', '4 months', 'Skilled welder needed for industrial fabrication project.', ARRAY['Arc welding','MIG','Blueprint reading']);