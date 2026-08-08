CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

ALTER TABLE public.worker_documents
  ADD COLUMN verification_status public.verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN verified_at timestamp with time zone,
  ADD COLUMN verification_note text;

CREATE OR REPLACE FUNCTION public.protect_document_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.verification_status := 'pending';
      NEW.verified_at := NULL;
      NEW.verification_note := NULL;
    ELSE
      NEW.verification_status := OLD.verification_status;
      NEW.verified_at := OLD.verified_at;
      NEW.verification_note := OLD.verification_note;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER worker_documents_protect_verification
BEFORE INSERT OR UPDATE ON public.worker_documents
FOR EACH ROW EXECUTE FUNCTION public.protect_document_verification();