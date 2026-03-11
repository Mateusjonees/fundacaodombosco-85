import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCustomPermissions } from "@/hooks/useCustomPermissions";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Search, Eye, ArrowLeft, Filter, Power, Upload, Database,
  FileDown, FileText, CheckSquare, UserCheck, UserX, Baby, UserRound,
  LayoutGrid, List, X, Trash2, AlertTriangle, ArrowUpDown, Clock,
  CalendarDays, FileCheck, FileX, Download, Plus,
} from "lucide-react";
import * as XLSX from "xlsx";
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
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";

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
  gender?: string;
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
  const [genderFilter, setGenderFilter] = useState("all");
  const [clientLaudoIds, setClientLaudoIds] = useState<Set<string>>(new Set());
  const [lastAppointments, setLastAppointments] = useState<Map<string, string>>(new Map());
  const [firstAppointments, setFirstAppointments] = useState<Map<string, string>>(new Map());
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");

  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const { data: clients = [], isLoading } = useClients({ searchTerm: debouncedSearch || undefined });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => {
    const tabs = searchParams.get('tabs');
    return tabs ? tabs.split(',').filter(Boolean) : [];
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(() => searchParams.get('clientId') || null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [reportClient, setReportClient] = useState<Client | null>(null);
  const [quickViewClientId, setQuickViewClientId] = useState<string | null>(null);
  const { toast } = useToast();

  const [newClient, setNewClient] = useState({
    name: "", phone: "", email: "", birth_date: "", address: "",
    emergency_contact: "", emergency_phone: "", medical_history: "",
    cpf: "", responsible_name: "", responsible_phone: "", responsible_cpf: "",
    unit: "madre", diagnosis: "", neuropsych_complaint: "",
    treatment_expectations: "", clinical_observations: "",
  });

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isMultiReportOpen, setIsMultiReportOpen] = useState(false);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // === Derived state ===
  const openTabs = useMemo(() => openTabIds.map(id => clients.find(c => c.id === id)).filter(Boolean) as Client[], [openTabIds, clients]);

  const isCoordinatorOrDirector = useCallback(() => {
    return userProfile?.employee_role === "director" || userProfile?.employee_role === "coordinator_madre" || userProfile?.employee_role === "coordinator_floresta";
  }, [userProfile?.employee_role]);

  const getAge = useCallback((birthDate: string | undefined): number | null => {
    if (!birthDate) return null;
    const bd = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const monthDiff = today.getMonth() - bd.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  }, []);

  // === URL sync ===
  const syncTabsToUrl = useCallback((tabIds: string[], active: string | null) => {
    const params = new URLSearchParams();
    if (tabIds.length > 0) params.set('tabs', tabIds.join(','));
    if (active) params.set('clientId', active);
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const handleSelectClient = useCallback((client: Client) => {
    setOpenTabIds(prev => {
      const newTabs = prev.includes(client.id) ? prev : [...prev, client.id];
      syncTabsToUrl(newTabs, client.id);
      return newTabs;
    });
    setActiveTabId(client.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [syncTabsToUrl]);

  const handleOpenQuickView = useCallback((clientId: string) => setQuickViewClientId(clientId), []);

  const handleViewFullProfile = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) { setQuickViewClientId(null); handleSelectClient(client); }
  }, [clients, handleSelectClient]);

  const handleCloseTab = useCallback((clientId: string) => {
    setOpenTabIds(prev => {
      const newTabs = prev.filter(id => id !== clientId);
      const newActive = activeTabId === clientId ? (newTabs.length > 0 ? newTabs[newTabs.length - 1] : null) : activeTabId;
      setActiveTabId(newActive);
      syncTabsToUrl(newTabs, newActive);
      return newTabs;
    });
  }, [activeTabId, syncTabsToUrl]);

  const handleBackToList = useCallback(() => {
    setActiveTabId(null);
    const params = new URLSearchParams();
    if (openTabIds.length > 0) params.set('tabs', openTabIds.join(','));
    setSearchParams(params, { replace: true });
  }, [openTabIds, setSearchParams]);

  const refreshClients = useCallback(() => queryClient.invalidateQueries({ queryKey: ['clients'] }), [queryClient]);

  // === Data loading ===
  useEffect(() => {
    if (!user) return;
    const loadUserProfile = async () => {
      const { data } = await supabase.from("profiles").select("employee_role").eq("user_id", user.id).single();
      if (data) setUserProfile(data);
    };
    const loadEmployees = async () => {
      const { data } = await supabase.from("profiles").select("id, name, employee_role, user_id").eq("is_active", true).order("name");
      setEmployees(data || []);
    };
    const loadClientAssignments = async () => {
      const { data } = await supabase.from("client_assignments").select(`client_id, employee_id, is_active, clients (id, name), profiles!client_assignments_employee_id_fkey (id, name, user_id)`).eq("is_active", true);
      setClientAssignments(data || []);
    };
    const loadClientLaudos = async () => {
      const { data } = await supabase.from('client_laudos').select('client_id');
      setClientLaudoIds(new Set((data || []).map(l => l.client_id)));
    };
    const loadLastAppointments = async () => {
      const { data } = await supabase.from('schedules').select('client_id, completed_at').eq('status', 'completed').not('completed_at', 'is', null).order('completed_at', { ascending: false });
      const lastMap = new Map<string, string>();
      const firstMap = new Map<string, string>();
      (data || []).forEach((s: any) => {
        if (!lastMap.has(s.client_id)) lastMap.set(s.client_id, s.completed_at);
        // Para primeiro atendimento, sempre sobrescreve (dados vêm desc, último é o primeiro)
        firstMap.set(s.client_id, s.completed_at);
      });
      setLastAppointments(lastMap);
      setFirstAppointments(firstMap);
    };
    loadUserProfile();
    loadEmployees();
    loadClientAssignments();
    loadClientLaudos();
    loadLastAppointments();
  }, [user]);

  // Auto-set unit based on coordinator role
  useEffect(() => {
    if (userProfile) {
      const defaultUnit = userProfile.employee_role === "coordinator_floresta" ? "floresta" : "madre";
      setNewClient(prev => ({ ...prev, unit: defaultUnit }));
    }
  }, [userProfile]);

  // Restore tabs from URL
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const tabsParam = searchParams.get('tabs');
    if (tabsParam && clients.length > 0) {
      const tabIds = tabsParam.split(',').filter(Boolean);
      setOpenTabIds(prev => [...new Set([...prev, ...tabIds])]);
    }
    if (clientId && clients.length > 0) {
      setActiveTabId(clientId);
      setOpenTabIds(prev => prev.includes(clientId) ? prev : [...prev, clientId]);
    }
  }, [clients]);

  // === CRUD handlers ===
  const resetForm = useCallback(() => {
    const defaultUnit = userProfile?.employee_role === "coordinator_floresta" ? "floresta" : "madre";
    setNewClient({
      name: "", phone: "", email: "", birth_date: "", address: "",
      emergency_contact: "", emergency_phone: "", medical_history: "",
      cpf: "", responsible_name: "", responsible_phone: "", responsible_cpf: "",
      unit: defaultUnit, diagnosis: "", neuropsych_complaint: "",
      treatment_expectations: "", clinical_observations: "",
    });
  }, [userProfile?.employee_role]);

  const handleCreateClient = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const normalizedName = newClient.name.trim().toLowerCase();
      const { data: duplicatesByName } = await supabase.from("clients").select("id, name, cpf").ilike("name", normalizedName);
      let duplicatesByCpf: any[] = [];
      if (newClient.cpf && newClient.cpf.trim().length >= 11) {
        const { data } = await supabase.from("clients").select("id, name, cpf").eq("cpf", newClient.cpf.trim());
        duplicatesByCpf = data || [];
      }
      const allDuplicates = [...(duplicatesByName || []), ...duplicatesByCpf];
      const uniqueDuplicates = Array.from(new Map(allDuplicates.map(d => [d.id, d])).values());
      if (uniqueDuplicates.length > 0) {
        const names = uniqueDuplicates.map(d => d.name).join(", ");
        if (!window.confirm(`⚠️ Possível paciente duplicado encontrado!\n\nPacientes similares: ${names}\n\nDeseja cadastrar mesmo assim?`)) {
          setIsSaving(false); return;
        }
      }
      const { error } = await supabase.from("clients").insert({ ...newClient, name: newClient.name.trim(), cpf: newClient.cpf?.trim() || null, created_by: user?.id });
      if (error) throw error;
      toast({ title: "Paciente cadastrado", description: "Paciente cadastrado com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
      refreshClients();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível cadastrar o paciente." });
    } finally { setIsSaving(false); }
  }, [isSaving, newClient, user?.id, toast, resetForm, refreshClients]);

  const handleUpdateClient = useCallback(async () => {
    if (!editingClient) return;
    try {
      const { error } = await supabase.from("clients").update(newClient).eq("id", editingClient.id);
      if (error) throw error;
      toast({ title: "Paciente atualizado", description: "Dados atualizados com sucesso!" });
      setIsDialogOpen(false);
      setEditingClient(null);
      resetForm();
      refreshClients();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o paciente." });
    }
  }, [editingClient, newClient, toast, resetForm, refreshClients]);

  const handleToggleClientStatus = useCallback(async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("clients").update({ is_active: !currentStatus }).eq("id", clientId);
      if (error) throw error;
      toast({ title: currentStatus ? "Paciente desativado" : "Paciente ativado", description: `Paciente ${currentStatus ? "desativado" : "ativado"} com sucesso!` });
      refreshClients();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível alterar o status do paciente." });
    }
  }, [toast, refreshClients]);

  const handleDeleteClient = useCallback(async () => {
    if (!deleteConfirmClient) return;
    setIsDeleting(true);
    try {
      const clientId = deleteConfirmClient.id;
      const wave1 = [
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
      await Promise.all(wave1);
      const wave2 = [
        supabase.from('appointment_notifications').delete().eq('client_id', clientId),
        supabase.from('attendance_reports').delete().eq('client_id', clientId),
        supabase.from('client_payments').delete().eq('client_id', clientId),
        supabase.from('financial_records').delete().eq('client_id', clientId),
        supabase.from('automatic_financial_records').delete().eq('patient_id', clientId),
      ];
      await Promise.all(wave2);
      await supabase.from('schedules').delete().eq('client_id', clientId);
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      toast({ title: "Paciente excluído", description: `${deleteConfirmClient.name} foi excluído permanentemente.` });
      handleCloseTab(clientId);
      setDeleteConfirmClient(null);
      refreshClients();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error?.message || "Não foi possível excluir o paciente." });
    } finally { setIsDeleting(false); }
  }, [deleteConfirmClient, toast, handleCloseTab, refreshClients]);

  const openEditDialog = useCallback((client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name, phone: client.phone || "", email: client.email || "",
      birth_date: client.birth_date || "", address: client.address || "",
      emergency_contact: client.emergency_contact || "", emergency_phone: client.emergency_phone || "",
      medical_history: client.medical_history || "", cpf: client.cpf || "",
      responsible_name: client.responsible_name || "", responsible_phone: client.responsible_phone || "",
      responsible_cpf: (client as any).responsible_cpf || "", unit: client.unit || "madre",
      diagnosis: client.diagnosis || "", neuropsych_complaint: client.neuropsych_complaint || "",
      treatment_expectations: client.treatment_expectations || "", clinical_observations: client.clinical_observations || "",
    });
    setIsDialogOpen(true);
  }, []);

  // === Filtering & sorting (must be before callbacks that reference it) ===
  const filteredClients = useMemo(() => {
    const filtered = clients.filter((client) => {
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && client.is_active) || (statusFilter === "inactive" && !client.is_active);
      const matchesUnit = unitFilter === "all" || client.unit === unitFilter;
      const matchesAge = ageFilter === "all" || (() => {
        const age = getAge(client.birth_date);
        if (age === null) return false;
        return ageFilter === "minor" ? age < 18 : age >= 18;
      })();
      const matchesProfessional = !isCoordinatorOrDirector() || professionalFilter === "all" || (() => {
        const ca = clientAssignments.find(a => a.client_id === client.id && a.is_active);
        const emp = employees.find(e => e.id === professionalFilter);
        return emp && ca ? ca.employee_id === emp.user_id : false;
      })();
      const matchesLaudo = laudoFilter === "all" || (laudoFilter === "with_laudo" && clientLaudoIds.has(client.id)) || (laudoFilter === "without_laudo" && !clientLaudoIds.has(client.id));
      const matchesGender = genderFilter === "all" || client.gender === genderFilter;
      return matchesStatus && matchesUnit && matchesAge && matchesProfessional && matchesLaudo && matchesGender;
    });
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc": return a.name.localeCompare(b.name, 'pt-BR');
        case "name_desc": return b.name.localeCompare(a.name, 'pt-BR');
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "age_asc": case "age_desc": {
          const ageA = getAge(a.birth_date), ageB = getAge(b.birth_date);
          if (ageA === null && ageB === null) return 0;
          if (ageA === null) return 1;
          if (ageB === null) return -1;
          return sortBy === "age_asc" ? ageA - ageB : ageB - ageA;
        }
        case "last_appointment_recent": {
          const dateA = lastAppointments.get(a.id), dateB = lastAppointments.get(b.id);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
        case "last_appointment_oldest": {
          const dateA = lastAppointments.get(a.id), dateB = lastAppointments.get(b.id);
          if (!dateA && !dateB) return 0;
          if (!dateA) return -1;
          if (!dateB) return 1;
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        }
        case "no_activity": {
          const dateA = lastAppointments.get(a.id), dateB = lastAppointments.get(b.id);
          const now = Date.now();
          const daysA = dateA ? (now - new Date(dateA).getTime()) / 86400000 : 99999;
          const daysB = dateB ? (now - new Date(dateB).getTime()) / 86400000 : 99999;
          return daysB - daysA;
        }
        default: return 0;
      }
    });
    return filtered;
  }, [clients, statusFilter, unitFilter, ageFilter, professionalFilter, laudoFilter, genderFilter, sortBy, clientAssignments, employees, clientLaudoIds, getAge, isCoordinatorOrDirector, lastAppointments]);

  const handleExportExcel = useCallback(() => {
    const exportData = filteredClients.map(c => ({
      'Nome': c.name, 'CPF': c.cpf || '', 'Telefone': c.phone || '', 'E-mail': c.email || '',
      'Unidade': c.unit === 'madre' ? 'MADRE' : c.unit === 'floresta' ? 'Floresta' : c.unit === 'atendimento_floresta' ? 'Atend. Floresta' : c.unit || '',
      'Status': c.is_active ? 'Ativo' : 'Inativo',
      'Gênero': c.gender === 'male' ? 'Masculino' : c.gender === 'female' ? 'Feminino' : c.gender || '',
      'Data de Nascimento': c.birth_date ? new Date(c.birth_date).toLocaleDateString('pt-BR') : '',
      'Última Consulta': lastAppointments.get(c.id) ? new Date(lastAppointments.get(c.id)!).toLocaleDateString('pt-BR') : '',
      'Data de Cadastro': new Date(c.created_at).toLocaleDateString('pt-BR'),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');
    XLSX.writeFile(wb, `pacientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: "Exportação concluída", description: `${exportData.length} pacientes exportados para Excel.` });
  }, [filteredClients, lastAppointments, toast]);

  const toggleClientSelection = useCallback((clientId: string) => {
    setSelectedClients(prev => prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]);
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedClients(prev => prev.length === filteredClients.length ? [] : filteredClients.map(c => c.id));
  }, [filteredClients]);

  const activeClient = openTabs.find(t => t.id === activeTabId) || null;

  // === Tab bar renderer ===
  const renderTabBar = () => {
    if (openTabIds.length === 0) return null;
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 border-b border-border/50 scrollbar-thin">
        <Button variant="ghost" size="sm" onClick={handleBackToList}
          className={`shrink-0 gap-1.5 rounded-t-lg rounded-b-none border-b-2 px-3 h-9 ${!activeTabId ? "border-primary bg-primary/10 text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30"}`}>
          <Users className="h-4 w-4" /><span className="hidden sm:inline">Lista</span>
        </Button>
        {openTabs.map((tab) => (
          <div key={tab.id}
            className={`shrink-0 flex items-center gap-1 rounded-t-lg rounded-b-none border-b-2 px-3 h-9 cursor-pointer transition-all ${tab.id === activeTabId ? "border-primary bg-primary/10 text-primary font-medium" : "border-transparent hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            onClick={() => { setActiveTabId(tab.id); syncTabsToUrl(openTabIds, tab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="text-sm max-w-[120px] sm:max-w-[180px] truncate">{tab.name.split(' ')[0]}</span>
            <button onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }} className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // === Active client detail view ===
  if (activeTabId && activeClient) {
    return (
      <>
        <div className="space-y-0 animate-fade-in">
          {renderTabBar()}
          <ClientDetailsView client={activeClient} onEdit={() => openEditDialog(activeClient)} onBack={handleBackToList} onRefresh={refreshClients} onDelete={canDeleteClients() ? () => setDeleteConfirmClient(activeClient) : undefined} />
        </div>
        <DeleteClientDialog clientName={deleteConfirmClient?.name || null} isOpen={!!deleteConfirmClient} isDeleting={isDeleting} onClose={() => setDeleteConfirmClient(null)} onConfirm={handleDeleteClient} />
      </>
    );
  }

  // === Stats ===
  const activeCount = filteredClients.filter(c => c.is_active).length;
  const inactiveCount = filteredClients.filter(c => !c.is_active).length;
  const minorCount = filteredClients.filter(c => { const age = getAge(c.birth_date); return age !== null && age < 18; }).length;
  const laudoCount = filteredClients.filter(c => clientLaudoIds.has(c.id)).length;
  const withoutLaudoCount = filteredClients.length - laudoCount;
  const activeFiltersCount = [statusFilter !== "all", unitFilter !== "all", ageFilter !== "all", professionalFilter !== "all", laudoFilter !== "all", genderFilter !== "all", sortBy !== "name_asc"].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {renderTabBar()}

      {/* Header */}
      <PageHeader
        title="Gerenciar Pacientes"
        description={isGodMode() ? "Acesso total aos pacientes do sistema" : isCoordinatorOrDirector() ? "Gerenciando pacientes da sua unidade" : "Visualizando pacientes vinculados a você"}
        icon={<Users className="h-6 w-6" />}
        iconColor="blue"
        actions={
          <>
            {isGodMode() && <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">🔑 Diretor</Badge>}
            <ClientFormDialog
              isOpen={isDialogOpen}
              onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingClient(null); resetForm(); } }}
              formData={newClient}
              onFormChange={setNewClient}
              onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
              isEditing={!!editingClient}
              isSaving={isSaving}
              userRole={userProfile?.employee_role}
            />
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total de Pacientes" value={filteredClients.length} subtitle="Registrados no sistema" icon={<Users className="h-5 w-5" />} variant="blue" />
        <StatsCard title="Pacientes Ativos" value={activeCount} subtitle="Em tratamento ativo" icon={<UserCheck className="h-5 w-5" />} variant="green" />
        <StatsCard title="Menores de Idade" value={minorCount} subtitle="Pacientes < 18 anos" icon={<Baby className="h-5 w-5" />} variant="purple" />
        <StatsCard title="Com Laudo" value={laudoCount} subtitle={`${withoutLaudoCount} sem laudo`} icon={<FileCheck className="h-5 w-5" />} variant="default" />
        <StatsCard title="Inativos" value={inactiveCount} subtitle="Fora de tratamento" icon={<UserX className="h-5 w-5" />} variant="default" />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nome, CPF, telefone..."
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => { setStatusFilter("all"); setUnitFilter("all"); setAgeFilter("all"); setProfessionalFilter("all"); setLaudoFilter("all"); setGenderFilter("all"); setSortBy("name_asc"); }}
        filters={
          <>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9"><div className="flex items-center gap-1.5"><ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" /><SelectValue placeholder="Ordenar por" /></div></SelectTrigger>
               <SelectContent>
                <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                <SelectItem value="newest">Cadastro (Recente)</SelectItem>
                <SelectItem value="oldest">Cadastro (Antigo)</SelectItem>
                <SelectItem value="age_asc">Idade (Menor → Maior)</SelectItem>
                <SelectItem value="age_desc">Idade (Maior → Menor)</SelectItem>
                <SelectItem value="last_appointment_recent">Último Atend. (Recente)</SelectItem>
                <SelectItem value="last_appointment_oldest">Último Atend. (Antigo)</SelectItem>
                <SelectItem value="no_activity">Mais Tempo Sem Atividade</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active"><span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-green-600" /> Ativos</span></SelectItem>
                <SelectItem value="inactive"><span className="flex items-center gap-1.5"><UserX className="h-3.5 w-3.5 text-orange-500" /> Inativos</span></SelectItem>
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                <SelectItem value="madre">MADRE</SelectItem>
                <SelectItem value="floresta">Floresta</SelectItem>
                <SelectItem value="atendimento_floresta">Atend. Floresta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Idade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Idades</SelectItem>
                <SelectItem value="minor">Menores</SelectItem>
                <SelectItem value="adult">Adultos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={laudoFilter} onValueChange={setLaudoFilter}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Laudo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos (Laudo)</SelectItem>
                <SelectItem value="with_laudo"><span className="flex items-center gap-1.5"><FileCheck className="h-3.5 w-3.5 text-green-600" /> Com Laudo</span></SelectItem>
                <SelectItem value="without_laudo"><span className="flex items-center gap-1.5"><FileX className="h-3.5 w-3.5 text-orange-500" /> Sem Laudo</span></SelectItem>
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Gênero" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Gêneros</SelectItem>
                <SelectItem value="male"><span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Masculino</span></SelectItem>
                <SelectItem value="female"><span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Feminino</span></SelectItem>
              </SelectContent>
            </Select>
            {isCoordinatorOrDirector() && (
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Profissional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Profissionais</SelectItem>
                  {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 gap-2">
              <Download className="h-4 w-4" /> Exportar Excel
            </Button>
          </>
        }
      />

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: isCoordinatorOrDirector() ? "1fr 1fr" : "1fr" }}>
          <TabsTrigger value="list">Lista de Pacientes</TabsTrigger>
          {isCoordinatorOrDirector() && <TabsTrigger value="assignments">Gerenciar Vinculações</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
                  <CardTitle className="text-xl">Lista de Pacientes</CardTitle>
                  <Badge variant="secondary" className="ml-2">{filteredClients.length}</Badge>
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("cards")} className="h-8 px-3 gap-1.5">
                    <LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline">Cards</span>
                  </Button>
                  <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-8 px-3 gap-1.5">
                    <List className="h-4 w-4" /><span className="hidden sm:inline">Lista</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Batch actions */}
              {isCoordinatorOrDirector() && filteredClients.length > 0 && (
                <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedClients.length === filteredClients.length && filteredClients.length > 0} onCheckedChange={toggleSelectAll} id="select-all" />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      {selectedClients.length > 0 ? `${selectedClients.length} paciente(s) selecionado(s)` : 'Selecionar todos'}
                    </label>
                  </div>
                  {selectedClients.length > 0 && (
                    <Button onClick={() => { if (selectedClients.length === 0) { toast({ variant: "destructive", title: "Nenhum paciente selecionado" }); return; } setIsMultiReportOpen(true); }} variant="default" size="sm" className="gap-2">
                      <FileText className="h-4 w-4" /> Gerar Relatório PDF ({selectedClients.length})
                    </Button>
                  )}
                </div>
              )}

              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Carregando pacientes...</p>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted/80 mb-4">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80">{searchTerm ? "Nenhum paciente encontrado com o termo de busca." : "Nenhum paciente cadastrado."}</p>
                </div>
              ) : viewMode === "cards" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredClients.map((client) => (
                    <PatientCard
                      key={client.id} client={client}
                      isSelected={selectedClients.includes(client.id)}
                      showCheckbox={isCoordinatorOrDirector()} showActions={true}
                      lastAppointment={lastAppointments.get(client.id)}
                      firstAppointment={firstAppointments.get(client.id)}
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
                <ClientsTable
                  clients={filteredClients}
                  selectedClients={selectedClients}
                  lastAppointments={lastAppointments}
                  isAdmin={isCoordinatorOrDirector()}
                  canDelete={canDeleteClients()}
                  onToggleSelect={toggleClientSelection}
                  onToggleSelectAll={toggleSelectAll}
                  onView={handleSelectClient}
                  onEdit={openEditDialog}
                  onReport={(c) => setReportClient(c)}
                  onToggleStatus={handleToggleClientStatus}
                  onDelete={(c) => setDeleteConfirmClient(c)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isCoordinatorOrDirector() && (
          <TabsContent value="assignments"><ClientAssignmentManager /></TabsContent>
        )}
      </Tabs>

      <BulkImportClientsDialog isOpen={isBulkImportOpen} onClose={() => setIsBulkImportOpen(false)} onImportComplete={refreshClients} />
      <AutoImportClientsDialog isOpen={isAutoImportOpen} onClose={() => setIsAutoImportOpen(false)} onImportComplete={refreshClients} />
      {reportClient && <PatientReportGenerator client={reportClient} isOpen={!!reportClient} onClose={() => setReportClient(null)} />}
      <MultiPatientReportGenerator clients={filteredClients.filter(c => selectedClients.includes(c.id))} isOpen={isMultiReportOpen} onClose={() => { setIsMultiReportOpen(false); setSelectedClients([]); }} />
      <PatientQuickViewModal clientId={quickViewClientId} open={!!quickViewClientId} onOpenChange={(open) => { if (!open) setQuickViewClientId(null); }} onViewFullProfile={handleViewFullProfile} />
      <DeleteClientDialog clientName={deleteConfirmClient?.name || null} isOpen={!!deleteConfirmClient} isDeleting={isDeleting} onClose={() => setDeleteConfirmClient(null)} onConfirm={handleDeleteClient} />
    </div>
  );
}
