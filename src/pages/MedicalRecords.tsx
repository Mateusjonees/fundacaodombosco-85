import { useState, useEffect } from 'react';
import { FileText, Search, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients } from '@/hooks/useClients';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { MedicalRecordTimeline } from '@/components/MedicalRecordTimeline';
import { AddMedicalRecordDialog } from '@/components/AddMedicalRecordDialog';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebounce';

export default function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const { data: clients = [], isLoading: loadingClients } = useClients({ searchTerm: debouncedSearch });
  const { data: medicalRecords = [], isLoading: loadingRecords } = useMedicalRecords(selectedClientId);

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

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setSelectedClientId(client.id);
  };

  const isGodMode = () => userProfile?.employee_role === 'director';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Prontuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistema completo de prontuários e histórico clínico
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pacientes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Meus Pacientes</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
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
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedClientId === client.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.cpf || 'CPF não informado'}
                          </p>
                        </div>
                        {client.unit && (
                          <Badge variant="outline" className="ml-2">
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
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Paciente</h3>
                <p className="text-muted-foreground">
                  Escolha um paciente na lista ao lado para visualizar seu prontuário
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedClient.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {selectedClient.birth_date && (
                        <span>
                          Nascimento: {new Date(selectedClient.birth_date).toLocaleDateString('pt-BR')}
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
              <CardContent>
                <Tabs defaultValue="timeline" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="space-y-4 mt-6">
                    {loadingRecords ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-48 w-full" />
                        ))}
                      </div>
                    ) : (
                      <MedicalRecordTimeline records={medicalRecords} />
                    )}
                  </TabsContent>

                  <TabsContent value="info" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações do Paciente</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Nome</p>
                            <p className="font-medium">{selectedClient.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">CPF</p>
                            <p className="font-medium">{selectedClient.cpf || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                            <p className="font-medium">{selectedClient.phone || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="font-medium">{selectedClient.email || '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                            <p className="font-medium">{selectedClient.address || '-'}</p>
                          </div>
                        </div>

                        {selectedClient.diagnosis && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Diagnóstico</p>
                            <p className="text-sm">{selectedClient.diagnosis}</p>
                          </div>
                        )}

                        {selectedClient.medical_history && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Histórico Médico</p>
                            <p className="text-sm whitespace-pre-wrap">{selectedClient.medical_history}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Estatísticas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{medicalRecords.length}</p>
                            <p className="text-sm text-muted-foreground">Registros</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">
                              {medicalRecords.filter(r => r.status === 'completed').length}
                            </p>
                            <p className="text-sm text-muted-foreground">Completos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">
                              {medicalRecords[0] ? new Date(medicalRecords[0].session_date).toLocaleDateString('pt-BR') : '-'}
                            </p>
                            <p className="text-sm text-muted-foreground">Último Atendimento</p>
                          </div>
                        </div>
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