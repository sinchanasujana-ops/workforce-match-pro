CREATE UNIQUE INDEX IF NOT EXISTS applications_job_worker_unique ON public.applications (job_id, worker_id);

CREATE POLICY "Employers can view profiles of their applicants"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.worker_id = profiles.id
      AND j.employer_id = auth.uid()
  )
);