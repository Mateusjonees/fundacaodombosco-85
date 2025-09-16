import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface AppointmentReportData {
  scheduleId: string;
  employeeId: string;
  clientId: string;
  status: 'completed' | 'cancelled';
  duration?: number; // in hours
  materials?: any[];
  notes?: string;
  cancelReason?: string;
  cancelCategory?: string;
  // Novas propriedades para o sistema completo
  sessionDuration?: number; // in minutes
  clientProgress?: string;
  sessionValue?: number;
}

export const useReportUpdater = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const updateEmployeeReport = useCallback(async (data: AppointmentReportData) => {
    try {
      // Get schedule details to calculate duration
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('start_time, end_time, title, client_id, employee_id')
        .eq('id', data.scheduleId)
        .single();

      if (scheduleError) throw scheduleError;

      const startTime = new Date(schedule.start_time);
      const endTime = new Date(schedule.end_time);
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours

      // Create appointment session record for tracking
      const sessionData = {
        schedule_id: data.scheduleId,
        session_number: 1,
        session_duration: Math.round(duration * 60), // convert to minutes
        materials_used: data.materials || [],
        total_materials_cost: data.materials?.reduce((sum, material) => {
          return sum + (material.unit_cost || 0) * (material.quantity || 0);
        }, 0) || 0,
        session_notes: data.notes || '',
        created_by: user?.id
      };

      const { error: sessionError } = await supabase
        .from('appointment_sessions')
        .insert([sessionData]);

      if (sessionError) {
        console.error('Error creating appointment session:', sessionError);
      }

      // If appointment was cancelled, check for client loss pattern
      if (data.status === 'cancelled') {
        await checkClientLossPattern(data.clientId, data.employeeId);
      }

      // Log audit trail
      const auditData = {
        user_id: user?.id,
        entity_type: 'appointment_completion',
        entity_id: data.scheduleId,
        action: data.status === 'completed' ? 'appointment_completed' : 'appointment_cancelled',
        metadata: {
          employee_id: data.employeeId,
          client_id: data.clientId,
          duration_hours: duration,
          materials_count: data.materials?.length || 0,
          total_materials_cost: sessionData.total_materials_cost,
          cancel_reason: data.cancelReason,
          cancel_category: data.cancelCategory,
          timestamp: new Date().toISOString()
        }
      };

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert([auditData]);

      if (auditError) {
        console.error('Error creating audit log:', auditError);
      }

    } catch (error) {
      console.error('Error updating employee report:', error);
      toast({
        variant: "destructive",
        title: "Erro no Relatório",
        description: "Não foi possível atualizar as métricas do relatório.",
      });
    }
  }, [user, toast]);

  const checkClientLossPattern = useCallback(async (clientId: string, employeeId: string) => {
    try {
      // Get last 5 appointments for this client-employee combination
      const { data: recentAppointments, error } = await supabase
        .from('schedules')
        .select('status, start_time')
        .eq('client_id', clientId)
        .eq('employee_id', employeeId)
        .order('start_time', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Check if last 3 appointments were cancelled
      const lastThree = recentAppointments.slice(0, 3);
      const consecutiveCancellations = lastThree.filter(apt => apt.status === 'cancelled').length;

      if (consecutiveCancellations >= 3) {
        // Create client loss notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{
            user_id: employeeId,
            type: 'warning',
            title: 'Possível Perda de Cliente',
            message: `Atenção: Cliente teve 3 ou mais cancelamentos consecutivos. Considere uma avaliação da situação.`,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // expires in 7 days
          }]);

        if (notificationError) {
          console.error('Error creating loss notification:', notificationError);
        }

        // Also notify coordinators/directors
        const { data: coordinators } = await supabase
          .from('profiles')
          .select('user_id')
          .in('employee_role', ['director', 'coordinator_madre', 'coordinator_floresta'])
          .eq('is_active', true);

        if (coordinators) {
          const coordinatorNotifications = coordinators.map(coord => ({
            user_id: coord.user_id,
            type: 'warning',
            title: 'Alerta de Perda de Cliente',
            message: `Cliente com múltiplos cancelamentos consecutivos requer atenção.`,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }));

          await supabase
            .from('notifications')
            .insert(coordinatorNotifications);
        }
      }
    } catch (error) {
      console.error('Error checking client loss pattern:', error);
    }
  }, []);

  const recordMaterialsUsage = useCallback(async (materials: any[], scheduleId: string, clientId: string) => {
    if (!materials || materials.length === 0) return;

    try {
      const movements = materials.map(material => ({
        stock_item_id: material.stock_item_id,
        type: 'out',
        quantity: material.quantity,
        reason: 'Utilizado em atendimento',
        notes: `Atendimento - Agendamento ID: ${scheduleId}`,
        date: new Date().toISOString().split('T')[0],
        created_by: user?.id,
        client_id: clientId,
        schedule_id: scheduleId,
        session_number: 1
      }));

      const { error } = await supabase
        .from('stock_movements')
        .insert(movements);

      if (error) throw error;

      // Update stock quantities
      for (const material of materials) {
        const { data: currentItem } = await supabase
          .from('stock_items')
          .select('current_quantity')
          .eq('id', material.stock_item_id)
          .single();

        if (currentItem) {
          const newQuantity = Math.max(0, currentItem.current_quantity - material.quantity);
          await supabase
            .from('stock_items')
            .update({ current_quantity: newQuantity })
            .eq('id', material.stock_item_id);
        }
      }
    } catch (error) {
      console.error('Error recording materials usage:', error);
    }
  }, [user]);

  return {
    updateEmployeeReport,
    recordMaterialsUsage,
    checkClientLossPattern
  };
};