CREATE TABLE public.clinical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  doc_type text NOT NULL,
  title text,
  content text NOT NULL DEFAULT '',
  doc_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_documents TO authenticated;
GRANT ALL ON public.clinical_documents TO service_role;

ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinical_documents_select" ON public.clinical_documents
FOR SELECT TO authenticated
USING (
  employee_id = auth.uid()
  OR public.is_manager()
  OR public.is_director()
  OR public.can_view_all_clients()
  OR public.is_assigned_to_client(client_id)
);

CREATE POLICY "clinical_documents_insert" ON public.clinical_documents
FOR INSERT TO authenticated
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "clinical_documents_update" ON public.clinical_documents
FOR UPDATE TO authenticated
USING (employee_id = auth.uid() OR public.is_manager() OR public.is_director())
WITH CHECK (employee_id = auth.uid() OR public.is_manager() OR public.is_director());

CREATE POLICY "clinical_documents_delete" ON public.clinical_documents
FOR DELETE TO authenticated
USING (employee_id = auth.uid() OR public.is_manager() OR public.is_director());

CREATE INDEX idx_clinical_documents_client ON public.clinical_documents(client_id);

CREATE TRIGGER update_clinical_documents_updated_at
BEFORE UPDATE ON public.clinical_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();