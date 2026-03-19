import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Laudo {
  id: string;
  client_id: string;
  employee_id: string;
  laudo_date: string;
  laudo_type: string;
  title: string;
  description?: string;
  file_path?: string;
  status: string;
  created_at: string;
  updated_at: string;
  source?: 'client_laudos' | 'feedback_control';
  employee?: { name: string; employee_role: string };
}

export const useLaudos = (clientId: string | null) => {
  return useQuery({
    queryKey: ['laudos', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const [laudosResponse, feedbackResponse] = await Promise.all([
        supabase
          .from('client_laudos')
          .select('*')
          .eq('client_id', clientId),
        supabase
          .from('client_feedback_control')
          .select('id, client_id, assigned_to, completed_by, completed_at, created_at, updated_at, notes, status, laudo_file_path')
          .eq('client_id', clientId)
          .or('laudo_file_path.not.is.null,status.eq.completed')
      ]);

      if (laudosResponse.error) throw laudosResponse.error;
      if (feedbackResponse.error) throw feedbackResponse.error;

      const feedbackLaudos: Laudo[] = (feedbackResponse.data || []).map((feedback) => ({
        id: `feedback-${feedback.id}`,
        client_id: feedback.client_id,
        employee_id: feedback.completed_by || feedback.assigned_to || '',
        laudo_date: feedback.completed_at || feedback.created_at,
        laudo_type: 'neuropsicologico',
        title: 'Laudo de devolutiva',
        description: feedback.notes || undefined,
        file_path: feedback.laudo_file_path || undefined,
        status: feedback.status || 'completed',
        created_at: feedback.created_at,
        updated_at: feedback.updated_at,
        source: 'feedback_control'
      }));

      const mergedLaudos: Laudo[] = [
        ...((laudosResponse.data || []).map((laudo) => ({
          ...laudo,
          status: laudo.status || 'active',
          source: 'client_laudos' as const
        })) as Laudo[]),
        ...feedbackLaudos
      ].sort((a, b) => new Date(b.laudo_date).getTime() - new Date(a.laudo_date).getTime());

      if (mergedLaudos.length === 0) {
        return [] as Laudo[];
      }

      const employeeIds = [...new Set(mergedLaudos.map((laudo) => laudo.employee_id).filter(Boolean))];

      if (employeeIds.length === 0) {
        return mergedLaudos;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role')
        .in('user_id', employeeIds);

      return mergedLaudos.map((laudo) => ({
        ...laudo,
        employee: profiles?.find((profile) => profile.user_id === laudo.employee_id)
      })) as Laudo[];
    },
    enabled: !!clientId
  });
};

export const useCreateLaudo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (laudo: {
      client_id: string;
      employee_id: string;
      laudo_date: string;
      laudo_type: string;
      title: string;
      description?: string;
      file_path?: string;
    }) => {
      const { data, error } = await supabase
        .from('client_laudos')
        .insert([laudo])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['laudos', variables.client_id] });
      toast({
        title: 'Sucesso',
        description: 'Laudo cadastrado com sucesso!'
      });
    },
    onError: (error) => {
      console.error('Error creating laudo:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível cadastrar o laudo.'
      });
    }
  });
};

export const useUpdateLaudo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId, ...updates }: { id: string; clientId: string } & Partial<Laudo>) => {
      const { data, error } = await supabase
        .from('client_laudos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, clientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['laudos', result.clientId] });
      toast({
        title: 'Sucesso',
        description: 'Laudo atualizado com sucesso!'
      });
    },
    onError: (error) => {
      console.error('Error updating laudo:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o laudo.'
      });
    }
  });
};

export const useDeleteLaudo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_laudos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { clientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['laudos', result.clientId] });
      toast({
        title: 'Sucesso',
        description: 'Laudo excluído com sucesso!'
      });
    },
    onError: (error) => {
      console.error('Error deleting laudo:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o laudo.'
      });
    }
  });
};
