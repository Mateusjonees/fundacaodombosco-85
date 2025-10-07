import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export type PermissionAction = 
  // Permissões de leitura
  | 'view_dashboard'
  | 'view_clients'
  | 'view_schedules'
  | 'view_financial'
  | 'view_reports'
  | 'view_stock'
  | 'view_employees'
  | 'view_medical_records'
  | 'view_contracts'
  | 'view_messages'
  | 'view_files'
  | 'view_quality_control'
  | 'view_timesheet'
  | 'view_meeting_alerts'
  // Permissões de criação
  | 'create_clients'
  | 'create_schedules'
  | 'create_financial_records'
  | 'create_stock_items'
  | 'create_employees'
  | 'create_medical_records'
  | 'create_contracts'
  | 'create_messages'
  | 'create_files'
  | 'create_quality_evaluations'
  | 'create_meeting_alerts'
  // Permissões de edição
  | 'edit_clients'
  | 'edit_schedules'
  | 'edit_financial_records'
  | 'edit_stock_items'
  | 'edit_employees'
  | 'edit_medical_records'
  | 'edit_contracts'
  | 'edit_files'
  | 'edit_system_settings'
  | 'edit_user_permissions'
  // Permissões de exclusão
  | 'delete_clients'
  | 'delete_schedules'
  | 'delete_financial_records'
  | 'delete_stock_items'
  | 'delete_employees'
  | 'delete_medical_records'
  | 'delete_contracts'
  | 'delete_files'
  // Permissões administrativas
  | 'manage_users'
  | 'manage_roles'
  | 'change_user_passwords'
  | 'view_audit_logs'
  | 'manage_system_settings'
  | 'export_data'
  | 'import_data'
  | 'view_sensitive_data'
  // Permissões especiais
  | 'confirm_appointments'
  | 'cancel_appointments'
  | 'approve_timesheet'
  | 'assign_clients'
  | 'generate_reports'
  | 'access_all_units';

interface UserPermission {
  permission: PermissionAction;
  granted: boolean;
  source: string;
}

export const useCustomPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserPermissions();
    }
  }, [user]);

  const loadUserPermissions = async () => {
    if (!user) return;

    console.log('🔄 Carregando permissões para usuário:', user.id);

    try {
      const { data, error } = await supabase
        .rpc('get_user_permissions', { user_uuid: user.id });

      if (error) {
        console.error('❌ Erro ao carregar permissões:', error);
        throw error;
      }
      
      console.log('📦 Dados brutos de permissões:', data);
      
      // Mapear dados para a interface correta
      const mappedPermissions: UserPermission[] = (data || []).map((item: any) => ({
        permission: item.permission,
        granted: item.granted ?? true,
        source: item.source ?? 'system'
      }));
      
      console.log('✅ Permissões mapeadas:', mappedPermissions);
      console.log('📊 Total de permissões ativas:', mappedPermissions.filter(p => p.granted).length);
      
      setPermissions(mappedPermissions);
    } catch (error) {
      console.error('❌ Erro ao carregar permissões do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: PermissionAction): boolean => {
    const userPermission = permissions.find(p => p.permission === permission);
    const hasIt = userPermission?.granted === true;
    console.log(`🔍 Verificando permissão "${permission}":`, hasIt ? '✅ TEM' : '❌ NÃO TEM', '| Total de permissões:', permissions.length);
    return hasIt;
  };

  const hasAnyPermission = (permissionList: PermissionAction[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissionList: PermissionAction[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  const getPermissionSource = (permission: PermissionAction): string | null => {
    const userPermission = permissions.find(p => p.permission === permission);
    return userPermission?.source || null;
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionSource,
    refreshPermissions: loadUserPermissions
  };
};

export const PERMISSION_LABELS: Record<PermissionAction, string> = {
  // Painel
  view_dashboard: 'Visualizar Painel',
  
  // Pacientes
  view_clients: 'Visualizar Pacientes',
  create_clients: 'Cadastrar Novos Pacientes',
  edit_clients: 'Editar Dados de Pacientes',
  delete_clients: 'Excluir Pacientes',
  assign_clients: 'Atribuir Pacientes a Profissionais',
  view_medical_records: 'Visualizar Prontuários',
  create_medical_records: 'Criar Prontuários',
  edit_medical_records: 'Editar Prontuários',
  delete_medical_records: 'Excluir Prontuários',

  // Agenda
  view_schedules: 'Visualizar Agenda',
  create_schedules: 'Criar Agendamentos',
  edit_schedules: 'Editar Agendamentos',
  delete_schedules: 'Excluir Agendamentos',
  confirm_appointments: 'Confirmar Atendimentos',
  cancel_appointments: 'Cancelar Atendimentos',

  // Financeiro
  view_financial: 'Visualizar Registros Financeiros',
  create_financial_records: 'Criar Lançamentos Financeiros',
  edit_financial_records: 'Editar Lançamentos Financeiros',
  delete_financial_records: 'Excluir Lançamentos Financeiros',

  // Contratos
  view_contracts: 'Visualizar Contratos',
  create_contracts: 'Criar Novos Contratos',
  edit_contracts: 'Editar Contratos',
  delete_contracts: 'Excluir Contratos',

  // Estoque
  view_stock: 'Visualizar Estoque',
  create_stock_items: 'Adicionar Itens ao Estoque',
  edit_stock_items: 'Editar Itens do Estoque',
  delete_stock_items: 'Excluir Itens do Estoque',

  // Relatórios
  view_reports: 'Visualizar Relatórios',
  generate_reports: 'Gerar Novos Relatórios',
  export_data: 'Exportar Dados',

  // Funcionários
  view_employees: 'Visualizar Funcionários',
  create_employees: 'Cadastrar Funcionários',
  edit_employees: 'Editar Dados de Funcionários',
  delete_employees: 'Excluir Funcionários',

  // Usuários e Permissões
  manage_users: 'Gerenciar Usuários do Sistema',
  manage_roles: 'Gerenciar Cargos e Funções',
  change_user_passwords: 'Alterar Senhas de Usuários',
  edit_user_permissions: 'Editar Permissões de Usuários',
  view_audit_logs: 'Visualizar Logs de Auditoria',

  // Mensagens
  view_messages: 'Visualizar Mensagens',
  create_messages: 'Enviar Mensagens',

  // Arquivos
  view_files: 'Visualizar Arquivos',
  create_files: 'Fazer Upload de Arquivos',
  edit_files: 'Editar Arquivos',
  delete_files: 'Excluir Arquivos',

  // Controle de Qualidade
  view_quality_control: 'Visualizar Controle de Qualidade',
  create_quality_evaluations: 'Criar Avaliações de Qualidade',

  // Ponto Eletrônico
  view_timesheet: 'Visualizar Ponto Eletrônico',
  approve_timesheet: 'Aprovar Registros de Ponto',

  // Alertas de Reunião
  view_meeting_alerts: 'Visualizar Alertas de Reunião',
  create_meeting_alerts: 'Criar Alertas de Reunião',

  // Configurações do Sistema
  manage_system_settings: 'Gerenciar Configurações Gerais',
  edit_system_settings: 'Editar Configurações do Sistema',
  import_data: 'Importar Dados',
  view_sensitive_data: 'Visualizar Dados Sensíveis',
  access_all_units: 'Acesso a Todas as Unidades'
};

export const PERMISSION_CATEGORIES = {
  dashboard: {
    label: 'Painel',
    icon: 'Home',
    permissions: [
      'view_dashboard'
    ] as PermissionAction[]
  },
  clients: {
    label: 'Pacientes',
    icon: 'Users',
    permissions: [
      'view_clients',
      'create_clients',
      'edit_clients',
      'delete_clients',
      'assign_clients',
      'view_medical_records',
      'create_medical_records',
      'edit_medical_records',
      'delete_medical_records'
    ] as PermissionAction[]
  },
  schedules: {
    label: 'Agenda',
    icon: 'Calendar',
    permissions: [
      'view_schedules',
      'create_schedules',
      'edit_schedules',
      'delete_schedules',
      'confirm_appointments',
      'cancel_appointments'
    ] as PermissionAction[]
  },
  financial: {
    label: 'Financeiro',
    icon: 'DollarSign',
    permissions: [
      'view_financial',
      'create_financial_records',
      'edit_financial_records',
      'delete_financial_records'
    ] as PermissionAction[]
  },
  contracts: {
    label: 'Contratos',
    icon: 'FolderOpen',
    permissions: [
      'view_contracts',
      'create_contracts',
      'edit_contracts',
      'delete_contracts'
    ] as PermissionAction[]
  },
  stock: {
    label: 'Estoque',
    icon: 'Package',
    permissions: [
      'view_stock',
      'create_stock_items',
      'edit_stock_items',
      'delete_stock_items'
    ] as PermissionAction[]
  },
  reports: {
    label: 'Relatórios',
    icon: 'BarChart3',
    permissions: [
      'view_reports',
      'generate_reports',
      'export_data'
    ] as PermissionAction[]
  },
  employees: {
    label: 'Funcionários',
    icon: 'UserPlus',
    permissions: [
      'view_employees',
      'create_employees',
      'edit_employees',
      'delete_employees'
    ] as PermissionAction[]
  },
  users: {
    label: 'Usuários e Permissões',
    icon: 'Shield',
    permissions: [
      'manage_users',
      'manage_roles',
      'change_user_passwords',
      'edit_user_permissions',
      'view_audit_logs'
    ] as PermissionAction[]
  },
  messages: {
    label: 'Mensagens',
    icon: 'MessageSquare',
    permissions: [
      'view_messages',
      'create_messages'
    ] as PermissionAction[]
  },
  files: {
    label: 'Arquivos',
    icon: 'FolderOpen',
    permissions: [
      'view_files',
      'create_files',
      'edit_files',
      'delete_files'
    ] as PermissionAction[]
  },
  quality: {
    label: 'Controle de Qualidade',
    icon: 'CheckSquare',
    permissions: [
      'view_quality_control',
      'create_quality_evaluations'
    ] as PermissionAction[]
  },
  timesheet: {
    label: 'Ponto Eletrônico',
    icon: 'Clock',
    permissions: [
      'view_timesheet',
      'approve_timesheet'
    ] as PermissionAction[]
  },
  meetings: {
    label: 'Alertas de Reunião',
    icon: 'Bell',
    permissions: [
      'view_meeting_alerts',
      'create_meeting_alerts'
    ] as PermissionAction[]
  },
  system: {
    label: 'Configurações do Sistema',
    icon: 'Settings',
    permissions: [
      'manage_system_settings',
      'edit_system_settings',
      'import_data',
      'view_sensitive_data',
      'access_all_units'
    ] as PermissionAction[]
  }
};