import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  User, 
  Plus, 
  Activity,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ServiceRecord {
  id: string;
  date: string;
  service_type: string;
  professional_name: string;
  professional_role: string;
  duration?: number;
  status: string;
  detailed_notes: string;
  techniques_used?: string;
  materials_used?: any[];
  session_objectives?: string;
  patient_response?: string;
  next_session_plan?: string;
  created_at: string;
  source: 'schedule' | 'medical_record' | 'session_report';
}

interface ServiceHistoryProps {
  clientId: string;
}

export default function ServiceHistory({ clientId }: ServiceHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [newService, setNewService] = useState({
    service_type: '',
    date: '',
    time: '',
    duration: '60',
    detailed_notes: '',
    techniques_used: '',
    session_objectives: '',
    patient_response: '',
    next_session_plan: '',
    materials_used: ''
  });

  useEffect(() => {
    loadServiceHistory();
  }, [clientId]);

  const loadServiceHistory = async () => {
    setLoading(true);
    try {
      const records: ServiceRecord[] = [];

      // Carregar schedules (agendamentos)
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          id,
          title,
          start_time,
          end_time,
          status,
          description,
          notes,
          created_by
        `)
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });

      if (schedulesError) throw schedulesError;

      if (schedules && schedules.length > 0) {
        // Buscar profiles dos criadores separadamente
        const creatorIds = [...new Set(schedules.map(s => s.created_by))].filter(id => id);
        let schedulesProfiles: any[] = [];
        
        if (creatorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, name, employee_role')
            .in('user_id', creatorIds);
          schedulesProfiles = profilesData || [];
        }

        schedules.forEach(schedule => {
          const profile = schedulesProfiles.find(p => p.user_id === schedule.created_by);
          records.push({
            id: schedule.id,
            date: schedule.start_time,
            service_type: schedule.title || 'Atendimento',
            professional_name: profile?.name || 'Profissional',
            professional_role: profile?.employee_role || 'Staff',
            duration: schedule.end_time ? Math.round((new Date(schedule.end_time).getTime() - new Date(schedule.start_time).getTime()) / (1000 * 60)) : undefined,
            status: schedule.status || 'scheduled',
            detailed_notes: schedule.description || schedule.notes || '',
            created_at: schedule.start_time,
            source: 'schedule'
          });
        });
      }

      // Carregar medical records
      const { data: medicalRecords, error: medicalError } = await supabase
        .from('medical_records')
        .select(`
          id,
          session_date,
          session_type,
          progress_notes,
          treatment_plan,
          symptoms,
          session_duration,
          status,
          employee_id
        `)
        .eq('client_id', clientId)
        .order('session_date', { ascending: false });

      if (medicalError) throw medicalError;

      if (medicalRecords && medicalRecords.length > 0) {
        // Buscar profiles dos profissionais separadamente
        const employeeIds = [...new Set(medicalRecords.map(r => r.employee_id))].filter(id => id);
        let medicalProfiles: any[] = [];
        
        if (employeeIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, name, employee_role')
            .in('user_id', employeeIds);
          medicalProfiles = profilesData || [];
        }

        medicalRecords.forEach(record => {
          const profile = medicalProfiles.find(p => p.user_id === record.employee_id);
          records.push({
            id: `medical_${record.id}`,
            date: record.session_date,
            service_type: record.session_type || 'Consulta Médica',
            professional_name: profile?.name || 'Profissional',
            professional_role: profile?.employee_role || 'Staff',
            duration: record.session_duration,
            status: record.status || 'completed',
            detailed_notes: record.progress_notes || '',
            session_objectives: record.treatment_plan || '',
            patient_response: record.symptoms || '',
            created_at: record.session_date,
            source: 'medical_record'
          });
        });
      }

      // Carregar employee reports (relatórios detalhados)
      const { data: reports, error: reportsError } = await supabase
        .from('employee_reports')
        .select(`
          id,
          session_date,
          session_type,
          professional_notes,
          techniques_used,
          session_objectives,
          patient_response,
          next_session_plan,
          session_duration,
          materials_used,
          employee_id,
          profiles:employee_id (name, employee_role)
        `)
        .eq('client_id', clientId)
        .order('session_date', { ascending: false });

      if (reportsError) throw reportsError;

      if (reports) {
        reports.forEach(report => {
          records.push({
            id: `report_${report.id}`,
            date: report.session_date,
            service_type: report.session_type || 'Sessão Terapêutica',
            professional_name: report.profiles?.name || 'Profissional',
            professional_role: report.profiles?.employee_role || 'Staff',
            duration: report.session_duration,
            status: 'completed',
            detailed_notes: report.professional_notes || '',
            techniques_used: report.techniques_used || '',
            session_objectives: report.session_objectives || '',
            patient_response: report.patient_response || '',
            next_session_plan: report.next_session_plan || '',
            materials_used: Array.isArray(report.materials_used) ? report.materials_used : [],
            created_at: report.session_date,
            source: 'session_report'
          });
        });
      }

      // Ordenar todos os registros por data (mais recente primeiro)
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setServiceRecords(records);
    } catch (error) {
      console.error('Error loading service history:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o histórico de serviços.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.service_type || !newService.date || !newService.time) return;

    setLoading(true);
    try {
      const startDateTime = new Date(`${newService.date}T${newService.time}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(newService.duration) * 60000);

      // Inserir no employee_reports para registros detalhados
      const { error } = await supabase
        .from('employee_reports')
        .insert({
          client_id: clientId,
          employee_id: user?.id,
          session_date: newService.date,
          session_type: newService.service_type,
          session_duration: parseInt(newService.duration),
          professional_notes: newService.detailed_notes,
          techniques_used: newService.techniques_used,
          session_objectives: newService.session_objectives,
          patient_response: newService.patient_response,
          next_session_plan: newService.next_session_plan,
          materials_used: newService.materials_used ? newService.materials_used.split(',').map(m => m.trim()) : []
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Serviço adicionado ao histórico com sucesso!",
      });

      setNewService({
        service_type: '',
        date: '',
        time: '',
        duration: '60',
        detailed_notes: '',
        techniques_used: '',
        session_objectives: '',
        patient_response: '',
        next_session_plan: '',
        materials_used: ''
      });
      setAddServiceDialogOpen(false);
      loadServiceHistory();
    } catch (error) {
      console.error('Error adding service:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o serviço.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'scheduled': return 'Agendado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getServiceTypeColor = (type: string) => {
    const typeColors = {
      'Psicologia': 'bg-blue-100 text-blue-800',
      'Neuropsicologia': 'bg-purple-100 text-purple-800',
      'Fonoaudiologia': 'bg-green-100 text-green-800',
      'Terapia Ocupacional': 'bg-orange-100 text-orange-800',
      'Fisioterapia': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return typeColors[type as keyof typeof typeColors] || typeColors.default;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Serviços
          </CardTitle>
          <Dialog open={addServiceDialogOpen} onOpenChange={setAddServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Tipo de Serviço</Label>
                    <Select value={newService.service_type} onValueChange={(value) => setNewService({...newService, service_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Psicologia">Psicologia</SelectItem>
                        <SelectItem value="Neuropsicologia">Neuropsicologia</SelectItem>
                        <SelectItem value="Fonoaudiologia">Fonoaudiologia</SelectItem>
                        <SelectItem value="Terapia Ocupacional">Terapia Ocupacional</SelectItem>
                        <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                        <SelectItem value="Consulta Médica">Consulta Médica</SelectItem>
                        <SelectItem value="Avaliação">Avaliação</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Select value={newService.duration} onValueChange={(value) => setNewService({...newService, duration: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                        <SelectItem value="90">90 minutos</SelectItem>
                        <SelectItem value="120">120 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceDate">Data do Serviço</Label>
                    <Input
                      id="serviceDate"
                      type="date"
                      value={newService.date}
                      onChange={(e) => setNewService({...newService, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceTime">Horário</Label>
                    <Input
                      id="serviceTime"
                      type="time"
                      value={newService.time}
                      onChange={(e) => setNewService({...newService, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionObjectives">Objetivos da Sessão</Label>
                  <Textarea
                    id="sessionObjectives"
                    value={newService.session_objectives}
                    onChange={(e) => setNewService({...newService, session_objectives: e.target.value})}
                    placeholder="Descreva os objetivos da sessão..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detailedNotes">Observações Detalhadas</Label>
                  <Textarea
                    id="detailedNotes"
                    value={newService.detailed_notes}
                    onChange={(e) => setNewService({...newService, detailed_notes: e.target.value})}
                    placeholder="Descreva detalhadamente o que foi realizado na sessão..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="techniquesUsed">Técnicas Utilizadas</Label>
                  <Textarea
                    id="techniquesUsed"
                    value={newService.techniques_used}
                    onChange={(e) => setNewService({...newService, techniques_used: e.target.value})}
                    placeholder="Descreva as técnicas e métodos utilizados..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientResponse">Resposta do Paciente</Label>
                  <Textarea
                    id="patientResponse"
                    value={newService.patient_response}
                    onChange={(e) => setNewService({...newService, patient_response: e.target.value})}
                    placeholder="Como o paciente respondeu ao tratamento..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextSessionPlan">Plano para Próxima Sessão</Label>
                  <Textarea
                    id="nextSessionPlan"
                    value={newService.next_session_plan}
                    onChange={(e) => setNewService({...newService, next_session_plan: e.target.value})}
                    placeholder="Planejamento para a próxima sessão..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialsUsed">Materiais Utilizados</Label>
                  <Input
                    id="materialsUsed"
                    value={newService.materials_used}
                    onChange={(e) => setNewService({...newService, materials_used: e.target.value})}
                    placeholder="Ex: Jogos cognitivos, exercícios de coordenação..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddServiceDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddService} disabled={loading || !newService.service_type || !newService.date || !newService.time}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando histórico...</div>
          </div>
        ) : serviceRecords.length > 0 ? (
          <div className="space-y-6">
            {serviceRecords.map((record, index) => (
              <div key={record.id} className="relative">
                {/* Linha da timeline */}
                {index < serviceRecords.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-border"></div>
                )}
                
                <div className="flex gap-4">
                  {/* Indicador da timeline */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    {getStatusIcon(record.status)}
                  </div>
                  
                  {/* Conteúdo do serviço */}
                  <div className="flex-1 pb-8">
                    <div className="bg-card border rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{record.service_type}</h4>
                            <Badge className={getServiceTypeColor(record.service_type)}>
                              {record.service_type}
                            </Badge>
                            <Badge variant="outline">
                              {getStatusLabel(record.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(record.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {record.professional_name} ({record.professional_role})
                            </div>
                            {record.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {record.duration} min
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Detalhes do serviço */}
                      <div className="space-y-3">
                        {record.session_objectives && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Objetivos da Sessão:</h5>
                            <p className="text-sm text-muted-foreground">{record.session_objectives}</p>
                          </div>
                        )}
                        
                        {record.detailed_notes && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Observações Detalhadas:</h5>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.detailed_notes}</p>
                          </div>
                        )}
                        
                        {record.techniques_used && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Técnicas Utilizadas:</h5>
                            <p className="text-sm text-muted-foreground">{record.techniques_used}</p>
                          </div>
                        )}
                        
                        {record.patient_response && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Resposta do Paciente:</h5>
                            <p className="text-sm text-muted-foreground">{record.patient_response}</p>
                          </div>
                        )}
                        
                        {record.next_session_plan && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Plano para Próxima Sessão:</h5>
                            <p className="text-sm text-muted-foreground">{record.next_session_plan}</p>
                          </div>
                        )}
                        
                        {record.materials_used && record.materials_used.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Materiais Utilizados:</h5>
                            <p className="text-sm text-muted-foreground">
                              {Array.isArray(record.materials_used) 
                                ? record.materials_used.join(', ') 
                                : record.materials_used}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Fonte do registro */}
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>
                            {record.source === 'schedule' && 'Agendamento'}
                            {record.source === 'medical_record' && 'Registro Médico'}
                            {record.source === 'session_report' && 'Relatório de Sessão'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum serviço registrado no histórico.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione um novo serviço para começar o histórico detalhado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}