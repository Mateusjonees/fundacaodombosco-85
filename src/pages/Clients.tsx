import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCustomPermissions } from "@/hooks/useCustomPermissions";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Edit,
  Eye,
  ArrowLeft,
  Users,
  Filter,
  Power,
  Upload,
  Database,
  FileDown,
  FileText,
  CheckSquare,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebounce";
import ClientDetailsView from "@/components/ClientDetailsView";
import { BulkImportClientsDialog } from "@/components/BulkImportClientsDialog";
import { AutoImportClientsDialog } from "@/components/AutoImportClientsDialog";
import { PatientReportGenerator } from "@/components/PatientReportGenerator";
import { MultiPatientReportGenerator } from "@/components/MultiPatientReportGenerator";
import { ClientAssignmentManager } from "@/components/ClientAssignmentManager";
import { importClientsFromFile } from "@/utils/importClients";
import { executeDirectImport } from "@/utils/directImport";
interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_history?: string;
  cpf?: string;
  responsible_name?: string;
  responsible_phone?: string;
  responsible_cpf?: string;
  unit?: string;
  diagnosis?: string;
  neuropsych_complaint?: string;
  treatment_expectations?: string;
  clinical_observations?: string;
  is_active: boolean;
  created_at: string;
}
interface UserProfile {
  employee_role: string;
}
export default function Patients() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canViewAllClients, canCreateClients, canEditClients, canDeleteClients, isGodMode } = useRolePermissions();
  const customPermissions = useCustomPermissions();
  const [employees, setEmployees] = useState<any[]>([]);
  const [clientAssignments, setClientAssignments] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [professionalFilter, setProfessionalFilter] = useState("all");

  // Debounce da busca para evitar queries excessivas durante digitação
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  // Usar React Query com cache e filtros otimizados
  const { data: clients = [], isLoading } = useClients({
    searchTerm: debouncedSearch || undefined,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [reportClient, setReportClient] = useState<Client | null>(null);
  const { toast } = useToast();

  // Helper function to check if user is coordinator or director
  const isCoordinatorOrDirector = () => {
    return (
      userProfile?.employee_role === "director" ||
      userProfile?.employee_role === "coordinator_madre" ||
      userProfile?.employee_role === "coordinator_floresta"
    );
  };
  const [newClient, setNewClient] = useState({
    name: "",
    phone: "",
    email: "",
    birth_date: "",
    address: "",
    emergency_contact: "",
    emergency_phone: "",
    medical_history: "",
    cpf: "",
    responsible_name: "",
    responsible_phone: "",
    responsible_cpf: "",
    unit: "madre",
    diagnosis: "",
    neuropsych_complaint: "",
    treatment_expectations: "",
    clinical_observations: "",
  });

  // Auto-definir a unidade baseada no coordenador logado
  useEffect(() => {
    if (userProfile) {
      let defaultUnit = "madre";
      if (userProfile.employee_role === "coordinator_floresta") {
        defaultUnit = "floresta";
      } else if (userProfile.employee_role === "coordinator_madre") {
        defaultUnit = "madre";
      }
      setNewClient((prev) => ({
        ...prev,
        unit: defaultUnit,
      }));
    }
  }, [userProfile]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isMultiReportOpen, setIsMultiReportOpen] = useState(false);
  useEffect(() => {
    loadUserProfile();
    loadEmployees();
    loadClientAssignments();
  }, [user]);

  // Abrir cliente via URL se clientId estiver presente
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    if (clientId && clients.length > 0) {
      const clientToOpen = clients.find(c => c.id === clientId);
      if (clientToOpen) {
        setSelectedClient(clientToOpen);
        // Limpar o parâmetro da URL após selecionar
        searchParams.delete('clientId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, clients]);

  // React Query carrega automaticamente os clientes

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("profiles").select("employee_role").eq("user_id", user.id).single();
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };
  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, employee_role, user_id")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };
  const loadClientAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("client_assignments")
        .select(
          `
          client_id,
          employee_id,
          is_active,
          clients (id, name),
          profiles!client_assignments_employee_id_fkey (id, name, user_id)
        `,
        )
        .eq("is_active", true);
      if (error) throw error;
      setClientAssignments(data || []);
    } catch (error) {
      console.error("Error loading client assignments:", error);
    }
  };

  // loadClients removido - agora usamos React Query com useClients hook

  const handleCreateClient = async () => {
    try {
      const { error } = await supabase.from("clients").insert({
        ...newClient,
        created_by: user?.id,
      });
      if (error) throw error;
      toast({
        title: "Paciente cadastrado",
        description: "Paciente cadastrado com sucesso!",
      });
      setIsDialogOpen(false);
      resetForm();
      window.location.reload(); // Recarrega para atualizar cache
      loadClientAssignments();
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o paciente.",
      });
    }
  };
  const handleUpdateClient = async () => {
    if (!editingClient) return;
    try {
      const { error } = await supabase.from("clients").update(newClient).eq("id", editingClient.id);
      if (error) throw error;
      toast({
        title: "Paciente atualizado",
        description: "Dados atualizados com sucesso!",
      });
      setIsDialogOpen(false);
      setEditingClient(null);
      resetForm();
      window.location.reload();
      loadClientAssignments();
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o paciente.",
      });
    }
  };
  const handleToggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          is_active: !currentStatus,
        })
        .eq("id", clientId);
      if (error) throw error;
      toast({
        title: currentStatus ? "Paciente desativado" : "Paciente ativado",
        description: `Paciente ${currentStatus ? "desativado" : "ativado"} com sucesso!`,
      });
      window.location.reload();
    } catch (error) {
      console.error("Error toggling client status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do paciente.",
      });
    }
  };
  const resetForm = () => {
    const defaultUnit = userProfile?.employee_role === "coordinator_floresta" ? "floresta" : "madre";
    setNewClient({
      name: "",
      phone: "",
      email: "",
      birth_date: "",
      address: "",
      emergency_contact: "",
      emergency_phone: "",
      medical_history: "",
      cpf: "",
      responsible_name: "",
      responsible_phone: "",
      responsible_cpf: "",
      unit: defaultUnit,
      diagnosis: "",
      neuropsych_complaint: "",
      treatment_expectations: "",
      clinical_observations: "",
    });
  };

  // Funções de seleção múltipla
  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const getSelectedClientsData = () => {
    return filteredClients.filter(c => selectedClients.includes(c.id));
  };

  const handleGenerateMultiReport = () => {
    if (selectedClients.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum paciente selecionado",
        description: "Selecione pelo menos um paciente para gerar o relatório.",
      });
      return;
    }
    setIsMultiReportOpen(true);
  };

  const handleDirectImport = async () => {
    setIsImporting(true);
    try {
      const result = await executeDirectImport();
      if (result.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${result.success} pacientes importados com sucesso.`,
        });
        window.location.reload();
      }
      if (result.errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Alguns erros ocorreram",
          description: `${result.errors.length} erro(s) encontrado(s). Verifique o console para detalhes.`,
        });
        console.error("Erros na importação:", result.errors);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível importar os pacientes.",
      });
      console.error("Erro na importação:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // Executar importação automática ao carregar a página
  const executeAutoImport = async () => {
    await handleDirectImport();
  };

  // Importação automática removida para evitar notificações indesejadas
  // useEffect(() => {
  //   if (userProfile && clients.length === 0) {
  //     executeAutoImport();
  //   }
  // }, [userProfile]);

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
      birth_date: client.birth_date || "",
      address: client.address || "",
      emergency_contact: client.emergency_contact || "",
      emergency_phone: client.emergency_phone || "",
      medical_history: client.medical_history || "",
      cpf: client.cpf || "",
      responsible_name: client.responsible_name || "",
      responsible_phone: client.responsible_phone || "",
      responsible_cpf: (client as any).responsible_cpf || "",
      unit: client.unit || "madre",
      diagnosis: client.diagnosis || "",
      neuropsych_complaint: client.neuropsych_complaint || "",
      treatment_expectations: client.treatment_expectations || "",
      clinical_observations: client.clinical_observations || "",
    });
    setIsDialogOpen(true);
  };

  // Filtros aplicados no frontend (unit, age, professional)
  // O searchTerm já é aplicado via React Query com debounce
  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const matchesUnit = unitFilter === "all" || client.unit === unitFilter;
        const matchesAge =
          ageFilter === "all" ||
          (() => {
            if (!client.birth_date) return true;
            const birthDate = new Date(client.birth_date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            if (ageFilter === "minor") return age < 18;
            if (ageFilter === "adult") return age >= 18;
            return true;
          })();

        // Professional filter - only show if coordinator/director
        const matchesProfessional =
          !isCoordinatorOrDirector() ||
          professionalFilter === "all" ||
          (() => {
            // Find assignments for this client
            const clientAssignment = clientAssignments.find(
              (assignment) => assignment.client_id === client.id && assignment.is_active,
            );

            // If professional filter is selected, check if client is assigned to that professional
            if (professionalFilter !== "all") {
              // The professionalFilter contains the employee.id (profile id),
              // but we need to compare with user_id in assignments
              const selectedEmployee = employees.find((emp) => emp.id === professionalFilter);
              if (selectedEmployee && clientAssignment) {
                const matches = clientAssignment.employee_id === selectedEmployee.user_id;
                return matches;
              }
              // If no assignment found and filtering by professional, don't show this client
              return false;
            }
            return true;
          })();
        return matchesUnit && matchesAge && matchesProfessional;
      }),
    [clients, unitFilter, ageFilter, professionalFilter, clientAssignments, employees, isCoordinatorOrDirector],
  );
  if (selectedClient) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelectedClient(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Lista
        </Button>
        <ClientDetailsView
          client={selectedClient}
          onEdit={() => {
            setSelectedClient(null);
            openEditDialog(selectedClient);
          }}
          onBack={() => setSelectedClient(null)}
          onRefresh={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
              Gerenciar Pacientes
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-5 flex items-center gap-2">
            {isGodMode() ? (
              <>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-600 text-xs font-medium">
                  🔑 Modo Diretor
                </span>{" "}
                Acesso total aos pacientes
              </>
            ) : isCoordinatorOrDirector() ? (
              <>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                  📋
                </span>{" "}
                Gerenciando pacientes da sua unidade
              </>
            ) : (
              <>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-medium">
                  👥
                </span>{" "}
                Visualizando apenas pacientes vinculados a você
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGodMode() && (
            <Badge
              variant="default"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg"
            >
              🔑 Diretor
            </Badge>
          )}
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingClient(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0">
                <Plus className="h-5 w-5" />
                Cadastrar Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClient ? "Editar Paciente" : "Cadastrar Novo Paciente"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        name: e.target.value,
                      })
                    }
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        phone: e.target.value,
                      })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        email: e.target.value,
                      })
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={newClient.birth_date}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        birth_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={newClient.cpf}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        cpf: e.target.value,
                      })
                    }
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Select
                    value={newClient.unit}
                    onValueChange={(value) =>
                      setNewClient({
                        ...newClient,
                        unit: value,
                      })
                    }
                    disabled={
                      userProfile?.employee_role === "coordinator_madre" ||
                      userProfile?.employee_role === "coordinator_floresta"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(userProfile?.employee_role === "director" || userProfile?.employee_role === "receptionist") && (
                        <>
                          <SelectItem value="madre">MADRE (Clínica Social)</SelectItem>
                          <SelectItem value="floresta">Floresta (Neuroavaliação)</SelectItem>
                          <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
                        </>
                      )}
                      {userProfile?.employee_role === "coordinator_madre" && (
                        <SelectItem value="madre">MADRE</SelectItem>
                      )}
                      {userProfile?.employee_role === "coordinator_floresta" && (
                        <SelectItem value="floresta">Neuro (Floresta)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {(userProfile?.employee_role === "coordinator_madre" ||
                    userProfile?.employee_role === "coordinator_floresta") && (
                    <p className="text-sm text-muted-foreground">Você só pode cadastrar clientes para sua unidade.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible_name">Nome do Responsável</Label>
                  <Input
                    id="responsible_name"
                    value={newClient.responsible_name}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        responsible_name: e.target.value,
                      })
                    }
                    placeholder="Nome completo do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible_phone">Telefone do Responsável</Label>
                  <Input
                    id="responsible_phone"
                    value={newClient.responsible_phone}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        responsible_phone: e.target.value,
                      })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible_cpf">CPF do Responsável Financeiro</Label>
                  <Input
                    id="responsible_cpf"
                    value={newClient.responsible_cpf}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        responsible_cpf: e.target.value,
                      })
                    }
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                  <Input
                    id="emergency_contact"
                    value={newClient.emergency_contact}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        emergency_contact: e.target.value,
                      })
                    }
                    placeholder="Nome do contato de emergência"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                  <Input
                    id="emergency_phone"
                    value={newClient.emergency_phone}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        emergency_phone: e.target.value,
                      })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Textarea
                    id="address"
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        address: e.target.value,
                      })
                    }
                    placeholder="Rua, número, bairro, cidade, CEP"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="medical_history">Histórico Médico</Label>
                  <Textarea
                    id="medical_history"
                    value={newClient.medical_history}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        medical_history: e.target.value,
                      })
                    }
                    placeholder="Histórico médico relevante, medicações em uso, alergias..."
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="diagnosis">Diagnóstico</Label>
                  <Textarea
                    id="diagnosis"
                    value={newClient.diagnosis}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        diagnosis: e.target.value,
                      })
                    }
                    placeholder="Diagnóstico médico ou hipótese diagnóstica"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="neuropsych_complaint">Queixa Neuropsicológica</Label>
                  <Textarea
                    id="neuropsych_complaint"
                    value={newClient.neuropsych_complaint}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        neuropsych_complaint: e.target.value,
                      })
                    }
                    placeholder="Queixa principal relacionada à neuropsicologia"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="treatment_expectations">Expectativas do Tratamento</Label>
                  <Textarea
                    id="treatment_expectations"
                    value={newClient.treatment_expectations}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        treatment_expectations: e.target.value,
                      })
                    }
                    placeholder="O que o paciente/família espera do tratamento"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="clinical_observations">Observações Clínicas</Label>
                  <Textarea
                    id="clinical_observations"
                    value={newClient.clinical_observations}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        clinical_observations: e.target.value,
                      })
                    }
                    placeholder="Observações gerais sobre o paciente"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingClient ? handleUpdateClient : handleCreateClient} disabled={!newClient.name}>
                  {editingClient ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 via-card to-primary/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <CardHeader className="relative">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Filtros de Busca</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Unidade:</Label>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Todas as Unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  <SelectItem value="madre">MADRE (Clínica Social)</SelectItem>
                  <SelectItem value="floresta">Floresta (Neuroavaliação)</SelectItem>
                  <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Idade:</Label>
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Todas as Idades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Idades</SelectItem>
                  <SelectItem value="minor">Menor de Idade</SelectItem>
                  <SelectItem value="adult">Maior de Idade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCoordinatorOrDirector() && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Profissional:</Label>
                <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Todos os Profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Profissionais</SelectItem>
                    {employees.map((employee) => {
                      // Count how many clients this professional has assigned
                      const assignedCount = clientAssignments.filter(
                        (assignment) => assignment.employee_id === employee.user_id && assignment.is_active,
                      ).length;
                      return (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({assignedCount} pacientes)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total de Pacientes</CardTitle>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-extrabold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent mb-1">
              {filteredClients.length}
            </div>
            <p className="text-xs text-muted-foreground font-medium">Registrados no sistema</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-green-500/10 via-card to-green-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pacientes Ativos</CardTitle>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-extrabold bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent mb-1">
              {filteredClients.filter((c) => c.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground font-medium">Em tratamento ativo</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-gray-500/10 via-card to-gray-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pacientes Inativos</CardTitle>
            <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-extrabold bg-gradient-to-br from-gray-600 to-gray-400 bg-clip-text text-transparent mb-1">
              {filteredClients.filter((c) => !c.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground font-medium">Fora de tratamento</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList
          className="grid w-full max-w-md"
          style={{
            gridTemplateColumns: isCoordinatorOrDirector() ? "1fr 1fr" : "1fr",
          }}
        >
          <TabsTrigger value="list">Lista de Pacientes</TabsTrigger>
          {isCoordinatorOrDirector() && <TabsTrigger value="assignments">Gerenciar Vinculações</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Lista de Pacientes</CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center space-x-2 flex-1 relative">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="🔍 Buscar por ID, nome, CPF, telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 pl-10 border-primary/20 focus:border-primary/40 bg-background/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Unidades</SelectItem>
                      <SelectItem value="madre">MADRE (Clínica Social)</SelectItem>
                      <SelectItem value="floresta">Floresta (Neuroavaliação)</SelectItem>
                      <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Barra de seleção e ações em lote */}
              {isCoordinatorOrDirector() && filteredClients.length > 0 && (
                <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                      onCheckedChange={toggleSelectAll}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      {selectedClients.length > 0 
                        ? `${selectedClients.length} paciente(s) selecionado(s)`
                        : 'Selecionar todos'}
                    </label>
                  </div>
                  {selectedClients.length > 0 && (
                    <Button 
                      onClick={handleGenerateMultiReport}
                      variant="default"
                      size="sm"
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Gerar Relatório PDF ({selectedClients.length})
                    </Button>
                  )}
                </div>
              )}
              
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Carregando pacientes...</p>
              ) : filteredClients.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {searchTerm ? "Nenhum paciente encontrado com o termo de busca." : "Nenhum paciente cadastrado."}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isCoordinatorOrDirector() && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow 
                        key={client.id}
                        className={selectedClients.includes(client.id) ? "bg-primary/5" : ""}
                      >
                        {isCoordinatorOrDirector() && (
                          <TableCell>
                            <Checkbox
                              checked={selectedClients.includes(client.id)}
                              onCheckedChange={() => toggleClientSelection(client.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              client.unit === "madre"
                                ? "border-blue-500/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                                : "border-green-500/50 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            }
                          >
                            {client.unit === "madre" ? "🏥 Clinica Social" : 
                             client.unit === "floresta" ? "🧠 Neuro" :
                             client.unit === "atendimento_floresta" ? "🩺 Atend. Floresta" :
                             client.unit || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={client.is_active ? "default" : "secondary"}
                            className={
                              client.is_active
                                ? "bg-green-500/90 hover:bg-green-500 border-0"
                                : "bg-gray-400/90 hover:bg-gray-400 border-0"
                            }
                          >
                            {client.is_active ? "✓ Ativo" : "⏸ Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(client.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedClient(client)}
                              className="hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isCoordinatorOrDirector() && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(client)}
                                  className="hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/50 transition-all"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setReportClient(client)}
                                  className="hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50 transition-all"
                                  title="Gerar Relatório"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={client.is_active ? "outline" : "outline"}
                                  size="sm"
                                  onClick={() => handleToggleClientStatus(client.id, client.is_active)}
                                  className={
                                    client.is_active
                                      ? "hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50 transition-all"
                                      : "hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-all"
                                  }
                                  title={client.is_active ? "Desativar" : "Ativar"}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isCoordinatorOrDirector() && (
          <TabsContent value="assignments">
            <ClientAssignmentManager />
          </TabsContent>
        )}
      </Tabs>

      <BulkImportClientsDialog
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={() => {
          window.location.reload();
        }}
      />

      <AutoImportClientsDialog
        isOpen={isAutoImportOpen}
        onClose={() => setIsAutoImportOpen(false)}
        onImportComplete={() => {
          window.location.reload();
        }}
      />

      {reportClient && (
        <PatientReportGenerator client={reportClient} isOpen={!!reportClient} onClose={() => setReportClient(null)} />
      )}

      <MultiPatientReportGenerator 
        clients={getSelectedClientsData()} 
        isOpen={isMultiReportOpen} 
        onClose={() => {
          setIsMultiReportOpen(false);
          setSelectedClients([]);
        }} 
      />
    </div>
  );
}
