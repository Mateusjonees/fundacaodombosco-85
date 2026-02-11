import { useState } from 'react';
import { getTodayLocalISODate } from '@/lib/utils';
import { Plus, Stethoscope, HeartPulse, Thermometer, Droplets, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCreateMedicalRecord } from '@/hooks/useMedicalRecords';

interface AddMedicalRecordDialogProps {
  clientId: string;
  employeeId: string;
}

const SESSION_TYPES = [
  'Consulta', 'Avaliação Inicial', 'Retorno', 'Terapia Individual',
  'Terapia em Grupo', 'Avaliação Neuropsicológica', 'Psicoterapia',
  'Acompanhamento', 'Interconsulta', 'Alta', 'Encaminhamento',
];

export const AddMedicalRecordDialog = ({ clientId, employeeId }: AddMedicalRecordDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    session_type: 'Consulta',
    session_date: getTodayLocalISODate(),
    session_duration: '',
    symptoms: '',
    progress_notes: '',
    treatment_plan: '',
    next_appointment_notes: '',
    // Sinais vitais
    pa: '',
    fc: '',
    temp: '',
    spo2: '',
    peso: '',
    altura: '',
    // Medicações
    medications_text: '',
  });

  const createRecord = useCreateMedicalRecord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Montar sinais vitais
    const vital_signs: Record<string, string> = {};
    if (formData.pa) vital_signs['PA'] = formData.pa;
    if (formData.fc) vital_signs['FC'] = `${formData.fc} bpm`;
    if (formData.temp) vital_signs['Temperatura'] = `${formData.temp} °C`;
    if (formData.spo2) vital_signs['SpO2'] = `${formData.spo2}%`;
    if (formData.peso) vital_signs['Peso'] = `${formData.peso} kg`;
    if (formData.altura) vital_signs['Altura'] = `${formData.altura} cm`;

    // Montar medicações
    const medications = formData.medications_text
      ? formData.medications_text.split('\n').filter(m => m.trim()).map(m => ({ name: m.trim() }))
      : [];

    await createRecord.mutateAsync({
      client_id: clientId,
      employee_id: employeeId,
      session_type: formData.session_type,
      session_date: formData.session_date,
      session_duration: formData.session_duration ? parseInt(formData.session_duration) : undefined,
      symptoms: formData.symptoms || undefined,
      progress_notes: formData.progress_notes,
      treatment_plan: formData.treatment_plan || undefined,
      next_appointment_notes: formData.next_appointment_notes || undefined,
      vital_signs: Object.keys(vital_signs).length > 0 ? vital_signs : undefined,
      medications: medications.length > 0 ? medications : undefined,
      status: 'completed',
    });

    setOpen(false);
    setFormData({
      session_type: 'Consulta',
      session_date: getTodayLocalISODate(),
      session_duration: '',
      symptoms: '',
      progress_notes: '',
      treatment_plan: '',
      next_appointment_notes: '',
      pa: '', fc: '', temp: '', spo2: '', peso: '', altura: '',
      medications_text: '',
    });
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Registro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Novo Registro no Prontuário
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da sessão. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dados da sessão */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados da Sessão</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de Sessão *</Label>
                <Select value={formData.session_type} onValueChange={(v) => update('session_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input type="date" value={formData.session_date} onChange={(e) => update('session_date', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input type="number" placeholder="60" value={formData.session_duration} onChange={(e) => update('session_duration', e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sinais Vitais */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <HeartPulse className="w-4 h-4" /> Sinais Vitais
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">PA (mmHg)</Label>
                <Input placeholder="120/80" value={formData.pa} onChange={(e) => update('pa', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">FC (bpm)</Label>
                <Input type="number" placeholder="72" value={formData.fc} onChange={(e) => update('fc', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Temp (°C)</Label>
                <Input placeholder="36.5" value={formData.temp} onChange={(e) => update('temp', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">SpO2 (%)</Label>
                <Input type="number" placeholder="98" value={formData.spo2} onChange={(e) => update('spo2', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Peso (kg)</Label>
                <Input placeholder="70" value={formData.peso} onChange={(e) => update('peso', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Altura (cm)</Label>
                <Input placeholder="170" value={formData.altura} onChange={(e) => update('altura', e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Queixa / Sintomas */}
          <div className="space-y-1.5">
            <Label>Queixa Principal / Sintomas</Label>
            <Textarea
              placeholder="Descreva a queixa principal, sintomas relatados e observações iniciais..."
              value={formData.symptoms}
              onChange={(e) => update('symptoms', e.target.value)}
              rows={3}
            />
          </div>

          {/* Evolução */}
          <div className="space-y-1.5">
            <Label>Evolução / Registro da Sessão *</Label>
            <Textarea
              placeholder="Descreva detalhadamente a evolução do paciente: estado geral, exame mental, achados clínicos, técnicas utilizadas, resposta do paciente, impressão diagnóstica..."
              value={formData.progress_notes}
              onChange={(e) => update('progress_notes', e.target.value)}
              rows={6}
              required
              className="min-h-[120px]"
            />
          </div>

          {/* Plano de Tratamento */}
          <div className="space-y-1.5">
            <Label>Conduta / Plano Terapêutico</Label>
            <Textarea
              placeholder="Hipótese diagnóstica (CID), plano de tratamento, encaminhamentos, exames solicitados, orientações ao paciente..."
              value={formData.treatment_plan}
              onChange={(e) => update('treatment_plan', e.target.value)}
              rows={4}
            />
          </div>

          {/* Medicações */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Droplets className="w-4 h-4" /> Medicações Prescritas
            </Label>
            <Textarea
              placeholder="Uma medicação por linha. Ex:&#10;Fluoxetina 20mg - 1x ao dia&#10;Risperidona 1mg - à noite"
              value={formData.medications_text}
              onChange={(e) => update('medications_text', e.target.value)}
              rows={3}
            />
          </div>

          {/* Próxima sessão */}
          <div className="space-y-1.5">
            <Label>Observações para Próxima Sessão</Label>
            <Textarea
              placeholder="Tarefas para o paciente, pontos a abordar na próxima sessão..."
              value={formData.next_appointment_notes}
              onChange={(e) => update('next_appointment_notes', e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createRecord.isPending}>
              {createRecord.isPending ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
