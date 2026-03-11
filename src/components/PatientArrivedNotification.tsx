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

  // Limpar timeout ao desmontar

  const dismissAlert = useCallback(() => {
    setShowFullScreenAlert(false);
    if ('vibrate' in navigator) navigator.vibrate(0);
  }, []);

  const triggerMaxAlert = useCallback((name: string) => {
    setPatientName(name);

    // 1. Toast persistente
    toast({
      title: `🔔🔔🔔 ${name.toUpperCase()} CHEGOU! 🔔🔔🔔`,
      description: `${name} chegou e está aguardando atendimento!`,
      duration: 30000,
    });

    // 2. Push nativa - clique abre a agenda
    sendNotification(`🚨 PACIENTE CHEGOU: ${name}`, {
      body: `${name} acabou de chegar e está aguardando atendimento.\nClique aqui para abrir a agenda.`,
      tag: 'patient-arrived',
      requireInteraction: true,
      url: '/schedule',
    });

    // 3. Som único + vibração
    playAlarmSound();
    vibrateDevice();

    // 4. Fullscreen
    setShowFullScreenAlert(true);

    // 5. Piscar aba
    flashBrowserTab();

    // Auto-fechar após 30s
    alertTimeoutRef.current = setTimeout(() => {
      setShowFullScreenAlert(false);
    }, 30000);
  }, [toast, sendNotification, playAlarmSound, vibrateDevice, flashBrowserTab]);

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
          console.log('[PatientArrived] Schedule UPDATE received:', rec?.id, 'patient_arrived:', rec?.patient_arrived);
          if (rec?.patient_arrived) {
            handlePatientArrived(rec.id, rec.client_id);
            // Disparar evento para refetch da agenda
            window.dispatchEvent(new CustomEvent('refresh-schedule'));
          }
        }
      )
      .subscribe((status) => {
        console.log('[PatientArrived] Channel schedules status:', status);
      });

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
          console.log('[PatientArrived] Notification INSERT received:', rec?.notification_type, rec?.title);
          // Detectar notificações de chegada pelo tipo ou título
          if (rec?.notification_type === 'patient_arrived' || rec?.title?.includes('Chegou') || rec?.title?.includes('chegou')) {
            handlePatientArrived(rec.schedule_id, rec.client_id);
            // Disparar evento para refetch da agenda
            window.dispatchEvent(new CustomEvent('refresh-schedule'));
          }
        }
      )
      .subscribe((status) => {
        console.log('[PatientArrived] Channel notifications status:', status);
      });

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [user?.id, alertedIds, triggerMaxAlert]);

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
          0%, 100% { background: rgba(220, 38, 38, 0.97); }
          25% { background: rgba(234, 179, 8, 0.97); }
          50% { background: rgba(220, 38, 38, 0.97); }
          75% { background: rgba(255, 100, 0, 0.97); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-12px); }
          20%, 40%, 60%, 80% { transform: translateX(12px); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70% { box-shadow: 0 0 0 30px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes bellSwing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(25deg); }
          30% { transform: rotate(-20deg); }
          45% { transform: rotate(15deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,200,0,0.6); }
          50% { text-shadow: 0 0 40px rgba(255,255,255,1), 0 0 80px rgba(255,200,0,0.9); }
        }
      `}</style>

      {/* Borda pulsante nas laterais */}
      <div className="absolute inset-0 border-[8px] border-white/40 animate-pulse rounded-none pointer-events-none" />

      <div
        className="text-center p-10 rounded-3xl max-w-xl mx-4 relative"
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          animation: 'bounceIn 0.4s ease-out, shake 0.7s ease-in-out 0.4s 3',
          boxShadow: '0 0 100px rgba(255, 255, 255, 0.7), 0 0 200px rgba(255, 200, 0, 0.3)',
        }}
      >
        {/* Ícone do sino gigante */}
        <div 
          className="flex justify-center mb-6"
          style={{ animation: 'bellSwing 0.6s ease-in-out infinite' }}
        >
          <div 
            className="relative rounded-full bg-red-600 p-6"
            style={{ animation: 'pulseRing 1.2s ease-out infinite' }}
          >
            <Bell className="h-20 w-20 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Título principal - enorme */}
        <div className="mb-2">
          <p className="text-base font-bold uppercase tracking-[0.3em] text-red-500 mb-2">
            🚨 ATENÇÃO 🚨
          </p>
          <h1 
            className="text-5xl sm:text-6xl font-black text-red-600 leading-tight tracking-tight"
            style={{ animation: 'textGlow 1.5s ease-in-out infinite' }}
          >
            {patientName ? patientName.toUpperCase() : 'PACIENTE'}
          </h1>
          <h2 className="text-4xl sm:text-5xl font-black text-red-600 mt-1">
            CHEGOU!
          </h2>
        </div>

        {/* Subtítulo */}
        <p className="text-lg text-gray-700 font-semibold mt-4 mb-6">
          {patientName 
            ? `${patientName} está na recepção aguardando atendimento` 
            : 'Seu paciente está na recepção aguardando'}
        </p>

        {/* Box de urgência */}
        <div className="bg-red-600 rounded-2xl p-5 mb-6 animate-pulse">
          <p className="text-white font-black text-xl tracking-wide">
            ⚡ ATENDIMENTO IMEDIATO ⚡
          </p>
        </div>

        {/* Botão para abrir agenda */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            dismissAlert();
            window.location.href = '/schedule';
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 px-8 rounded-xl mb-4 transition-colors shadow-lg"
        >
          📅 Abrir Agenda
        </button>

        <p className="text-xs text-gray-400 font-medium">
          Toque em qualquer lugar para fechar
        </p>
      </div>
    </div>
  );
}
