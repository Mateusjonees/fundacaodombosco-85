import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { offlineDB, STORES } from '@/utils/offlineDB';
import { addToSyncQueue } from '@/utils/syncQueue';

interface MedicalRecord {
  id: string;
  client_id: string;
  employee_id: string;
  session_date: string;
  session_type: string;
  session_duration?: number;
  progress_notes: string;
  treatment_plan?: string;
  symptoms?: string;
  vital_signs?: any;
  medications?: any[];
  attachments?: any[];
  status?: string;
  next_appointment_notes?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    employee_role: string;
  };
}

/**
 * Hook para carregar prontuários com cache offline
 */
export const useMedicalRecords = (clientId: string | null) => {
  return useQuery({
    queryKey: ['medical-records', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      if (navigator.onLine) {
        try {
          const { data: records, error } = await supabase
            .from('medical_records')
            .select('*')
            .eq('client_id', clientId)
            .order('session_date', { ascending: false });

          if (error) throw error;
          if (!records || records.length === 0) return [];

          const employeeIds = [...new Set(records.map(r => r.employee_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, name, employee_role')
            .in('user_id', employeeIds);

          const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
          const result = records.map(record => ({
            ...record,
            profiles: profilesMap.get(record.employee_id)
          })) as MedicalRecord[];

          // Cache offline
          await offlineDB.putMany(STORES.medicalRecords, result).catch(() => {});
          return result;
        } catch (err) {
          console.warn('[useMedicalRecords] Erro online, tentando cache:', err);
        }
      }

      // Fallback offline
      const cached = await offlineDB.getAll<MedicalRecord>(STORES.medicalRecords);
      return cached
        .filter(r => r.client_id === clientId)
        .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    },
    enabled: !!clientId,
    staleTime: 30000,
  });
};

/**
 * Hook para criar novo registro no prontuário (com suporte offline)
 */
export const useCreateMedicalRecord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (record: any) => {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('medical_records')
          .insert([record])
          .select()
          .single();
        if (error) throw error;
        await offlineDB.put(STORES.medicalRecords, data).catch(() => {});
        return data;
      }

      // Offline
      const tempId = crypto.randomUUID();
      const localData = { ...record, id: tempId, _offline: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await offlineDB.put(STORES.medicalRecords, localData);
      await addToSyncQueue('medical_records', 'insert', record);
      return localData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', variables.client_id] });
      toast({
        title: 'Sucesso',
        description: navigator.onLine ? 'Registro adicionado ao prontuário' : 'Registro salvo offline — será sincronizado',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o registro',
        variant: 'destructive',
      });
      console.error('Error creating medical record:', error);
    },
  });
};

/**
 * Hook para atualizar registro do prontuário (com suporte offline)
 */
export const useUpdateMedicalRecord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MedicalRecord> & { id: string }) => {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('medical_records')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        await offlineDB.put(STORES.medicalRecords, data).catch(() => {});
        return data;
      }

      // Offline
      const existing = await offlineDB.get<any>(STORES.medicalRecords, id);
      const merged = { ...existing, ...updates, id, updated_at: new Date().toISOString() };
      await offlineDB.put(STORES.medicalRecords, merged);
      await addToSyncQueue('medical_records', 'update', updates, id);
      return merged;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', data.client_id] });
      toast({
        title: 'Sucesso',
        description: navigator.onLine ? 'Registro atualizado' : 'Atualização salva offline',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o registro',
        variant: 'destructive',
      });
      console.error('Error updating medical record:', error);
    },
  });
};
