import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell } from 'lucide-react';

export default function PatientArrivedNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendNotification } = usePushNotifications();
  const [showFullScreenAlert, setShowFullScreenAlert] = useState(false);

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
            // MÁXIMO ESCÂNDALO!
            triggerMaxAlert();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, sendNotification]);

  const triggerMaxAlert = () => {
    // 1. Toast persistente
    toast({
      title: "🔔🔔🔔 PACIENTE CHEGOU! 🔔🔔🔔",
      description: "Seu paciente chegou e está aguardando atendimento! Clique para fechar.",
      duration: 30000,
    });

    // 2. Notificação push nativa
    sendNotification('🔔 PACIENTE CHEGOU!', {
      body: 'Seu próximo paciente chegou e está aguardando!',
      tag: 'patient-arrived',
      requireInteraction: true,
    });

    // 3. Som alto e repetido (sirene)
    playAlarmSound();

    // 4. Vibrar o dispositivo (se suportado)
    vibrateDevice();

    // 5. Flash/piscar na tela
    setShowFullScreenAlert(true);
    
    // 6. Piscar título da aba do navegador
    flashBrowserTab();

    // Parar o alerta fullscreen após 15 segundos ou ao clicar
    setTimeout(() => {
      setShowFullScreenAlert(false);
    }, 15000);
  };

  // Som de alarme intenso - múltiplos beeps crescentes
  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };

      // Padrão de alarme: 3 ciclos de sirene
      for (let cycle = 0; cycle < 3; cycle++) {
        const offset = cycle * 1.6;
        // Sirene subindo
        playTone(600, offset + 0.0, 0.15, 0.5);
        playTone(700, offset + 0.15, 0.15, 0.5);
        playTone(800, offset + 0.3, 0.15, 0.5);
        playTone(900, offset + 0.45, 0.15, 0.5);
        playTone(1000, offset + 0.6, 0.2, 0.6);
        // Sirene descendo
        playTone(900, offset + 0.8, 0.15, 0.5);
        playTone(800, offset + 0.95, 0.15, 0.5);
        playTone(700, offset + 1.1, 0.15, 0.5);
        playTone(600, offset + 1.25, 0.2, 0.5);
      }
    } catch (error) {
      console.log('Could not play alarm sound:', error);
    }
  };

  // Vibração intensa (dispositivos móveis)
  const vibrateDevice = () => {
    try {
      if ('vibrate' in navigator) {
        // Padrão de vibração: vibra-pausa-vibra-pausa-vibra (intenso)
        navigator.vibrate([
          500, 200, 500, 200, 500, 200,
          800, 300, 800, 300, 800
        ]);
      }
    } catch (error) {
      console.log('Vibration not supported:', error);
    }
  };

  // Piscar título da aba do navegador
  const flashBrowserTab = () => {
    const originalTitle = document.title;
    let count = 0;
    const maxFlashes = 20;
    
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

    // Também para quando a janela ganha foco
    const onFocus = () => {
      clearInterval(interval);
      document.title = originalTitle;
      window.removeEventListener('focus', onFocus);
    };
    window.addEventListener('focus', onFocus);
  };

  const dismissAlert = () => {
    setShowFullScreenAlert(false);
    // Parar vibração
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  };

  if (!showFullScreenAlert) return null;

  // Alerta fullscreen piscante impossível de ignorar
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer animate-pulse"
      onClick={dismissAlert}
      style={{
        background: 'rgba(220, 38, 38, 0.85)',
        animation: 'flashAlert 0.5s ease-in-out infinite alternate',
      }}
    >
      <style>{`
        @keyframes flashAlert {
          0% { background: rgba(220, 38, 38, 0.9); }
          50% { background: rgba(234, 179, 8, 0.9); }
          100% { background: rgba(220, 38, 38, 0.9); }
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
          background: 'rgba(255, 255, 255, 0.95)',
          animation: 'bounceIn 0.5s ease-out, shake 0.8s ease-in-out 0.5s 3',
          boxShadow: '0 0 60px rgba(255, 255, 255, 0.5)',
        }}
      >
        <div className="flex justify-center mb-4">
          <Bell className="h-20 w-20 text-red-600 animate-bounce" />
        </div>
        <h1 className="text-4xl font-black text-red-600 mb-3 tracking-tight">
          PACIENTE CHEGOU!
        </h1>
        <p className="text-xl text-gray-700 font-semibold mb-6">
          Seu paciente está aguardando atendimento
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