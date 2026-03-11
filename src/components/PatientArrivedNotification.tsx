import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PatientArrivedNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { permission, requestPermission, sendNotification } = usePushNotifications();
  const [alertedIds] = useState(() => new Set<string>());

  // Pedir permissão de notificação nativa assim que o componente monta
  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Som de notificação mais audível (2 beeps)
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
    } catch {}
  }, []);

  const triggerAlert = useCallback((name: string) => {
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
    if (!scheduleId || alertedIds.has(scheduleId)) return;
    alertedIds.add(scheduleId);

    if (clientId) {
      supabase.from('clients').select('name').eq('id', clientId).single()
        .then(({ data }) => triggerAlert(data?.name || 'Paciente'));
    } else {
      triggerAlert('Paciente');
    }
  }, [alertedIds, triggerAlert]);

  // Realtime: schedules UPDATE
  useEffect(() => {
    if (!user) return;

    const channel1 = supabase
      .channel('patient-arrivals-schedules')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'schedules',
        filter: `employee_id=eq.${user.id}`
      }, (payload) => {
        const rec = payload.new as any;
        if (rec?.patient_arrived) {
          handlePatientArrived(rec.id, rec.client_id);
          window.dispatchEvent(new CustomEvent('refresh-schedule'));
        }
      })
      .subscribe((status) => {
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
        if (rec?.notification_type === 'patient_arrived' || rec?.title?.includes('Chegou') || rec?.title?.includes('chegou')) {
          handlePatientArrived(rec.schedule_id, rec.client_id);
          window.dispatchEvent(new CustomEvent('refresh-schedule'));
        }
      })
      .subscribe((status) => {
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
        const { data } = await supabase
          .from('appointment_notifications')
          .select('id, schedule_id, client_id, notification_type, title')
          .eq('employee_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        for (const n of data || []) {
          if ((n.notification_type === 'patient_arrived' || n.title?.includes('Chegou') || n.title?.includes('chegou')) && !alertedIds.has(n.schedule_id)) {
            handlePatientArrived(n.schedule_id, n.client_id);
            window.dispatchEvent(new CustomEvent('refresh-schedule'));
          }
        }
      } catch {}
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [user?.id, alertedIds, handlePatientArrived]);

  return null;
}
