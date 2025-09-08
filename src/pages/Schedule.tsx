import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Schedule {
  id: string;
  client_id: string;
  professional_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  notes?: string;
  clients?: { name: string };
  profiles?: { name: string };
}

export default function Schedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newAppointment, setNewAppointment] = useState({
    client_id: '',
    professional_id: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '',
    end_time: '',
    type: 'consultation',
    notes: ''
  });

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          clients (name),
          profiles (name)
        `)
        .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const { error } = await supabase
        .from('schedules')
        .insert([{
          ...newAppointment,
          status: 'scheduled'
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });
      
      setIsDialogOpen(false);
      setNewAppointment({
        client_id: '',
        professional_id: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '',
        end_time: '',
        type: 'consultation',
        notes: ''
      });
      loadSchedules();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'confirmed': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const todaySchedules = schedules.filter(schedule => 
    schedule.appointment_date === format(selectedDate, 'yyyy-MM-dd')
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="appointment_date">Data</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={newAppointment.appointment_date}
                  onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Horário Início</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={newAppointment.start_time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Horário Fim</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={newAppointment.end_time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Consulta</Label>
                <Select value={newAppointment.type} onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="therapy">Terapia</SelectItem>
                    <SelectItem value="evaluation">Avaliação</SelectItem>
                    <SelectItem value="followup">Acompanhamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  placeholder="Informações adicionais sobre o agendamento"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAppointment}>
                Agendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Selecionar Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agenda do Dia - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando agendamentos...</p>
            ) : todaySchedules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum agendamento para esta data.
              </p>
            ) : (
              <div className="space-y-4">
                {todaySchedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                        <Badge variant="outline">{schedule.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Cliente: {schedule.clients?.name || 'N/A'}</span>
                        <span>•</span>
                        <span>Profissional: {schedule.profiles?.name || 'N/A'}</span>
                      </div>
                      {schedule.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{schedule.notes}</p>
                      )}
                    </div>
                    <Badge variant={getStatusColor(schedule.status)}>
                      {getStatusLabel(schedule.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}