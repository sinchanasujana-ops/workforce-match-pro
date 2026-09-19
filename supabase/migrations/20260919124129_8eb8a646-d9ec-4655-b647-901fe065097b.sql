CREATE TABLE public.application_rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT ''::text,
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_rankings TO authenticated;
GRANT ALL ON public.application_rankings TO service_role;

ALTER TABLE public.application_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view rankings for their jobs"
ON public.application_rankings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = application_rankings.job_id AND j.employer_id = auth.uid()));

CREATE POLICY "Employers can create rankings for their jobs"
ON public.application_rankings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = application_rankings.job_id AND j.employer_id = auth.uid()));

CREATE POLICY "Employers can update rankings for their jobs"
ON public.application_rankings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = application_rankings.job_id AND j.employer_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = application_rankings.job_id AND j.employer_id = auth.uid()));

CREATE POLICY "Employers can delete rankings for their jobs"
ON public.application_rankings FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = application_rankings.job_id AND j.employer_id = auth.uid()));

CREATE TRIGGER update_application_rankings_updated_at
BEFORE UPDATE ON public.application_rankings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_application_rankings_job ON public.application_rankings(job_id);