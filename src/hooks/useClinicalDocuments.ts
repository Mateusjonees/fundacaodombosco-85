import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClinicalDocument {
  id: string;
  client_id: string;
  employee_id: string;
  doc_type: string;
  title?: string | null;
  content: string;
  doc_date: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  employee?: {
    name: string;
    employee_role: string;
    professional_license?: string | null;
    professional_rqe?: string | null;
  };
}

/** Documentos clínicos emitidos (encaminhamento, exame, atestado, comparecimento) */
export const useClinicalDocuments = (clientId: string | null) =>
  useQuery({
    queryKey: ['clinical-documents', clientId],
    queryFn: async () => {
      if (!clientId) return [] as ClinicalDocument[];

      const { data, error } = await (supabase.from('clinical_documents' as any) as any)
        .select('*')
        .eq('client_id', clientId)
        .order('doc_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [] as ClinicalDocument[];

      const employeeIds = [...new Set(data.map((d: any) => d.employee_id))];
      const { data: profiles } = await (supabase.from('profiles_public') as any)
        .select('user_id, name, employee_role, professional_license, professional_rqe')
        .in('user_id', employeeIds);

      return data.map((d: any) => ({
        ...d,
        employee: profiles?.find((p: any) => p.user_id === d.employee_id),
      })) as ClinicalDocument[];
    },
    enabled: !!clientId,
    staleTime: 30000,
  });

export const useCreateClinicalDocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      client_id: string;
      employee_id: string;
      doc_type: string;
      title?: string | null;
      content: string;
      doc_date: string;
      metadata?: any;
    }) => {
      const { data, error } = await (supabase.from('clinical_documents' as any) as any)
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-documents', variables.client_id] });
      toast({ title: 'Documento emitido', description: 'O documento foi salvo no histórico do paciente.' });
    },
    onError: (error) => {
      console.error('Erro ao emitir documento clínico:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível emitir o documento.' });
    },
  });
};

export const useDeleteClinicalDocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id }: { id: string; client_id: string }) => {
      const { error } = await (supabase.from('clinical_documents' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-documents', variables.client_id] });
      toast({ title: 'Documento excluído' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir o documento.' });
    },
  });
};
