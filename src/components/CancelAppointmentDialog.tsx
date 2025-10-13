import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, XCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  clients?: { name: string };
  profiles?: { name: string };
}

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onCancel: (scheduleId: string, reason: string, category: string) => Promise<void>;
}

const CANCELLATION_CATEGORIES = [
  { value: 'client_request', label: 'Solicitação do Paciente' },
  { value: 'professional_unavailable', label: 'Indisponibilidade do Profissional' },
  { value: 'emergency', label: 'Emergência' },
  { value: 'illness', label: 'Doença' },
  { value: 'equipment_failure', label: 'Problema com Equipamentos' },
  { value: 'weather', label: 'Condições Climáticas' },
  { value: 'administrative', label: 'Motivo Administrativo' },
  { value: 'other', label: 'Outro' },
];

export function CancelAppointmentDialog({ 
  isOpen, 
  onClose, 
  schedule, 
  onCancel 
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!schedule) return;

    if (!reason.trim()) {
      return;
    }

    if (!category) {
      return;
    }

    setLoading(true);
    try {
      await onCancel(schedule.id, reason.trim(), category);
      
      // Reset form
      setReason('');
      setCategory('');
      onClose();
    } catch (error) {
      console.error('Error canceling appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setCategory('');
    onClose();
  };

  const isFormValid = reason.trim().length >= 10 && category;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-destructive">
            <XCircle className="h-5 w-5" />
            Cancelar Agendamento
          </DialogTitle>
        </DialogHeader>

        {schedule && (
          <div className="space-y-4">
            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-destructive">Atenção</h4>
                <p className="text-xs text-destructive/80">
                  Esta ação cancelará permanentemente o agendamento. O paciente será notificado automaticamente via email sobre o cancelamento.
                </p>
              </div>
            </div>

            {/* Appointment Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Detalhes do Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Paciente</Label>
                    <p className="text-sm font-medium">{schedule.clients?.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Profissional</Label>
                    <p className="text-sm font-medium">{schedule.profiles?.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Tipo de Atendimento</Label>
                    <p className="text-sm font-medium">{schedule.title}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Horário</Label>
                    <p className="text-sm font-medium">
                      {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} às{' '}
                      {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Form */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="category" className="text-sm font-semibold text-destructive">
                  Categoria do Cancelamento *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione a categoria do cancelamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason" className="text-sm font-semibold text-destructive">
                  Motivo do Cancelamento *
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva detalhadamente o motivo do cancelamento (mínimo 10 caracteres)"
                  rows={3}
                  className="resize-none mt-1.5"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {reason.length}/10 caracteres mínimos
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={loading} size="sm">
                Voltar
              </Button>
              <Button 
                onClick={handleCancel} 
                disabled={loading || !isFormValid}
                variant="destructive"
                size="sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-2" />
                    Confirmar Cancelamento
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}