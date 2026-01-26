import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2 } from 'lucide-react';
import { getTodayLocalISODate } from '@/lib/utils';

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  title: string;
  clients?: {
    name: string;
  };
}

interface CompleteAttendanceDialogProps {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CompleteAttendanceDialog({
  schedule,
  isOpen,
  onClose,
  onComplete
}: CompleteAttendanceDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSessionNotes('');
    }
  }, [isOpen]);

  const handleComplete = async () => {
    if (!schedule || !user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados do agendamento não encontrados."
      });
      return;
    }

    if (!sessionNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Por favor, preencha as observações do atendimento."
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar unidade do cliente para verificar se é Atendimento Floresta
      const { data: clientData } = await supabase
        .from('clients')
        .select('unit')
        .eq('id', schedule.client_id)
        .maybeSingle();

      const isAtendimentoFloresta = clientData?.unit === 'atendimento_floresta';

      // Buscar profissional
      const { data: professionalProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', schedule.employee_id)
        .maybeSingle();

      const professionalName = professionalProfile?.name || professionalProfile?.email || 'Profissional';

      // Buscar usuário que está concluindo
      const { data: completedByProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      const completedByName = completedByProfile?.name || completedByProfile?.email || user.email || 'Usuário';

      const now = new Date().toISOString();
      const scheduleStatus = isAtendimentoFloresta ? 'completed' : 'pending_validation';
      const validationStatus = isAtendimentoFloresta ? 'validated' : 'pending_validation';

      // Calcular duração da sessão
      const startTime = new Date(schedule.start_time);
      const endTime = new Date(schedule.end_time);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Atualizar schedule
      await supabase.from('schedules').update({
        status: scheduleStatus,
        session_notes: sessionNotes,
        completed_at: now,
        completed_by: user.id
      }).eq('id', schedule.id);

      // Criar attendance_report
      const { data: attendanceReport } = await supabase
        .from('attendance_reports')
        .insert({
          schedule_id: schedule.id,
          client_id: schedule.client_id,
          employee_id: schedule.employee_id,
          patient_name: schedule.clients?.name || '',
          professional_name: professionalName,
          attendance_type: 'Consulta',
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          session_duration: durationMinutes,
          observations: sessionNotes,
          session_notes: sessionNotes,
          created_by: user.id,
          completed_by: user.id,
          completed_by_name: completedByName,
          validation_status: validationStatus,
          validated_at: isAtendimentoFloresta ? now : null,
          validated_by: isAtendimentoFloresta ? user.id : null,
          validated_by_name: isAtendimentoFloresta ? completedByName : null
        })
        .select('id')
        .maybeSingle();

      // Upsert employee_report
      await supabase.from('employee_reports').upsert({
        employee_id: schedule.employee_id,
        client_id: schedule.client_id,
        schedule_id: schedule.id,
        session_date: getTodayLocalISODate(),
        session_type: 'Consulta',
        session_duration: durationMinutes,
        professional_notes: sessionNotes,
        completed_by: user.id,
        completed_by_name: completedByName,
        validation_status: validationStatus,
        validated_at: isAtendimentoFloresta ? now : null,
        validated_by: isAtendimentoFloresta ? user.id : null,
        validated_by_name: isAtendimentoFloresta ? completedByName : null
      }, {
        onConflict: 'schedule_id'
      });

      // Se for Atendimento Floresta, processar automaticamente
      if (isAtendimentoFloresta && attendanceReport?.id) {
        await supabase.rpc('validate_attendance_report', {
          p_attendance_report_id: attendanceReport.id,
          p_action: 'validate',
          p_professional_amount: 0,
          p_foundation_amount: 0,
          p_total_amount: 0,
          p_payment_method: 'dinheiro'
        });
      }

      // Atualizar cliente
      await supabase.from('clients').update({
        last_session_date: getTodayLocalISODate(),
        last_session_type: 'Consulta',
        last_session_notes: sessionNotes,
        updated_at: now
      }).eq('id', schedule.client_id);

      // Sucesso!
      setLoading(false);
      toast({
        title: isAtendimentoFloresta ? "Atendimento Finalizado!" : "Atendimento Enviado!",
        description: isAtendimentoFloresta 
          ? "Atendimento concluído e registrado no histórico do paciente." 
          : "Atendimento enviado para revisão do coordenador."
      });

      onClose();
      setTimeout(() => {
        onComplete();
      }, 300);

    } catch (error: any) {
      console.error('Erro ao completar atendimento:', error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: error?.message || "Não foi possível concluir o atendimento."
      });
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Finalizar Atendimento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {schedule.clients?.name} • {new Date(schedule.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </DialogHeader>

        <Card className="border-2 border-dashed">
          <CardContent className="p-4">
            <Textarea
              placeholder="Descreva as observações do atendimento, procedimentos realizados, evolução do paciente, orientações dadas..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="min-h-[300px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
          </CardContent>
        </Card>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalizar Atendimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
