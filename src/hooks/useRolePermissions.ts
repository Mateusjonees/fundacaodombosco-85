import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export type EmployeeRole = 
  | 'director'
  | 'coordinator_madre'
  | 'coordinator_floresta'
  | 'staff'
  | 'receptionist'
  | 'psychologist'
  | 'psychopedagogue'
  | 'musictherapist'
  | 'speech_therapist'
  | 'nutritionist'
  | 'physiotherapist'
  | 'financeiro'
  | 'intern'
  | 'terapeuta_ocupacional'
  | 'advogada';

// Grupos de permissões definidos
export const ROLE_GROUPS = {
  DIRECTOR_ONLY: ['director'] as EmployeeRole[],
  FINANCE_ONLY: ['financeiro'] as EmployeeRole[],
  DIRECTOR_OR_FINANCE: ['director', 'financeiro'] as EmployeeRole[],
  STOCK_MANAGERS: ['director', 'financeiro', 'coordinator_madre', 'coordinator_floresta'] as EmployeeRole[],
  COORDINATOR_AND_HIGHER: ['director', 'coordinator_madre', 'coordinator_floresta'] as EmployeeRole[],
  NON_FINANCE_ACCESS: ['director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern', 'terapeuta_ocupacional', 'advogada', 'musictherapist', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'] as EmployeeRole[],
  PROFESSIONAL_ROLES: ['staff', 'intern', 'terapeuta_ocupacional', 'advogada', 'musictherapist', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'] as EmployeeRole[],
  ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES: ['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'] as EmployeeRole[]
};

// Labels para exibição dos cargos
export const ROLE_LABELS: Record<EmployeeRole, string> = {
  director: 'Diretoria',
  coordinator_madre: 'Coordenador(a) Madre',
  coordinator_floresta: 'Coordenador(a) Floresta',
  staff: 'Funcionário(a) Geral',
  receptionist: 'Recepcionista',
  psychologist: 'Psicólogo(a)',
  psychopedagogue: 'Psicopedagogo(a)',
  musictherapist: 'Musicoterapeuta',
  speech_therapist: 'Fonoaudiólogo(a)',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta',
  financeiro: 'Financeiro',
  intern: 'Estagiário(a)',
  terapeuta_ocupacional: 'Terapeuta Ocupacional',
  advogada: 'Advogada'
};

export const useRolePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<EmployeeRole | null>(null);
  const [userUnit, setUserUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setUserUnit(null);
        setLoading(false);
        return;
      }

      try {
        // Usar .maybeSingle() ao invés de .single() para evitar erros
        const { data, error } = await supabase
          .from('profiles')
          .select('employee_role, unit, is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar role do usuário:', error);
          setUserRole(null);
          setUserUnit(null);
        } else if (data && data.is_active) {
          setUserRole(data.employee_role);
          setUserUnit(data.unit);
        } else {
          console.log('Usuário não tem perfil ativo:', data);
          setUserRole(null);
          setUserUnit(null);
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar role:', error);
        setUserRole(null);
        setUserUnit(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Função para verificar se usuário tem um dos roles permitidos
  const hasAnyRole = (allowedRoles: EmployeeRole[]): boolean => {
    return userRole ? allowedRoles.includes(userRole) : false;
  };

  // Função para verificar se usuário tem role específico
  const hasRole = (role: EmployeeRole): boolean => {
    return userRole === role;
  };

  // DIRECTOR HAS GOD-MODE - ALWAYS RETURNS TRUE FOR EVERYTHING
  const isGodMode = (): boolean => {
    return hasRole('director');
  };

  // Verificações específicas baseadas nos grupos - DIRECTOR SEMPRE TEM ACESSO
  const canViewAllClients = (): boolean => {
    return isGodMode() || hasAnyRole(ROLE_GROUPS.ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES);
  };

  const canAccessFinancial = (): boolean => {
    return isGodMode() || hasAnyRole(ROLE_GROUPS.DIRECTOR_OR_FINANCE);
  };

  const canManageStock = (): boolean => {
    return isGodMode() || hasAnyRole(ROLE_GROUPS.STOCK_MANAGERS);
  };

  const canViewAllSchedules = (): boolean => {
    return isGodMode() || hasAnyRole(ROLE_GROUPS.ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES);
  };

  const canManageAllSchedules = (): boolean => {
    return isGodMode() || hasAnyRole(ROLE_GROUPS.COORDINATOR_AND_HIGHER); // Diretores e coordenadores podem gerenciar todos os agendamentos
  };

  const canManageEmployees = (): boolean => {
    return isGodMode() || hasAnyRole(ROLE_GROUPS.COORDINATOR_AND_HIGHER); // Diretores e coordenadores
  };

  const canManageUsers = (): boolean => {
    return isGodMode(); // Apenas diretores para usuários
  };

  const canViewReports = (): boolean => {
    // Se ainda está carregando, permita acesso
    if (loading) return true;
    
    // Se é diretor, sempre pode ver relatórios
    if (isGodMode()) return true;
    
    // Se é coordenador, sempre pode ver relatórios
    if (hasAnyRole(['coordinator_madre', 'coordinator_floresta'])) return true;
    
    // Para outros roles, verificar a lista
    return hasAnyRole([
      'director',
      'coordinator_madre', 
      'coordinator_floresta',
      'financeiro',
      'psychologist',
      'psychopedagogue',
      'speech_therapist',
      'nutritionist',
      'physiotherapist',
      'musictherapist',
      'staff',
      'receptionist'
    ]);
  };

  const canConfigureReports = (): boolean => {
    return isGodMode() || hasAnyRole(['coordinator_madre', 'coordinator_floresta']);
  };

  const canExportData = (): boolean => {
    return isGodMode();
  };

  const isProfessional = (): boolean => {
    return isGodMode() || hasAnyRole(ROLE_GROUPS.PROFESSIONAL_ROLES);
  };

  const isDirector = (): boolean => {
    return hasRole('director');
  };

  const isCoordinator = (): boolean => {
    return hasAnyRole(['coordinator_madre', 'coordinator_floresta']);
  };

  // Verificação para aba "Meus Pacientes"
  const canViewMyPatients = (): boolean => {
    return isGodMode() || hasAnyRole([...ROLE_GROUPS.PROFESSIONAL_ROLES, 'director']);
  };

  // Verificação para cadastro de clientes
  const canCreateClients = (): boolean => {
    return isGodMode() || hasAnyRole(['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist', 'staff']);
  };

  // NOVAS PERMISSÕES TOTAIS PARA DIRETOR
  const canDeleteClients = (): boolean => {
    return isGodMode();
  };

  const canEditClients = (): boolean => {
    return isGodMode() || hasAnyRole(['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist']);
  };

  const canDeleteEmployees = (): boolean => {
    return isGodMode();
  };

  const canEditEmployees = (): boolean => {
    return isGodMode() || hasAnyRole(ROLE_GROUPS.COORDINATOR_AND_HIGHER);
  };

  const canViewAuditLogs = (): boolean => {
    return isGodMode();
  };

  const canManageSystemSettings = (): boolean => {
    return isGodMode();
  };

  const canAccessAllData = (): boolean => {
    return isGodMode();
  };

  const canManagePermissions = (): boolean => {
    return isGodMode();
  };

  const canViewSensitiveData = (): boolean => {
    return isGodMode();
  };

  const canDeleteAnyRecord = (): boolean => {
    return isGodMode();
  };

  const canEditAnyRecord = (): boolean => {
    return isGodMode();
  };

  const canCreateAnyRecord = (): boolean => {
    return isGodMode();
  };

  const canViewAnyRecord = (): boolean => {
    return isGodMode();
  };

  const canManageFinancialRecords = (): boolean => {
    return isGodMode() || hasRole('financeiro');
  };

  const canDeleteFinancialRecords = (): boolean => {
    return isGodMode();
  };

  const canViewAllMedicalRecords = (): boolean => {
    return isGodMode();
  };

  const canEditAllMedicalRecords = (): boolean => {
    return isGodMode();
  };

  const canManageAllAssignments = (): boolean => {
    return isGodMode();
  };

  const canViewAllMessages = (): boolean => {
    return isGodMode();
  };

  const canDeleteAllMessages = (): boolean => {
    return isGodMode();
  };

  const canManageAllNotifications = (): boolean => {
    return isGodMode();
  };

  const canAccessAllReports = (): boolean => {
    return isGodMode();
  };

  const canBypassAllRestrictions = (): boolean => {
    return isGodMode();
  };

  return {
    userRole,
    userUnit,
    loading,
    hasRole,
    hasAnyRole,
    isGodMode,
    canViewAllClients,
    canAccessFinancial,
    canManageStock,
    canViewAllSchedules,
    canManageEmployees,
    canViewReports,
    canConfigureReports,
    canExportData,
    isProfessional,
    isDirector,
    isCoordinator,
    canViewMyPatients,
    canCreateClients,
    canDeleteClients,
    canEditClients,
    canDeleteEmployees,
    canEditEmployees,
    canViewAuditLogs,
    canManageSystemSettings,
    canAccessAllData,
    canManagePermissions,
    canViewSensitiveData,
    canDeleteAnyRecord,
    canEditAnyRecord,
    canCreateAnyRecord,
    canViewAnyRecord,
    canManageFinancialRecords,
    canDeleteFinancialRecords,
    canViewAllMedicalRecords,
    canEditAllMedicalRecords,
    canManageAllAssignments,
    canViewAllMessages,
    canDeleteAllMessages,
    canManageAllNotifications,
    canAccessAllReports,
    canBypassAllRestrictions,
    canManageUsers,
    canManageAllSchedules,
  };
};