import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  UserCheck,
  UserX,
  Baby,
  UserRound,
  LayoutGrid,
  List,
  X,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Clock,
  CalendarDays,
  FileCheck,
  FileX,
} from "lucide-react";
import { PatientCard } from "@/components/PatientCard";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { FilterBar } from "@/components/ui/filter-bar";
import { useClients } from "@/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebounce";
import ClientDetailsView from "@/components/ClientDetailsView";
import { BulkImportClientsDialog } from "@/components/BulkImportClientsDialog";
import { AutoImportClientsDialog } from "@/components/AutoImportClientsDialog";
import { PatientReportGenerator } from "@/components/PatientReportGenerator";
import { MultiPatientReportGenerator } from "@/components/MultiPatientReportGenerator";
import { ClientAssignmentManager } from "@/components/ClientAssignmentManager";
import { PatientQuickViewModal } from "@/components/PatientQuickViewModal";
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
  const queryClient = useQueryClient();
  const { canViewAllClients, canCreateClients, canEditClients, canDeleteClients, isGodMode } = useRolePermissions();
  const customPermissions = useCustomPermissions();
  const [employees, setEmployees] = useState<any[]>([]);
  const [clientAssignments, setClientAssignments] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [professionalFilter, setProfessionalFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");
  const [laudoFilter, setLaudoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientLaudoIds, setClientLaudoIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");

  // Debounce da busca para evitar queries excessivas durante digitação
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  // Usar React Query com cache e filtros otimizados
  const { data: clients = [], isLoading } = useClients({
    searchTerm: debouncedSearch || undefined,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => {
    const tabs = searchParams.get('tabs');
    return tabs ? tabs.split(',').filter(Boolean) : [];
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    return searchParams.get('clientId') || null;
  });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [reportClient, setReportClient] = useState<Client | null>(null);
  const [quickViewClientId, setQuickViewClientId] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para abrir o quick view modal do paciente
  const handleOpenQuickView = useCallback((clientId: string) => {
    setQuickViewClientId(clientId);
  }, []);

  // Derivar os clientes abertos dos IDs
  const openTabs = useMemo(() => {
    return openTabIds.map(id => clients.find(c => c.id === id)).filter(Boolean) as Client[];
  }, [openTabIds, clients]);

  // Sync URL com tabs abertas
  const syncTabsToUrl = useCallback((tabIds: string[], active: string | null) => {
    const params = new URLSearchParams();
    if (tabIds.length > 0) params.set('tabs', tabIds.join(','));
    if (active) params.set('clientId', active);
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Função para selecionar cliente com persistência na URL e scroll
  const handleSelectClient = useCallback((client: Client) => {
    setOpenTabIds(prev => {
      const newTabs = prev.includes(client.id) ? prev : [...prev, client.id];
      syncTabsToUrl(newTabs, client.id);
      return newTabs;
    });
    setActiveTabId(client.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [syncTabsToUrl]);

  // Função para abrir perfil completo a partir do quick view
  const handleViewFullProfile = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setQuickViewClientId(null);
      handleSelectClient(client);
    }
  }, [clients, handleSelectClient]);

  // Função para fechar uma aba
  const handleCloseTab = useCallback((clientId: string) => {
    setOpenTabIds(prev => {
      const newTabs = prev.filter(id => id !== clientId);
      const newActive = activeTabId === clientId
        ? (newTabs.length > 0 ? newTabs[newTabs.length - 1] : null)
        : activeTabId;
      setActiveTabId(newActive);
      syncTabsToUrl(newTabs, newActive);
      return newTabs;
    });
  }, [activeTabId, syncTabsToUrl]);

  // Função para voltar à lista
  const handleBackToList = useCallback(() => {
    setActiveTabId(null);
    const params = new URLSearchParams();
    if (openTabIds.length > 0) params.set('tabs', openTabIds.join(','));
    setSearchParams(params, { replace: true });
  }, [openTabIds, setSearchParams]);

  // Função para invalidar cache ao invés de reload
  const refreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

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
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    loadUserProfile();
    loadEmployees();
    loadClientAssignments();
    loadClientLaudos();
  }, [user]);

  // Restaurar tabs via URL (já inicializadas no useState, apenas garantir activeTab)
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const tabsParam = searchParams.get('tabs');
    if (tabsParam && clients.length > 0) {
      const tabIds = tabsParam.split(',').filter(Boolean);
      setOpenTabIds(prev => {
        const merged = [...new Set([...prev, ...tabIds])];
        return merged;
      });
    }
    if (clientId && clients.length > 0) {
      setActiveTabId(clientId);
      // Garante que o clientId ativo está nas tabs
      setOpenTabIds(prev => prev.includes(clientId) ? prev : [...prev, clientId]);
    }
  }, [clients]);

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

  // Carregar IDs de clientes que possuem laudos
  const loadClientLaudos = async () => {
    try {
      const { data, error } = await supabase
        .from('client_laudos')
        .select('client_id')
        .eq('status', 'active');
      if (error) throw error;
      const ids = new Set((data || []).map(l => l.client_id));
      setClientLaudoIds(ids);
    } catch (error) {
      console.error("Error loading client laudos:", error);
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
      refreshClients();
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
      refreshClients();
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
      refreshClients();
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

  // Exclusão permanente de cliente (diretores e coordenadores)
  const handleDeleteClient = async () => {
    if (!deleteConfirmClient) return;
    setIsDeleting(true);
    try {
      const clientId = deleteConfirmClient.id;
      
      // Primeira onda: tabelas sem dependências entre si
      const firstWave = [
        supabase.from('client_assignments').delete().eq('client_id', clientId),
        supabase.from('client_notes').delete().eq('client_id', clientId),
        supabase.from('client_documents').delete().eq('client_id', clientId),
        supabase.from('client_laudos').delete().eq('client_id', clientId),
        supabase.from('medical_records').delete().eq('client_id', clientId),
        supabase.from('neuro_test_results').delete().eq('client_id', clientId),
        supabase.from('client_feedback_control').delete().eq('client_id', clientId),
        supabase.from('absence_records').delete().eq('client_id', clientId),
        supabase.from('anamnesis_records').delete().eq('client_id', clientId),
        supabase.from('consent_records').delete().eq('client_id', clientId),
        supabase.from('internal_referrals').delete().eq('client_id', clientId),
        supabase.from('meeting_alerts').delete().eq('client_id', clientId),
      ];
      
      const firstResults = await Promise.all(firstWave);
      firstResults.forEach((r, i) => {
        if (r.error) console.warn(`Cascade wave 1 item ${i} error:`, r.error.message);
      });

      // Segunda onda: agendamentos, notificações, financeiro
      const secondWave = [
        supabase.from('appointment_notifications').delete().eq('client_id', clientId),
        supabase.from('attendance_reports').delete().eq('client_id', clientId),
        supabase.from('client_payments').delete().eq('client_id', clientId),
        supabase.from('financial_records').delete().eq('client_id', clientId),
        supabase.from('automatic_financial_records').delete().eq('patient_id', clientId),
      ];

      const secondResults = await Promise.all(secondWave);
      secondResults.forEach((r, i) => {
        if (r.error) console.warn(`Cascade wave 2 item ${i} error:`, r.error.message);
      });

      // Terceira onda: schedules (precisa que appointment_notifications já tenha sido removido)
      const { error: schedError } = await supabase.from('schedules').delete().eq('client_id', clientId);
      if (schedError) console.warn('Cascade schedules error:', schedError.message);

      // Deletar o cliente
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;

      toast({
        title: "Paciente excluído",
        description: `${deleteConfirmClient.name} foi excluído permanentemente.`,
      });

      // Fechar tab se estiver aberta
      handleCloseTab(clientId);
      setDeleteConfirmClient(null);
      refreshClients();
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error?.message || "Não foi possível excluir o paciente. Pode haver registros vinculados.",
      });
    } finally {
      setIsDeleting(false);
    }
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
        refreshClients();
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

  // Helper: calcula idade a partir de birth_date
  const getAge = (birthDate: string | undefined): number | null => {
    if (!birthDate) return null;
    const bd = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const monthDiff = today.getMonth() - bd.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  };

  // Filtros aplicados no frontend (unit, age, professional, laudo)
  const filteredClients = useMemo(() => {
    const filtered = clients.filter((client) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && client.is_active) ||
        (statusFilter === "inactive" && !client.is_active);
      const matchesUnit = unitFilter === "all" || client.unit === unitFilter;
      const matchesAge =
        ageFilter === "all" ||
        (() => {
          const age = getAge(client.birth_date);
          if (age === null) return false; // Sem data de nascimento = excluído do filtro de idade
          if (ageFilter === "minor") return age < 18;
          if (ageFilter === "adult") return age >= 18;
          return true;
        })();

      const matchesProfessional =
        !isCoordinatorOrDirector() ||
        professionalFilter === "all" ||
        (() => {
          const clientAssignment = clientAssignments.find(
            (assignment) => assignment.client_id === client.id && assignment.is_active,
          );
          if (professionalFilter !== "all") {
            const selectedEmployee = employees.find((emp) => emp.id === professionalFilter);
            if (selectedEmployee && clientAssignment) {
              return clientAssignment.employee_id === selectedEmployee.user_id;
            }
            return false;
          }
          return true;
        })();

      const matchesLaudo =
        laudoFilter === "all" ||
        (laudoFilter === "with_laudo" && clientLaudoIds.has(client.id)) ||
        (laudoFilter === "without_laudo" && !clientLaudoIds.has(client.id));

      return matchesStatus && matchesUnit && matchesAge && matchesProfessional && matchesLaudo;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name, 'pt-BR');
        case "name_desc":
          return b.name.localeCompare(a.name, 'pt-BR');
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "age_asc": {
          const ageA = getAge(a.birth_date);
          const ageB = getAge(b.birth_date);
          if (ageA === null && ageB === null) return 0;
          if (ageA === null) return 1;
          if (ageB === null) return -1;
          return ageA - ageB;
        }
        case "age_desc": {
          const ageA = getAge(a.birth_date);
          const ageB = getAge(b.birth_date);
          if (ageA === null && ageB === null) return 0;
          if (ageA === null) return 1;
          if (ageB === null) return -1;
          return ageB - ageA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, statusFilter, unitFilter, ageFilter, professionalFilter, laudoFilter, sortBy, clientAssignments, employees, clientLaudoIds, userProfile?.employee_role]);
  const activeClient = openTabs.find(t => t.id === activeTabId) || null;

  // Renderizar tab bar de navegação (lista + pacientes abertos)
  const renderTabBar = () => {
    if (openTabIds.length === 0) return null;
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 border-b border-border/50 scrollbar-thin">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToList}
          className={`shrink-0 gap-1.5 rounded-t-lg rounded-b-none border-b-2 px-3 h-9 ${
            !activeTabId
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30"
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Lista</span>
        </Button>
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`shrink-0 flex items-center gap-1 rounded-t-lg rounded-b-none border-b-2 px-3 h-9 cursor-pointer transition-all ${
              tab.id === activeTabId
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-transparent hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            onClick={() => {
              setActiveTabId(tab.id);
              syncTabsToUrl(openTabIds, tab.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="text-sm max-w-[120px] sm:max-w-[180px] truncate">{tab.name.split(' ')[0]}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTab(tab.id);
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (activeTabId && activeClient) {
    return (
      <>
        <div className="space-y-0 animate-fade-in">
          {renderTabBar()}
          <ClientDetailsView
            client={activeClient}
            onEdit={() => {
              openEditDialog(activeClient);
            }}
            onBack={handleBackToList}
            onRefresh={refreshClients}
            onDelete={canDeleteClients() ? () => setDeleteConfirmClient(activeClient) : undefined}
          />
        </div>

        {/* Dialog de confirmação de exclusão (dentro do early return) */}
        <Dialog open={!!deleteConfirmClient} onOpenChange={(open) => !open && setDeleteConfirmClient(null)}>
          <DialogContent className="w-[95vw] max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-destructive">
                <div className="p-2 bg-destructive/10 rounded-xl">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                Excluir Paciente Permanentemente
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir <strong className="text-foreground">{deleteConfirmClient?.name}</strong>?
              </p>
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-sm space-y-1">
                <p className="font-medium text-destructive">⚠️ Esta ação é irreversível!</p>
                <p className="text-muted-foreground text-xs">
                  Todos os dados serão removidos: prontuários, agendamentos, laudos, receitas, notas, pagamentos e vinculações.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmClient(null)} className="rounded-xl">
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteClient} 
                disabled={isDeleting}
                className="rounded-xl gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
  // Counts for stats
  const activeCount = filteredClients.filter((c) => c.is_active).length;
  const inactiveCount = filteredClients.filter((c) => !c.is_active).length;
  const minorCount = filteredClients.filter((c) => {
    if (!c.birth_date) return false;
    const birthDate = new Date(c.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age < 18;
  }).length;
  const laudoCount = filteredClients.filter(c => clientLaudoIds.has(c.id)).length;
  const withoutLaudoCount = filteredClients.length - laudoCount;
  const activeFiltersCount = (statusFilter !== "all" ? 1 : 0) + (unitFilter !== "all" ? 1 : 0) + (ageFilter !== "all" ? 1 : 0) + (professionalFilter !== "all" ? 1 : 0) + (laudoFilter !== "all" ? 1 : 0) + (sortBy !== "name_asc" ? 1 : 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab bar de navegação entre lista e pacientes abertos */}
      {renderTabBar()}

      {/* Header */}
      <PageHeader
        title="Gerenciar Pacientes"
        description={
          isGodMode()
            ? "Acesso total aos pacientes do sistema"
            : isCoordinatorOrDirector()
            ? "Gerenciando pacientes da sua unidade"
            : "Visualizando pacientes vinculados a você"
        }
        icon={<Users className="h-6 w-6" />}
        iconColor="blue"
        actions={
          <>
            {isGodMode() && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
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
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total de Pacientes"
          value={filteredClients.length}
          subtitle="Registrados no sistema"
          icon={<Users className="h-5 w-5" />}
          variant="blue"
        />
        <StatsCard
          title="Pacientes Ativos"
          value={activeCount}
          subtitle="Em tratamento ativo"
          icon={<UserCheck className="h-5 w-5" />}
          variant="green"
        />
        <StatsCard
          title="Menores de Idade"
          value={minorCount}
          subtitle="Pacientes < 18 anos"
          icon={<Baby className="h-5 w-5" />}
          variant="purple"
        />
        <StatsCard
          title="Com Laudo"
          value={laudoCount}
          subtitle={`${withoutLaudoCount} sem laudo`}
          icon={<FileCheck className="h-5 w-5" />}
          variant="default"
        />
        <StatsCard
          title="Inativos"
          value={inactiveCount}
          subtitle="Fora de tratamento"
          icon={<UserX className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nome, CPF, telefone..."
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => {
          setStatusFilter("all");
          setUnitFilter("all");
          setAgeFilter("all");
          setProfessionalFilter("all");
          setLaudoFilter("all");
          setSortBy("name_asc");
        }}
        filters={
          <>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-10">
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Ordenar por" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                <SelectItem value="newest">Mais Recentes</SelectItem>
                <SelectItem value="oldest">Mais Antigos</SelectItem>
                <SelectItem value="age_asc">Idade (Menor → Maior)</SelectItem>
                <SelectItem value="age_desc">Idade (Maior → Menor)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                <SelectItem value="madre">MADRE</SelectItem>
                <SelectItem value="floresta">Floresta</SelectItem>
                <SelectItem value="atendimento_floresta">Atend. Floresta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="Idade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Idades</SelectItem>
                <SelectItem value="minor">Menores</SelectItem>
                <SelectItem value="adult">Adultos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={laudoFilter} onValueChange={setLaudoFilter}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="Laudo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos (Laudo)</SelectItem>
                <SelectItem value="with_laudo">
                  <span className="flex items-center gap-1.5"><FileCheck className="h-3.5 w-3.5 text-green-600" /> Com Laudo</span>
                </SelectItem>
                <SelectItem value="without_laudo">
                  <span className="flex items-center gap-1.5"><FileX className="h-3.5 w-3.5 text-orange-500" /> Sem Laudo</span>
                </SelectItem>
              </SelectContent>
            </Select>
            {isCoordinatorOrDirector() && (
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Profissionais</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        }
      />

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Lista de Pacientes</CardTitle>
                  <Badge variant="secondary" className="ml-2">{filteredClients.length}</Badge>
                </div>
                
                {/* Toggle de visualização */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className="h-8 px-3 gap-1.5"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Cards</span>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 px-3 gap-1.5"
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Lista</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
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
              ) : viewMode === "cards" ? (
                /* Visualização em Cards */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredClients.map((client) => (
                    <PatientCard
                      key={client.id}
                      client={client}
                      isSelected={selectedClients.includes(client.id)}
                      showCheckbox={isCoordinatorOrDirector()}
                      showActions={true}
                      onSelect={() => toggleClientSelection(client.id)}
                      onView={() => handleOpenQuickView(client.id)}
                      onEdit={isCoordinatorOrDirector() ? () => openEditDialog(client) : undefined}
                      onReport={isCoordinatorOrDirector() ? () => setReportClient(client) : undefined}
                      onToggleStatus={isCoordinatorOrDirector() ? () => handleToggleClientStatus(client.id, client.is_active) : undefined}
                      onDelete={canDeleteClients() ? () => setDeleteConfirmClient(client) : undefined}
                    />
                  ))}
                </div>
              ) : (
                /* Visualização em Lista/Tabela */
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table className="min-w-[700px]">
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
                                : client.unit === "floresta"
                                  ? "border-green-500/50 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                  : "border-purple-500/50 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
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
                              onClick={() => handleSelectClient(client)}
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
                                {canDeleteClients() && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteConfirmClient(client)}
                                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
                                    title="Excluir permanentemente"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
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
          refreshClients();
        }}
      />

      <AutoImportClientsDialog
        isOpen={isAutoImportOpen}
        onClose={() => setIsAutoImportOpen(false)}
        onImportComplete={() => {
          refreshClients();
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

      {/* Modal de visualização rápida do paciente */}
      <PatientQuickViewModal
        clientId={quickViewClientId}
        open={!!quickViewClientId}
        onOpenChange={(open) => {
          if (!open) setQuickViewClientId(null);
        }}
        onViewFullProfile={handleViewFullProfile}
      />

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={!!deleteConfirmClient} onOpenChange={(open) => !open && setDeleteConfirmClient(null)}>
        <DialogContent className="w-[95vw] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-destructive">
              <div className="p-2 bg-destructive/10 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </div>
              Excluir Paciente Permanentemente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{deleteConfirmClient?.name}</strong>?
            </p>
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-sm space-y-1">
              <p className="font-medium text-destructive">⚠️ Esta ação é irreversível!</p>
              <p className="text-muted-foreground text-xs">
                Todos os dados serão removidos: prontuários, agendamentos, laudos, receitas, notas, pagamentos e vinculações.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmClient(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteClient} 
              disabled={isDeleting}
              className="rounded-xl gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
