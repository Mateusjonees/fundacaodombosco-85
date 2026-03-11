import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export default function PatientArrivedNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alertedIds] = useState(() => new Set<string>());

  // Som simples de notificação
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  const triggerAlert = useCallback((name: string) => {
    playNotificationSound();

    toast({
      title: `🔔 ${name} chegou!`,
      description: `${name} está na recepção aguardando atendimento.`,
      duration: 15000,
    });

    // Push nativa se disponível
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 ${name} chegou!`, {
          body: `${name} está na recepção aguardando atendimento.`,
          tag: 'patient-arrived',
          requireInteraction: true,
        });
      } catch {}
    }
  }, [toast, playNotificationSound]);

  // Solicitar permissão de notificações nativas
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  // Componente não renderiza nada visualmente - usa apenas toasts
  return null;
}
