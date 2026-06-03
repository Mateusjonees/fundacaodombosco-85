import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, UserX, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  status: string;
  notes?: string;
  clients?: { name: string };
  profiles?: { name: string };
}

interface Props {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RevertAttendanceDialog = ({ schedule, isOpen, onClose, onSuccess }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  if (!schedule) return null;

  const sessionDate = schedule.start_time.split('T')[0];
  const patientName = schedule.clients?.name || 'paciente';
  const professionalName = schedule.profiles?.name || 'profissional';

  const cleanupAttendanceArtifacts = async (deleteMedicalRecord: boolean) => {
    // Apaga attendance_reports vinculados a este agendamento
    await supabase.from('attendance_reports').delete().eq('schedule_id', schedule.id);

    if (deleteMedicalRecord) {
      // Apaga prontuário daquele dia criado pelo mesmo profissional para o mesmo paciente
      await supabase
        .from('medical_records')
        .delete()
        .eq('client_id', schedule.client_id)
        .eq('employee_id', schedule.employee_id)
        .eq('session_date', sessionDate);
    }
  };

  const handleReopen = async () => {
    setLoading('reopen');
    try {
      await cleanupAttendanceArtifacts(true);
      const { error } = await supabase
        .from('schedules')
        .update({
          status: 'scheduled',
          patient_arrived: false,
          arrived_at: null,
        })
        .eq('id', schedule.id);
      if (error) throw error;
      toast({ title: 'Atendimento reaberto', description: 'O agendamento voltou para "Agendado" e a evolução foi removida.' });
      onSuccess();
      onClose();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao reabrir', description: e.message });
    } finally {
      setLoading(null);
    }
  };

  const handleMarkAsMissed = async () => {
    setLoading('missed');
    try {
      await cleanupAttendanceArtifacts(true);
      const newNotes = `${schedule.notes || ''} [Revertido pelo diretor: paciente faltou]`.trim();
      const { error } = await supabase
        .from('schedules')
        .update({
          status: 'cancelled',
          patient_arrived: false,
          arrived_at: null,
          notes: newNotes,
        })
        .eq('id', schedule.id);
      if (error) throw error;
      toast({ title: 'Marcado como falta', description: 'O agendamento foi cancelado como falta do paciente.' });
      onSuccess();
      onClose();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading('delete');
    try {
      await cleanupAttendanceArtifacts(true);
      const { error } = await supabase.from('schedules').delete().eq('id', schedule.id);
      if (error) throw error;
      toast({ title: 'Agendamento excluído', description: 'Removido permanentemente.' });
      onSuccess();
      onClose();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: e.message });
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-600" />
            Reverter atendimento
          </DialogTitle>
          <DialogDescription>
            Paciente <strong className="uppercase">{patientName}</strong> · Profissional{' '}
            <strong className="uppercase">{professionalName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10 p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Estas ações apagarão o registro de atendimento e o prontuário daquela sessão criado pelo profissional. Use apenas para corrigir erros.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleReopen}
            disabled={busy}
          >
            {loading === 'reopen' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 text-blue-600" />}
            <div className="text-left">
              <div className="font-medium text-sm">Reabrir atendimento</div>
              <div className="text-xs text-muted-foreground">Volta para "Agendado" e apaga a evolução para refazer.</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleMarkAsMissed}
            disabled={busy}
          >
            {loading === 'missed' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4 text-orange-600" />}
            <div className="text-left">
              <div className="font-medium text-sm">Marcar como falta</div>
              <div className="text-xs text-muted-foreground">Cancela registrando que o paciente faltou.</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3 border-destructive/40 hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={busy}
          >
            {loading === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
            <div className="text-left">
              <div className="font-medium text-sm text-destructive">Excluir agendamento</div>
              <div className="text-xs text-muted-foreground">Remove permanentemente o agendamento e a evolução.</div>
            </div>
          </Button>
        </div>

        <Button variant="ghost" onClick={onClose} disabled={busy} className="w-full">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default RevertAttendanceDialog;
