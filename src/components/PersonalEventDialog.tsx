import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const EVENT_COLORS = [
  { value: '#8b5cf6', label: 'Roxo', className: 'bg-violet-500' },
  { value: '#3b82f6', label: 'Azul', className: 'bg-blue-500' },
  { value: '#ef4444', label: 'Vermelho', className: 'bg-red-500' },
  { value: '#22c55e', label: 'Verde', className: 'bg-green-500' },
  { value: '#f59e0b', label: 'Amarelo', className: 'bg-amber-500' },
  { value: '#ec4899', label: 'Rosa', className: 'bg-pink-500' },
  { value: '#06b6d4', label: 'Ciano', className: 'bg-cyan-500' },
  { value: '#f97316', label: 'Laranja', className: 'bg-orange-500' },
];

export interface EventData {
  id?: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  color: string;
  is_all_day: boolean;
}

interface PersonalEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventData | null;
  defaultDate?: Date;
  onSaved: () => void;
}

export default function PersonalEventDialog({ open, onOpenChange, event, defaultDate, onSaved }: PersonalEventDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<EventData>({
    title: '',
    description: '',
    date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    end_time: '09:00',
    color: '#8b5cf6',
    is_all_day: false,
  });

  useEffect(() => {
    if (event) {
      setForm({ ...event });
    } else {
      setForm({
        title: '',
        description: '',
        date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        start_time: '08:00',
        end_time: '09:00',
        color: '#8b5cf6',
        is_all_day: false,
      });
    }
  }, [event, defaultDate, open]);

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;
    setLoading(true);
    try {
      const startDateTime = `${form.date}T${form.is_all_day ? '00:00' : form.start_time}:00`;
      const endDateTime = `${form.date}T${form.is_all_day ? '23:59' : form.end_time}:00`;

      const payload = {
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_time: startDateTime,
        end_time: endDateTime,
        color: form.color,
        is_all_day: form.is_all_day,
        updated_at: new Date().toISOString(),
      };

      if (event?.id) {
        const { error } = await supabase.from('personal_events').update(payload).eq('id', event.id);
        if (error) throw error;
        toast({ title: 'Evento atualizado' });
      } else {
        const { error } = await supabase.from('personal_events').insert(payload);
        if (error) throw error;
        toast({ title: 'Evento criado' });
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('personal_events').delete().eq('id', event.id);
      if (error) throw error;
      toast({ title: 'Evento removido' });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Editar Evento' : 'Novo Evento Pessoal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Reunião de equipe..." />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>

          <div>
            <Label>Data</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={form.is_all_day} onCheckedChange={v => setForm(f => ({ ...f, is_all_day: !!v }))} id="all-day" />
            <Label htmlFor="all-day" className="cursor-pointer text-sm">Dia inteiro</Label>
          </div>

          {!form.is_all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
          )}

          <div>
            <Label>Cor</Label>
            <div className="flex gap-2 mt-1.5">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  className={`h-7 w-7 rounded-full transition-all ${c.className} ${
                    form.color === c.value ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105 opacity-70'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {event?.id && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
              Excluir
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !form.title.trim()}>
              {loading ? 'Salvando...' : event?.id ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
