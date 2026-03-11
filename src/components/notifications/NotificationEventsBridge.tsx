import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { mostrarNotificacao } from '@/components/notifications/NotificationProvider';

interface AppointmentNotificationRow {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  created_at: string;
  schedule_id: string;
  appointment_time: string;
  metadata?: {
    patient_name?: string;
    client_name?: string;
  } | null;
}

const getNotificationContent = (notification: AppointmentNotificationRow) => {
  const patientName = notification.metadata?.patient_name || notification.metadata?.client_name || 'Paciente';

  if (notification.notification_type === 'patient_arrived') {
    return {
      titulo: 'Paciente chegou',
      mensagem: `${patientName} chegou para atendimento`,
    };
  }

  if (notification.notification_type === 'new_appointment') {
    return {
      titulo: 'Novo agendamento',
      mensagem: `📅 Novo agendamento criado para ${patientName} às ${notification.appointment_time}`,
    };
  }

  return {
    titulo: notification.title || 'Sistema Clínico',
    mensagem: notification.message || 'Você recebeu uma nova notificação.',
  };
};

export const NotificationEventsBridge = () => {
  const { user } = useAuth();
  const sessionStartedAtRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    const processNotification = (notification: AppointmentNotificationRow) => {
      const notificationTime = new Date(notification.created_at).getTime();
      if (notificationTime < sessionStartedAtRef.current - 15000) return;

      const { titulo, mensagem } = getNotificationContent(notification);
      mostrarNotificacao(titulo, mensagem, {
        dedupeKey: notification.id,
        tag: notification.id,
        url: '/schedule',
      });
    };

    const channel = supabase
      .channel(`global-appointment-notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointment_notifications',
        filter: `employee_id=eq.${user.id}`,
      }, (payload) => {
        processNotification(payload.new as AppointmentNotificationRow);
      })
      .subscribe((status) => {
        console.log('[NotificationBridge] Canal appointment_notifications:', status);
      });

    const pollNotifications = async () => {
      const { data, error } = await supabase
        .from('appointment_notifications')
        .select('id, title, message, notification_type, created_at, schedule_id, appointment_time, metadata')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('[NotificationBridge] Erro no polling:', error.message);
        return;
      }

      (data || []).forEach((notification) => processNotification(notification as AppointmentNotificationRow));
    };

    pollNotifications();
    const interval = window.setInterval(pollNotifications, 15000);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};
