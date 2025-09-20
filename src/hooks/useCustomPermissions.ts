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

    try {
      const { data, error } = await supabase
        .rpc('get_user_permissions', { user_uuid: user.id });

      if (error) throw error;
      
      // Mapear dados para a interface correta
      const mappedPermissions: UserPermission[] = (data || []).map((item: any) => ({
        permission: item.permission,
        granted: item.granted ?? true,
        source: item.source ?? 'system'
      }));
      
      setPermissions(mappedPermissions);
    } catch (error) {
      console.error('Error loading user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: PermissionAction): boolean => {
    const userPermission = permissions.find(p => p.permission === permission);
    return userPermission?.granted === true;
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
  // Visualização
  view_dashboard: 'Ver Dashboard',
  view_clients: 'Ver Clientes',
  view_schedules: 'Ver Agendamentos',
  view_financial: 'Ver Financeiro',
  view_reports: 'Ver Relatórios',
  view_stock: 'Ver Estoque',
  view_employees: 'Ver Funcionários',
  view_medical_records: 'Ver Prontuários',
  view_contracts: 'Ver Contratos',
  view_messages: 'Ver Mensagens',
  view_files: 'Ver Arquivos',
  view_quality_control: 'Ver Controle de Qualidade',
  view_timesheet: 'Ver Ponto Eletrônico',
  view_meeting_alerts: 'Ver Alertas de Reunião',

  // Criação
  create_clients: 'Criar Clientes',
  create_schedules: 'Criar Agendamentos',
  create_financial_records: 'Criar Registros Financeiros',
  create_stock_items: 'Criar Itens de Estoque',
  create_employees: 'Criar Funcionários',
  create_medical_records: 'Criar Prontuários',
  create_contracts: 'Criar Contratos',
  create_messages: 'Criar Mensagens',
  create_files: 'Criar Arquivos',
  create_quality_evaluations: 'Criar Avaliações de Qualidade',
  create_meeting_alerts: 'Criar Alertas de Reunião',

  // Edição
  edit_clients: 'Editar Clientes',
  edit_schedules: 'Editar Agendamentos',
  edit_financial_records: 'Editar Registros Financeiros',
  edit_stock_items: 'Editar Itens de Estoque',
  edit_employees: 'Editar Funcionários',
  edit_medical_records: 'Editar Prontuários',
  edit_contracts: 'Editar Contratos',
  edit_files: 'Editar Arquivos',
  edit_system_settings: 'Editar Configurações do Sistema',
  edit_user_permissions: 'Editar Permissões de Usuários',

  // Exclusão
  delete_clients: 'Excluir Clientes',
  delete_schedules: 'Excluir Agendamentos',
  delete_financial_records: 'Excluir Registros Financeiros',
  delete_stock_items: 'Excluir Itens de Estoque',
  delete_employees: 'Excluir Funcionários',
  delete_medical_records: 'Excluir Prontuários',
  delete_contracts: 'Excluir Contratos',
  delete_files: 'Excluir Arquivos',

  // Administrativo
  manage_users: 'Gerenciar Usuários',
  manage_roles: 'Gerenciar Cargos',
  change_user_passwords: 'Alterar Senhas de Usuários',
  view_audit_logs: 'Ver Logs de Auditoria',
  manage_system_settings: 'Gerenciar Configurações',
  export_data: 'Exportar Dados',
  import_data: 'Importar Dados',
  view_sensitive_data: 'Ver Dados Sensíveis',

  // Especiais
  confirm_appointments: 'Confirmar Atendimentos',
  cancel_appointments: 'Cancelar Atendimentos',
  approve_timesheet: 'Aprovar Ponto',
  assign_clients: 'Atribuir Clientes',
  generate_reports: 'Gerar Relatórios',
  access_all_units: 'Acesso a Todas as Unidades'
};

export const PERMISSION_CATEGORIES = {
  viewing: {
    label: 'Visualização',
    permissions: [
      'view_dashboard', 'view_clients', 'view_schedules', 'view_financial',
      'view_reports', 'view_stock', 'view_employees', 'view_medical_records',
      'view_contracts', 'view_messages', 'view_files', 'view_quality_control',
      'view_timesheet', 'view_meeting_alerts'
    ] as PermissionAction[]
  },
  creating: {
    label: 'Criação',
    permissions: [
      'create_clients', 'create_schedules', 'create_financial_records',
      'create_stock_items', 'create_employees', 'create_medical_records',
      'create_contracts', 'create_messages', 'create_files',
      'create_quality_evaluations', 'create_meeting_alerts'
    ] as PermissionAction[]
  },
  editing: {
    label: 'Edição',
    permissions: [
      'edit_clients', 'edit_schedules', 'edit_financial_records',
      'edit_stock_items', 'edit_employees', 'edit_medical_records',
      'edit_contracts', 'edit_files', 'edit_system_settings',
      'edit_user_permissions'
    ] as PermissionAction[]
  },
  deleting: {
    label: 'Exclusão',
    permissions: [
      'delete_clients', 'delete_schedules', 'delete_financial_records',
      'delete_stock_items', 'delete_employees', 'delete_medical_records',
      'delete_contracts', 'delete_files'
    ] as PermissionAction[]
  },
  administrative: {
    label: 'Administrativo',
    permissions: [
      'manage_users', 'manage_roles', 'change_user_passwords',
      'view_audit_logs', 'manage_system_settings', 'export_data',
      'import_data', 'view_sensitive_data'
    ] as PermissionAction[]
  },
  special: {
    label: 'Especiais',
    permissions: [
      'confirm_appointments', 'cancel_appointments', 'approve_timesheet',
      'assign_clients', 'generate_reports', 'access_all_units'
    ] as PermissionAction[]
  }
};