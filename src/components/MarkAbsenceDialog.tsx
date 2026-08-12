import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserX, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  clients?: { name: string };
}

interface MarkAbsenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onConfirm: (scheduleId: string, justified: boolean, reason: string) => Promise<void>;
}

const MIN_CHARS = 10;

export function MarkAbsenceDialog({ isOpen, onClose, schedule, onConfirm }: MarkAbsenceDialogProps) {
  const [justified, setJustified] = useState<'yes' | 'no'>('no');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Justificativa exige no mínimo 10 caracteres
  const isValid = reason.trim().length >= MIN_CHARS;

  const handleClose = () => {
    setReason('');
    setJustified('no');
    onClose();
  };

  const handleConfirm = async () => {
    if (!schedule || !isValid) return;
    setLoading(true);
    try {
      await onConfirm(schedule.id, justified === 'yes', reason.trim());
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserX className="h-4 w-4 text-orange-600" />
            Registrar Falta
          </DialogTitle>
        </DialogHeader>

        {schedule && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium uppercase">{schedule.clients?.name || 'Paciente'}</p>
              <p className="text-xs text-muted-foreground">
                {schedule.title} · {format(new Date(schedule.start_time), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Tipo de falta</Label>
              <RadioGroup value={justified} onValueChange={(v) => setJustified(v as 'yes' | 'no')} className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-sm">
                  <RadioGroupItem value="yes" id="falta-just" />
                  Justificada
                </label>
                <label className="flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-sm">
                  <RadioGroupItem value="no" id="falta-nao-just" />
                  Não justificada
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="falta-motivo" className="text-sm">
                {justified === 'yes' ? 'Justificativa' : 'Observação'} (mín. {MIN_CHARS} caracteres)
              </Label>
              <Textarea
                id="falta-motivo"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da falta..."
                rows={3}
                maxLength={500}
              />
              <p className={`text-xs ${isValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                {reason.trim().length}/{MIN_CHARS} caracteres
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!isValid || loading} className="bg-orange-600 hover:bg-orange-700">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserX className="h-4 w-4 mr-2" />}
            Registrar falta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
