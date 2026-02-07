import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PatientArrivedNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendNotification } = usePushNotifications();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('patient-arrivals')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'schedules',
          filter: `employee_id=eq.${user.id}`
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          if (!oldRecord?.patient_arrived && newRecord?.patient_arrived) {            
            toast({
              title: "🔔 Paciente Chegou!",
              description: `Seu próximo paciente chegou e está aguardando.`,
              duration: 10000,
            });

            // Notificação push nativa (funciona fora do sistema)
            sendNotification('🔔 Paciente Chegou!', {
              body: 'Seu próximo paciente chegou e está aguardando.',
              tag: 'patient-arrived',
              requireInteraction: true,
            });

            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, sendNotification]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (frequency: number, delay: number) => {
        setTimeout(() => {
          const gainNode = audioContext.createGain();
          const oscillator = audioContext.createOscillator();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        }, delay);
      };

      playBeep(800, 0);
      playBeep(600, 200);
      playBeep(800, 400);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  return null;
}
