import { useState, useEffect } from 'react';
import { FileText, Search, User, Activity, Calendar, ClipboardList, Pill, FileCheck, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { useLaudos } from '@/hooks/useLaudos';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { MedicalRecordTimeline } from '@/components/MedicalRecordTimeline';
import { AddMedicalRecordDialog } from '@/components/AddMedicalRecordDialog';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { formatDateBR } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const { data: medicalRecords = [], isLoading: loadingRecords } = useMedicalRecords(selectedClientId);
  const { data: laudos = [], isLoading: loadingLaudos } = useLaudos(selectedClientId);
  const { data: prescriptions = [], isLoading: loadingPrescriptions } = usePrescriptions(selectedClientId);

  // Buscar anamneses do paciente
  const { data: anamnesis = [], isLoading: loadingAnamnesis } = useQuery({
    queryKey: ['anamnesis-records', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase
        .from('anamnesis_records')
        .select('*, anamnesis_types(name)')
        .eq('client_id', selectedClientId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Buscar nomes dos profissionais
      if (data && data.length > 0) {
        const filledByIds = [...new Set(data.map(a => a.filled_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', filledByIds);

        return data.map(record => ({
          ...record,
          professional_name: profiles?.find(p => p.user_id === record.filled_by)?.name || 'Profissional'
        }));
      }
      return [];
    },
    enabled: !!selectedClientId,
  });

  // Buscar atendimentos do paciente
  const { data: attendances = [], isLoading: loadingAttendances } = useQuery({
    queryKey: ['attendance-reports', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase
        .from('attendance_reports')
        .select('*')
        .eq('client_id', selectedClientId)
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClientId,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setUserProfile(profile);
  };

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['my-patients-medical-records', userProfile?.user_id, userProfile?.employee_role, debouncedSearch],
    queryFn: async () => {
      if (!userProfile) return [];
      const isDirector = userProfile.employee_role === 'director';
      const isCoordinator = ['coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta'].includes(userProfile.employee_role);

      if (isDirector || isCoordinator) {
        let query = supabase
          .from('clients')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (debouncedSearch) {
          query = query.or(`name.ilike.%${debouncedSearch}%,cpf.ilike.%${debouncedSearch}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      }

      const { data: assignments, error: assignError } = await supabase
        .from('client_assignments')
        .select('client_id')
        .eq('employee_id', userProfile.user_id)
        .eq('is_active', true);
      if (assignError) throw assignError;
      if (!assignments || assignments.length === 0) return [];
      const clientIds = assignments.map(a => a.client_id).filter(Boolean);

      let query = supabase
        .from('clients')
        .select('*')
        .in('id', clientIds)
        .eq('is_active', true)
        .order('name');
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,cpf.ilike.%${debouncedSearch}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile,
    staleTime: 60000,
  });

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setSelectedClientId(client.id);
  };

  const getUnitStyle = (unit: string) => {
    switch (unit?.toLowerCase()) {
      case 'madre': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400';
      case 'floresta': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'atendimento_floresta': return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Concluído</Badge>;
      case 'validated': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Validado</Badge>;
      case 'pending': return <Badge variant="outline">Pendente</Badge>;
      case 'draft': return <Badge variant="secondary">Rascunho</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="w-full p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Prontuários</h1>
              <p className="text-blue-100 mt-1">Sistema completo de prontuários e histórico clínico</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
            {clients.length} pacientes
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Lista de Pacientes */}
        <Card className="lg:col-span-1 border-0 shadow-lg bg-gradient-to-b from-card to-muted/20">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Meus Pacientes
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/80 backdrop-blur-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {loadingClients ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : clients.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum paciente encontrado</p>
                </div>
              ) : (
                <div className="divide-y">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className={`w-full p-4 text-left transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent dark:hover:from-blue-950/30 ${
                        selectedClientId === client.id 
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/30 border-l-4 border-blue-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium uppercase">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.cpf || 'CPF não informado'}</p>
                        </div>
                        {client.unit && (
                          <Badge variant="outline" className={`ml-2 ${getUnitStyle(client.unit)}`}>
                            {client.unit}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prontuário Detalhado */}
        <div className="lg:col-span-2">
          {!selectedClient ? (
            <Card className="h-[600px] flex items-center justify-center border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
              <CardContent className="text-center">
                <div className="p-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 inline-block mb-4">
                  <FileText className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Selecione um Paciente</h3>
                <p className="text-muted-foreground">Escolha um paciente na lista ao lado para visualizar seu prontuário</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-t-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      {selectedClient.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {selectedClient.birth_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateBR(selectedClient.birth_date)}
                        </span>
                      )}
                      {selectedClient.cpf && <span>CPF: {selectedClient.cpf}</span>}
                    </div>
                  </div>
                  {userProfile && (
                    <AddMedicalRecordDialog 
                      clientId={selectedClient.id} 
                      employeeId={userProfile.user_id}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Resumo rápido */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  <div className="text-center p-3 rounded-lg bg-primary/5 border">
                    <p className="text-2xl font-bold text-primary">{medicalRecords.length}</p>
                    <p className="text-xs text-muted-foreground">Evoluções</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-500/5 border">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{attendances.length}</p>
                    <p className="text-xs text-muted-foreground">Atendimentos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-500/5 border">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{laudos.length}</p>
                    <p className="text-xs text-muted-foreground">Laudos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-500/5 border">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{prescriptions.length}</p>
                    <p className="text-xs text-muted-foreground">Receitas</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-cyan-500/5 border">
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{anamnesis.length}</p>
                    <p className="text-xs text-muted-foreground">Anamneses</p>
                  </div>
                </div>

                <Tabs defaultValue="timeline" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-muted/50 h-auto">
                    <TabsTrigger value="timeline" className="data-[state=active]:bg-background text-xs sm:text-sm py-2">
                      <Activity className="w-4 h-4 mr-1 hidden sm:block" />
                      Evoluções
                    </TabsTrigger>
                    <TabsTrigger value="attendances" className="data-[state=active]:bg-background text-xs sm:text-sm py-2">
                      <ClipboardList className="w-4 h-4 mr-1 hidden sm:block" />
                      Atendimentos
                    </TabsTrigger>
                    <TabsTrigger value="laudos" className="data-[state=active]:bg-background text-xs sm:text-sm py-2">
                      <FileCheck className="w-4 h-4 mr-1 hidden sm:block" />
                      Laudos
                    </TabsTrigger>
                    <TabsTrigger value="prescriptions" className="data-[state=active]:bg-background text-xs sm:text-sm py-2">
                      <Pill className="w-4 h-4 mr-1 hidden sm:block" />
                      Receitas
                    </TabsTrigger>
                    <TabsTrigger value="anamnesis" className="data-[state=active]:bg-background text-xs sm:text-sm py-2">
                      <MessageSquare className="w-4 h-4 mr-1 hidden sm:block" />
                      Anamneses
                    </TabsTrigger>
                    <TabsTrigger value="info" className="data-[state=active]:bg-background text-xs sm:text-sm py-2">
                      <User className="w-4 h-4 mr-1 hidden sm:block" />
                      Info
                    </TabsTrigger>
                  </TabsList>

                  {/* Evoluções */}
                  <TabsContent value="timeline" className="space-y-4 mt-6">
                    {loadingRecords ? (
                      <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
                    ) : (
                      <MedicalRecordTimeline records={medicalRecords} />
                    )}
                  </TabsContent>

                  {/* Atendimentos */}
                  <TabsContent value="attendances" className="space-y-3 mt-6">
                    {loadingAttendances ? (
                      <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
                    ) : attendances.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum atendimento registrado</p>
                      </div>
                    ) : (
                      attendances.map((att) => (
                        <Card key={att.id} className="border bg-card hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{att.professional_name}</span>
                                  {getStatusBadge(att.validation_status || att.status)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(att.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  {att.session_duration && ` • ${att.session_duration} min`}
                                </p>
                                {att.attendance_type && (
                                  <Badge variant="outline" className="text-xs">{att.attendance_type}</Badge>
                                )}
                                {att.session_notes && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{att.session_notes}</p>
                                )}
                                {att.techniques_used && (
                                  <p className="text-xs text-muted-foreground"><strong>Técnicas:</strong> {att.techniques_used}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Laudos */}
                  <TabsContent value="laudos" className="space-y-3 mt-6">
                    {loadingLaudos ? (
                      <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
                    ) : laudos.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum laudo registrado</p>
                      </div>
                    ) : (
                      laudos.map((laudo) => (
                        <Card key={laudo.id} className="border bg-card hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <p className="font-semibold text-sm">{laudo.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateBR(laudo.laudo_date)} • {laudo.employee?.name || 'Profissional'}
                                </p>
                                {laudo.laudo_type && <Badge variant="outline" className="text-xs">{laudo.laudo_type}</Badge>}
                                {laudo.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{laudo.description}</p>
                                )}
                              </div>
                              {getStatusBadge(laudo.status)}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Receitas */}
                  <TabsContent value="prescriptions" className="space-y-3 mt-6">
                    {loadingPrescriptions ? (
                      <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
                    ) : prescriptions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma receita registrada</p>
                      </div>
                    ) : (
                      prescriptions.map((rx) => (
                        <Card key={rx.id} className="border bg-card hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm">
                                  Receita - {formatDateBR(rx.prescription_date)}
                                </p>
                                {getStatusBadge(rx.status)}
                              </div>
                              <p className="text-xs text-muted-foreground">{rx.employee?.name || 'Profissional'}</p>
                              {rx.diagnosis && <p className="text-xs"><strong>Diagnóstico:</strong> {rx.diagnosis}</p>}
                              <div className="mt-2 space-y-1">
                                {rx.medications?.slice(0, 3).map((med, i) => (
                                  <div key={i} className="text-xs bg-muted/50 p-2 rounded">
                                    <strong>{med.name}</strong> - {med.dosage} • {med.frequency}
                                  </div>
                                ))}
                                {rx.medications && rx.medications.length > 3 && (
                                  <p className="text-xs text-primary">+{rx.medications.length - 3} medicamentos</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Anamneses */}
                  <TabsContent value="anamnesis" className="space-y-3 mt-6">
                    {loadingAnamnesis ? (
                      <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
                    ) : anamnesis.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma anamnese registrada</p>
                      </div>
                    ) : (
                      anamnesis.map((record: any) => (
                        <Card key={record.id} className="border bg-card hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <p className="font-semibold text-sm">
                                  {record.anamnesis_types?.name || 'Anamnese'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateBR(record.created_at)} • {record.professional_name}
                                </p>
                                {record.notes && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{record.notes}</p>
                                )}
                              </div>
                              {getStatusBadge(record.status)}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Informações */}
                  <TabsContent value="info" className="space-y-4 mt-6">
                    <Card className="bg-gradient-to-br from-card to-muted/10">
                      <CardHeader>
                        <CardTitle className="text-lg">Informações do Paciente</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-sm font-medium text-muted-foreground">Nome</p>
                            <p className="font-medium">{selectedClient.name}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-sm font-medium text-muted-foreground">CPF</p>
                            <p className="font-medium">{selectedClient.cpf || '-'}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                            <p className="font-medium">{selectedClient.phone || '-'}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="font-medium">{selectedClient.email || '-'}</p>
                          </div>
                          <div className="col-span-2 p-3 rounded-lg bg-muted/30">
                            <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                            <p className="font-medium">{selectedClient.address || '-'}</p>
                          </div>
                        </div>
                        {selectedClient.diagnosis && (
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-sm font-medium text-primary mb-1">Diagnóstico</p>
                            <p className="text-sm">{selectedClient.diagnosis}</p>
                          </div>
                        )}
                        {selectedClient.medical_history && (
                          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">Histórico Médico</p>
                            <p className="text-sm whitespace-pre-wrap">{selectedClient.medical_history}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}