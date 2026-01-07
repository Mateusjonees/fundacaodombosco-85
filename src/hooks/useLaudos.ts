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
  employee?: { name: string; employee_role: string };
}

export const useLaudos = (clientId: string | null) => {
  return useQuery({
    queryKey: ['laudos', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('client_laudos')
        .select('*')
        .eq('client_id', clientId)
        .order('laudo_date', { ascending: false });

      if (error) throw error;

      // Fetch employee profiles
      if (data && data.length > 0) {
        const employeeIds = [...new Set(data.map(l => l.employee_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, employee_role')
          .in('user_id', employeeIds);

        return data.map(laudo => ({
          ...laudo,
          employee: profiles?.find(p => p.user_id === laudo.employee_id)
        })) as Laudo[];
      }

      return [] as Laudo[];
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
