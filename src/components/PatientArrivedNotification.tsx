import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PatientArrivedNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { permission, isSupported, requestPermission, sendNotification } = usePushNotifications();
  const [alertedIds] = useState(() => new Set<string>());

  // Log de montagem
  useEffect(() => {
    console.log('[PatientArrived] Componente montado, user:', user?.id?.slice(0, 8));
    console.log('[PatientArrived] Notification API suportada:', isSupported);
    console.log('[PatientArrived] Permissão atual:', permission);
  }, [user, isSupported, permission]);

  // Pedir permissão de notificação nativa
  useEffect(() => {
    if (permission === 'default' && isSupported) {
      console.log('[PatientArrived] Solicitando permissão de notificação...');
      requestPermission();
    }
  }, [permission, isSupported, requestPermission]);

  // Som de notificação audível (2 beeps)
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (startTime: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };
      playBeep(ctx.currentTime, 880);
      playBeep(ctx.currentTime + 0.35, 1100);
      console.log('[PatientArrived] 🔊 Som tocado');
    } catch (e) {
      console.warn('[PatientArrived] Erro ao tocar som:', e);
    }
  }, []);

  const triggerAlert = useCallback((name: string) => {
    console.log('[PatientArrived] 🔔 triggerAlert para:', name);

    // Som
    playNotificationSound();

    // Toast interno do app
    toast({
      title: `🔔 ${name} chegou!`,
      description: `${name} está na recepção aguardando atendimento.`,
      duration: 15000,
    });

    // Notificação nativa do Windows/OS (estilo WhatsApp)
    sendNotification(`🔔 ${name} chegou!`, {
      body: `${name} está na recepção aguardando atendimento.`,
      tag: `patient-arrived-${Date.now()}`,
      url: '/schedule',
    });
  }, [toast, playNotificationSound, sendNotification]);

  const handlePatientArrived = useCallback((scheduleId: string, clientId: string | null) => {
    if (!scheduleId || alertedIds.has(scheduleId)) {
      console.log('[PatientArrived] Schedule já alertado ou inválido:', scheduleId);
      return;
    }
    alertedIds.add(scheduleId);
    console.log('[PatientArrived] Processando chegada, schedule:', scheduleId);

    if (clientId) {
      supabase.from('clients').select('name').eq('id', clientId).single()
        .then(({ data, error }) => {
          if (error) console.warn('[PatientArrived] Erro ao buscar cliente:', error);
          triggerAlert(data?.name || 'Paciente');
        });
    } else {
      triggerAlert('Paciente');
    }
  }, [alertedIds, triggerAlert]);

  // Realtime: schedules UPDATE
  useEffect(() => {
    if (!user) return;

    console.log('[PatientArrived] Configurando canais Realtime para user:', user.id.slice(0, 8));

    const channel1 = supabase
      .channel('patient-arrivals-schedules')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'schedules',
        filter: `employee_id=eq.${user.id}`
      }, (payload) => {
        const rec = payload.new as any;
        console.log('[PatientArrived] Realtime schedules UPDATE:', rec?.id, 'patient_arrived:', rec?.patient_arrived);
        if (rec?.patient_arrived) {
          handlePatientArrived(rec.id, rec.client_id);
          window.dispatchEvent(new CustomEvent('refresh-schedule'));
        }
      })
      .subscribe((status) => {
        console.log('[PatientArrived] Canal schedules status:', status);
        if (status === 'CHANNEL_ERROR') {
          setTimeout(() => channel1.subscribe(), 3000);
        }
      });

    const channel2 = supabase
      .channel('patient-arrivals-notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'appointment_notifications',
        filter: `employee_id=eq.${user.id}`
      }, (payload) => {
        const rec = payload.new as any;
        console.log('[PatientArrived] Realtime notification INSERT:', rec?.notification_type, rec?.title);
        if (rec?.notification_type === 'patient_arrived' || rec?.title?.includes('Chegou') || rec?.title?.includes('chegou')) {
          handlePatientArrived(rec.schedule_id, rec.client_id);
          window.dispatchEvent(new CustomEvent('refresh-schedule'));
        }
      })
      .subscribe((status) => {
        console.log('[PatientArrived] Canal notifications status:', status);
        if (status === 'CHANNEL_ERROR') {
          setTimeout(() => channel2.subscribe(), 3000);
        }
      });

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [user?.id, handlePatientArrived]);

  // Polling fallback a cada 10s
  useEffect(() => {
    if (!user) return;

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('appointment_notifications')
          .select('id, schedule_id, client_id, notification_type, title')
          .eq('employee_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.warn('[PatientArrived] Polling erro:', error.message);
          return;
        }

        for (const n of data || []) {
          if ((n.notification_type === 'patient_arrived' || n.title?.includes('Chegou') || n.title?.includes('chegou')) && !alertedIds.has(n.schedule_id)) {
            console.log('[PatientArrived] Polling encontrou chegada:', n.schedule_id);
            handlePatientArrived(n.schedule_id, n.client_id);
            window.dispatchEvent(new CustomEvent('refresh-schedule'));
          }
        }
      } catch (e) {
        console.warn('[PatientArrived] Polling exception:', e);
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [user?.id, alertedIds, handlePatientArrived]);

  return null;
}
