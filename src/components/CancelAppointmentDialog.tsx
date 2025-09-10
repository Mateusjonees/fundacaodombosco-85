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
  { value: 'client_request', label: 'Solicitação do Cliente' },
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
            <XCircle className="h-6 w-6" />
            Cancelar Agendamento
          </DialogTitle>
        </DialogHeader>

        {schedule && (
          <div className="space-y-6">
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive">Atenção</h4>
                <p className="text-sm text-destructive/80">
                  Esta ação cancelará permanentemente o agendamento. O cliente será notificado automaticamente via email sobre o cancelamento.
                </p>
              </div>
            </div>

            {/* Appointment Details */}
            <Card className="gradient-card shadow-professional">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Detalhes do Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                    <p className="font-medium">{schedule.clients?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Profissional</Label>
                    <p className="font-medium">{schedule.profiles?.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tipo de Atendimento</Label>
                    <p className="font-medium">{schedule.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Horário</Label>
                    <p className="font-medium">
                      {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} às{' '}
                      {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-base font-semibold text-destructive">
                  Categoria do Cancelamento *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-2">
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
                <Label htmlFor="reason" className="text-base font-semibold text-destructive">
                  Motivo do Cancelamento *
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva detalhadamente o motivo do cancelamento (mínimo 10 caracteres)"
                  rows={4}
                  className="resize-none mt-2"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {reason.length}/10 caracteres mínimos
                </p>
              </div>

              {!isFormValid && (reason.length > 0 || category) && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    {!category && "Selecione uma categoria para o cancelamento."}
                    {!reason.trim() && category && "O motivo é obrigatório."}
                    {reason.trim().length < 10 && reason.length > 0 && "O motivo deve ter pelo menos 10 caracteres."}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Voltar
              </Button>
              <Button 
                onClick={handleCancel} 
                disabled={loading || !isFormValid}
                variant="destructive"
                className="shadow-professional"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
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