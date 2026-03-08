import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PatientCommandAutocomplete } from '@/components/PatientCommandAutocomplete';
import { ProfessionalCommandAutocomplete } from '@/components/ProfessionalCommandAutocomplete';
import { Plus, Mail, MailCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  title: string;
  status: string;
  notes?: string;
  unit?: string;
  patient_arrived?: boolean;
  arrived_at?: string;
  arrived_confirmed_by?: string;
  clients?: { name: string };
  profiles?: { name: string };
}

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSchedule: Schedule | null;
  userProfile: any;
  isAdmin: boolean;
  employees: any[];
  clients: any[];
  onSuccess: () => void;
  onReset: () => void;
}

export const CreateScheduleDialog = ({
  isOpen,
  onOpenChange,
  editingSchedule,
  userProfile,
  isAdmin,
  employees,
  clients,
  onSuccess,
  onReset,
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_id: '',
    employee_id: '',
    title: 'Consulta',
    start_time: '',
    end_time: '',
    notes: '',
    unit: userProfile?.unit || 'madre',
    sessionCount: 1,
    sendConfirmationEmail: false,
  });

  // Sync form when editing
  useEffect(() => {
    if (editingSchedule) {
      const formatDTL = (iso: string) => {
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };
      setForm({
        client_id: editingSchedule.client_id,
        employee_id: editingSchedule.employee_id,
        title: editingSchedule.title,
        start_time: formatDTL(editingSchedule.start_time),
        end_time: formatDTL(editingSchedule.end_time),
        notes: editingSchedule.notes || '',
        unit: editingSchedule.unit || 'madre',
        sessionCount: 1,
        sendConfirmationEmail: false,
      });
    } else {
      setForm({
        client_id: '',
        employee_id: !isAdmin ? (userProfile?.user_id || '') : '',
        title: 'Consulta',
        start_time: '',
        end_time: '',
        notes: '',
        unit: userProfile?.unit || 'madre',
        sessionCount: 1,
        sendConfirmationEmail: false,
      });
    }
  }, [editingSchedule, isOpen]);

  // Fetch client email
  useEffect(() => {
    if (!form.client_id) { setSelectedClientEmail(null); return; }
    const client = clients.find((c: any) => c.id === form.client_id);
    if (client?.email) { setSelectedClientEmail(client.email); return; }
    supabase.from('clients').select('email').eq('id', form.client_id).single()
      .then(({ data }) => setSelectedClientEmail(data?.email || null))
      .then(undefined, () => setSelectedClientEmail(null));
  }, [form.client_id, clients]);

  const checkConflict = async (employeeId: string, startTime: string, endTime: string, excludeId?: string) => {
    const { data } = await supabase
      .from('schedules')
      .select('id, start_time, end_time')
      .eq('employee_id', employeeId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('start_time', startTime.split('T')[0])
      .lt('start_time', new Date(new Date(startTime).getTime() + 86400000).toISOString().split('T')[0] + 'T23:59:59');
    return data?.some(s => {
      if (excludeId && s.id === excludeId) return false;
      return new Date(startTime).getTime() < new Date(s.end_time).getTime() && new Date(endTime).getTime() > new Date(s.start_time).getTime();
    }) || false;
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (!form.start_time || !form.end_time) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Preencha data e hora de início e fim.' });
        return;
      }
      const start = new Date(form.start_time);
      const end = new Date(form.end_time);
      if (end <= start) {
        toast({ variant: 'destructive', title: 'Erro', description: 'A data de fim deve ser posterior à de início.' });
        return;
      }

      const data = {
        client_id: form.client_id,
        employee_id: form.employee_id,
        title: form.title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        notes: form.notes,
        unit: form.unit,
        created_by: user?.id,
      };

      if (editingSchedule) {
        if (await checkConflict(data.employee_id, data.start_time, data.end_time, editingSchedule.id)) {
          toast({ variant: 'destructive', title: 'Conflito', description: 'O profissional já possui um agendamento neste horário.' });
          return;
        }
        const { error } = await supabase.from('schedules').update(data).eq('id', editingSchedule.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Agendamento atualizado!' });
      } else {
        const count = form.sessionCount || 1;
        const items = [];
        for (let i = 0; i < count; i++) {
          const s = new Date(data.start_time); s.setDate(s.getDate() + i * 7);
          const e = new Date(data.end_time); e.setDate(e.getDate() + i * 7);
          items.push({ ...data, start_time: s.toISOString(), end_time: e.toISOString(), status: 'scheduled', notes: count > 1 ? `${data.notes} (Sessão ${i + 1} de ${count})` : data.notes });
        }
        const conflicts = await Promise.all(items.map((a, idx) => checkConflict(a.employee_id, a.start_time, a.end_time).then(h => ({ h, idx, st: a.start_time }))));
        const conflict = conflicts.find(c => c.h);
        if (conflict) {
          toast({ variant: 'destructive', title: 'Conflito', description: `Conflito na sessão ${conflict.idx + 1} (${format(new Date(conflict.st), 'dd/MM/yyyy HH:mm', { locale: ptBR })}).` });
          return;
        }
        const { data: inserted, error } = await supabase.from('schedules').insert(items).select('id, start_time');
        if (error) throw error;
        toast({ title: 'Sucesso', description: count > 1 ? `${count} sessões criadas!` : 'Agendamento criado!' });

        // Send email in background
        if (form.sendConfirmationEmail && selectedClientEmail && inserted) {
          (async () => {
            try {
              const client = clients.find((c: any) => c.id === form.client_id);
              const professional = employees.find((e: any) => e.user_id === form.employee_id);
              const sessions = inserted.map((s: any, idx: number) => ({ date: format(new Date(s.start_time), 'dd/MM/yyyy', { locale: ptBR }), time: format(new Date(s.start_time), 'HH:mm', { locale: ptBR }), sessionNumber: idx + 1 }));
              const { data: profProfile } = await supabase.from('profiles').select('email').eq('user_id', form.employee_id).maybeSingle();
              await supabase.functions.invoke('send-appointment-email', {
                body: { clientEmail: selectedClientEmail, clientName: client?.name || 'Paciente', appointmentDate: sessions[0].date, appointmentTime: sessions[0].time, professionalName: professional?.name || 'Profissional', appointmentType: form.title, notes: form.notes, unit: form.unit, scheduleIds: inserted.map((s: any) => s.id), sessions, professionalEmail: profProfile?.email, scheduledByName: userProfile?.name }
              });
            } catch (e) { console.error('Email error:', e); }
          })();
        }
      }

      onOpenChange(false);
      onReset();
      onSuccess();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao salvar agendamento.' });
    } finally {
      setIsSaving(false);
    }
  };

  const unitFilter = userProfile?.employee_role === 'coordinator_madre' ? 'madre' :
    userProfile?.employee_role === 'coordinator_floresta' ? 'floresta' :
    userProfile?.employee_role === 'coordinator_atendimento_floresta' ? 'atendimento_floresta' : 'all';

  const profUnitFilter = userProfile?.employee_role === 'receptionist' ? form.unit : unitFilter;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <PatientCommandAutocomplete
                  value={form.client_id}
                  onValueChange={(v) => setForm(p => ({ ...p, client_id: v }))}
                  onClientSelect={(c) => c?.unit && setForm(p => ({ ...p, client_id: c.id, unit: c.unit! }))}
                  placeholder="Buscar paciente..."
                  unitFilter={unitFilter}
                />
              </div>
              <div className="space-y-2">
                <Label>Profissional</Label>
                <ProfessionalCommandAutocomplete
                  value={form.employee_id}
                  onValueChange={(v) => setForm(p => ({ ...p, employee_id: v }))}
                  placeholder="Buscar profissional..."
                  unitFilter={profUnitFilter}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data e Hora Início</Label>
                <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data e Hora Fim</Label>
                <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm(p => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Consulta</Label>
                <Select value={form.title} onValueChange={(v) => setForm(p => ({ ...p, title: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="Consulta">Consulta</SelectItem>
                    <SelectItem value="Primeira Consulta">Primeira Consulta</SelectItem>
                    <SelectItem value="Avaliação">Avaliação</SelectItem>
                    <SelectItem value="Retorno">Retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={form.unit} onValueChange={(v) => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="madre">Clínica Social (MADRE)</SelectItem>
                    <SelectItem value="floresta">Neuroavaliação (Floresta)</SelectItem>
                    <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!editingSchedule && (
              <div className="space-y-2">
                <Label>Quantidade de Sessões</Label>
                <Input type="number" min="1" max="52" value={form.sessionCount} onChange={(e) => setForm(p => ({ ...p, sessionCount: Math.max(1, parseInt(e.target.value) || 1) }))} />
                <p className="text-xs text-muted-foreground">Sessões semanais sequenciais com verificação de conflitos.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observações opcionais..." rows={4} className="resize-none" />
            </div>

            {!editingSchedule && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Notificação por E-mail</Label>
                </div>
                {selectedClientEmail ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Enviar e-mail de confirmação</p>
                        <p className="text-xs text-muted-foreground mt-1"><MailCheck className="h-3 w-3 inline mr-1" />{selectedClientEmail}</p>
                      </div>
                      <Switch checked={form.sendConfirmationEmail} onCheckedChange={(c) => setForm(p => ({ ...p, sendConfirmationEmail: c }))} />
                    </div>
                    {form.sendConfirmationEmail && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">✅ O paciente receberá um e-mail com os dados do agendamento.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ Paciente sem e-mail cadastrado.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : editingSchedule ? 'Salvar' : 'Criar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
