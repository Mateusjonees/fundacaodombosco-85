import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell } from 'lucide-react';

export default function PatientArrivedNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendNotification, requestPermission } = usePushNotifications();
  const [showFullScreenAlert, setShowFullScreenAlert] = useState(false);
  const [patientName, setPatientName] = useState<string>('');
  const [alertedIds] = useState(() => new Set<string>());
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Som de alarme máximo - sirene agressiva com volume 1.0
  const playAlarmSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'square';
        // Volume MÁXIMO = 1.0
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);

        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };

      // 5 ciclos de sirene (antes eram 3)
      for (let cycle = 0; cycle < 5; cycle++) {
        const offset = cycle * 1.4;
        playTone(600, offset + 0.0, 0.12);
        playTone(750, offset + 0.12, 0.12);
        playTone(900, offset + 0.24, 0.12);
        playTone(1050, offset + 0.36, 0.12);
        playTone(1200, offset + 0.48, 0.15);
        playTone(1050, offset + 0.63, 0.12);
        playTone(900, offset + 0.75, 0.12);
        playTone(750, offset + 0.87, 0.12);
        playTone(600, offset + 0.99, 0.15);
      }
    } catch (error) {
      console.log('Could not play alarm sound:', error);
    }
  }, []);

  // Vibração intensa
  const vibrateDevice = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500, 200, 800, 300, 800, 300, 800]);
      }
    } catch {}
  }, []);

  // Piscar título da aba
  const flashBrowserTab = useCallback(() => {
    const originalTitle = document.title;
    let count = 0;
    const maxFlashes = 40; // mais flashes (30s / 0.8s)

    const interval = setInterval(() => {
      document.title = count % 2 === 0
        ? '🔔 PACIENTE CHEGOU!!!'
        : '⚠️ ATENÇÃO - PACIENTE AGUARDANDO';
      count++;
      if (count >= maxFlashes) {
        clearInterval(interval);
        document.title = originalTitle;
      }
    }, 800);

    const onFocus = () => {
      clearInterval(interval);
      document.title = originalTitle;
      window.removeEventListener('focus', onFocus);
    };
    window.addEventListener('focus', onFocus);
  }, []);

  // Parar alarme repetido
  const stopRepeatingAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
  }, []);

  const dismissAlert = useCallback(() => {
    setShowFullScreenAlert(false);
    stopRepeatingAlarm();
    if ('vibrate' in navigator) navigator.vibrate(0);
  }, [stopRepeatingAlarm]);

  const triggerMaxAlert = useCallback((name: string) => {
    setPatientName(name);

    // 1. Toast persistente
    toast({
      title: `🔔🔔🔔 ${name.toUpperCase()} CHEGOU! 🔔🔔🔔`,
      description: `${name} chegou e está aguardando atendimento!`,
      duration: 30000,
    });

    // 2. Push nativa
    sendNotification(`🔔 ${name} CHEGOU!`, {
      body: `${name} chegou e está aguardando atendimento!`,
      tag: 'patient-arrived',
      requireInteraction: true,
    });

    // 3. Som imediato + repetição a cada 5s por 30s
    playAlarmSound();
    stopRepeatingAlarm();
    alarmIntervalRef.current = setInterval(() => {
      playAlarmSound();
      vibrateDevice();
    }, 5000);

    // 4. Vibrar
    vibrateDevice();

    // 5. Fullscreen
    setShowFullScreenAlert(true);

    // 6. Piscar aba
    flashBrowserTab();

    // Auto-parar após 30s
    alertTimeoutRef.current = setTimeout(() => {
      setShowFullScreenAlert(false);
      stopRepeatingAlarm();
    }, 30000);
  }, [toast, sendNotification, playAlarmSound, vibrateDevice, flashBrowserTab, stopRepeatingAlarm]);

  // Solicitar permissão de notificações nativas ao montar
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!user) return;

    // Handler compartilhado para processar chegada
    const handlePatientArrived = (scheduleId: string, clientId: string | null) => {
      if (!scheduleId || alertedIds.has(scheduleId)) return;
      alertedIds.add(scheduleId);

      if (clientId) {
        supabase.from('clients').select('name').eq('id', clientId).single()
          .then(({ data }) => triggerMaxAlert(data?.name || 'Paciente'));
      } else {
        triggerMaxAlert('Paciente');
      }
    };

    // CANAL 1: Listener em schedules (UPDATE patient_arrived)
    const channel1 = supabase
      .channel('patient-arrivals-schedules')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'schedules',
          filter: `employee_id=eq.${user.id}`
        },
        (payload) => {
          const rec = payload.new as any;
          if (rec?.patient_arrived) {
            handlePatientArrived(rec.id, rec.client_id);
          }
        }
      )
      .subscribe();

    // CANAL 2: Listener em appointment_notifications (INSERT)
    const channel2 = supabase
      .channel('patient-arrivals-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointment_notifications',
          filter: `employee_id=eq.${user.id}`
        },
        (payload) => {
          const rec = payload.new as any;
          // Detectar notificações de chegada pelo tipo ou título
          if (rec?.notification_type === 'patient_arrived' || rec?.title?.includes('Chegou') || rec?.title?.includes('chegou')) {
            handlePatientArrived(rec.schedule_id, rec.client_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      stopRepeatingAlarm();
    };
  }, [user?.id, alertedIds, triggerMaxAlert, stopRepeatingAlarm]);

  if (!showFullScreenAlert) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
      onClick={dismissAlert}
      style={{
        animation: 'flashAlert 0.4s ease-in-out infinite alternate',
      }}
    >
      <style>{`
        @keyframes flashAlert {
          0% { background: rgba(220, 38, 38, 0.95); }
          50% { background: rgba(234, 179, 8, 0.95); }
          100% { background: rgba(220, 38, 38, 0.95); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>

      <div
        className="text-center p-8 rounded-2xl max-w-lg mx-4"
        style={{
          background: 'rgba(255, 255, 255, 0.97)',
          animation: 'bounceIn 0.5s ease-out, shake 0.8s ease-in-out 0.5s 3',
          boxShadow: '0 0 80px rgba(255, 255, 255, 0.6)',
        }}
      >
        <div className="flex justify-center mb-4">
          <Bell className="h-24 w-24 text-red-600 animate-bounce" />
        </div>
        <h1 className="text-4xl font-black text-red-600 mb-3 tracking-tight">
          {patientName ? `${patientName.toUpperCase()} CHEGOU!` : 'PACIENTE CHEGOU!'}
        </h1>
        <p className="text-xl text-gray-700 font-semibold mb-6">
          {patientName ? `${patientName} está aguardando atendimento` : 'Seu paciente está aguardando atendimento'}
        </p>
        <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-6">
          <p className="text-red-700 font-bold text-lg animate-pulse">
            ⚠️ ATENÇÃO IMEDIATA NECESSÁRIA ⚠️
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Clique em qualquer lugar para fechar este alerta
        </p>
      </div>
    </div>
  );
}
