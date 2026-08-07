CREATE TYPE public.document_kind AS ENUM ('id_proof', 'certificate', 'other');

CREATE TABLE public.worker_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.document_kind NOT NULL DEFAULT 'other',
  label text NOT NULL DEFAULT '',
  file_path text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  file_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX worker_documents_worker_id_idx ON public.worker_documents(worker_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_documents TO authenticated;
GRANT ALL ON public.worker_documents TO service_role;

ALTER TABLE public.worker_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage their own documents"
ON public.worker_documents FOR ALL TO authenticated
USING (auth.uid() = worker_id)
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Employers can view documents of their applicants"
ON public.worker_documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  WHERE a.worker_id = worker_documents.worker_id AND j.employer_id = auth.uid()
));

CREATE TRIGGER worker_documents_updated_at
BEFORE UPDATE ON public.worker_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies: files live under <worker_id>/...
CREATE POLICY "Workers can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'worker-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Workers can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'worker-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Workers can update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'worker-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'worker-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Workers can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'worker-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Employers can view applicant documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'worker-documents' AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.employer_id = auth.uid()
      AND a.worker_id::text = (storage.foldername(storage.objects.name))[1]
  )
);