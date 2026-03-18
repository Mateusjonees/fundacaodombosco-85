import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Paleta de cores para tarefas
const TASK_COLORS = [
  { value: '#3b82f6', label: 'Azul', className: 'bg-blue-500' },
  { value: '#ef4444', label: 'Vermelho', className: 'bg-red-500' },
  { value: '#22c55e', label: 'Verde', className: 'bg-green-500' },
  { value: '#f59e0b', label: 'Amarelo', className: 'bg-amber-500' },
  { value: '#8b5cf6', label: 'Roxo', className: 'bg-violet-500' },
  { value: '#ec4899', label: 'Rosa', className: 'bg-pink-500' },
  { value: '#06b6d4', label: 'Ciano', className: 'bg-cyan-500' },
  { value: '#f97316', label: 'Laranja', className: 'bg-orange-500' },
];

export interface TaskData {
  id?: string;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  color: string;
  priority: string;
  status: string;
  client_id?: string | null;
}

interface PersonalTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskData | null;
  defaultDate?: Date;
  clients?: { id: string; name: string }[];
  onSaved: () => void;
}

export default function PersonalTaskDialog({ open, onOpenChange, task, defaultDate, clients, onSaved }: PersonalTaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TaskData>({
    title: '',
    description: '',
    due_date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    due_time: '',
    color: '#3b82f6',
    priority: 'medium',
    status: 'pending',
    client_id: null,
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date || '',
        due_time: task.due_time || '',
        color: task.color || '#3b82f6',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        client_id: task.client_id || null,
      });
    } else {
      setForm({
        title: '',
        description: '',
        due_date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        due_time: '',
        color: '#3b82f6',
        priority: 'medium',
        status: 'pending',
        client_id: null,
      });
    }
  }, [task, defaultDate, open]);

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        due_time: form.due_time || null,
        color: form.color,
        priority: form.priority,
        status: form.status,
        client_id: form.client_id || null,
        updated_at: new Date().toISOString(),
      };

      if (task?.id) {
        const { error } = await supabase.from('professional_tasks').update(payload).eq('id', task.id);
        if (error) throw error;
        toast({ title: 'Tarefa atualizada' });
      } else {
        const { error } = await supabase.from('professional_tasks').insert(payload);
        if (error) throw error;
        toast({ title: 'Tarefa criada' });
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
    if (!task?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('professional_tasks').delete().eq('id', task.id);
      if (error) throw error;
      toast({ title: 'Tarefa removida' });
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{task?.id ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Preparar relatório..." />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {clients && clients.length > 0 && (
            <div>
              <Label>Paciente (opcional)</Label>
              <Select value={form.client_id || 'none'} onValueChange={v => setForm(f => ({ ...f, client_id: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Sem paciente vinculado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem paciente</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Cor</Label>
            <div className="flex gap-2 mt-1.5">
              {TASK_COLORS.map(c => (
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
          {task?.id && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
              Excluir
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !form.title.trim()}>
              {loading ? 'Salvando...' : task?.id ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
