import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Bell } from 'lucide-react';
import { mostrarNotificacao } from '@/components/notifications/NotificationProvider';

interface PatientPresenceButtonProps {
  scheduleId: string;
  clientName: string;
  employeeId: string;
  patientArrived: boolean;
  arrivedAt?: string;
  onPresenceUpdate: () => void;
}

export default function PatientPresenceButton({
  scheduleId,
  clientName,
  employeeId,
  patientArrived,
  arrivedAt,
  onPresenceUpdate
}: PatientPresenceButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirmPresence = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Attempting to confirm presence for schedule:', scheduleId);
      
      // Update schedule to mark patient as arrived
      const { error: updateError } = await supabase
        .from('schedules')
        .update({
          patient_arrived: true,
          arrived_at: new Date().toISOString(),
          arrived_confirmed_by: user.id
        })
        .eq('id', scheduleId);

      if (updateError) {
        console.error('Error updating schedule:', updateError);
        throw updateError;
      }

      console.log('Schedule updated successfully');

      // Buscar client_id do schedule
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('client_id')
        .eq('id', scheduleId)
        .single();

      const clientId = scheduleData?.client_id;

      if (clientId) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const { error: notificationError } = await supabase
          .from('appointment_notifications')
          .insert({
            schedule_id: scheduleId,
            employee_id: employeeId,
            client_id: clientId,
            title: 'Paciente chegou',
            message: `${clientName} chegou para o atendimento e está aguardando.`,
            notification_type: 'patient_arrived',
            appointment_date: today,
            appointment_time: now,
            created_by: user.id,
            metadata: { patient_name: clientName, arrived_at: new Date().toISOString() }
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        } else {
          console.log('Patient arrival notification created successfully');
        }
      }

      mostrarNotificacao('Paciente chegou', `${clientName} chegou para atendimento`, {
        dedupeKey: `patient-arrived-${scheduleId}`,
        tag: `patient-arrived-${scheduleId}`,
        url: '/schedule',
      });

      toast({
        title: "Presença Confirmada!",
        description: `Presença de ${clientName} confirmada. Profissional foi notificado.`,
      });

      onPresenceUpdate();
    } catch (error) {
      console.error('Error confirming patient presence:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao confirmar presença: ${error.message || 'Erro desconhecido'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    // Create audio context and play a notification beep
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = audioContext.createGain();
      const oscillator = audioContext.createOscillator();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800Hz bell-like sound
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  if (patientArrived) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Chegou
        </Badge>
        {arrivedAt && (
          <span className="text-xs text-muted-foreground">
            às {new Date(arrivedAt).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleConfirmPresence}
      disabled={loading}
      className="text-blue-600 border-blue-200 hover:bg-blue-50"
    >
      <Bell className="h-4 w-4 mr-1" />
      {loading ? 'Confirmando...' : 'Confirmar Presença'}
    </Button>
  );
}