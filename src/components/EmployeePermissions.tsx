import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Database } from '@/integrations/supabase/types';

type PermissionAction = Database['public']['Enums']['permission_action'];

interface EmployeePermissionsProps {
  employeeId: string;
  employeeName: string;
}

const PERMISSION_CATEGORIES = {
  viewing: {
    label: 'Visualização',
    permissions: [
      { key: 'view_dashboard', label: 'Ver Painel' },
      { key: 'view_clients', label: 'Ver Clientes' },
      { key: 'view_schedules', label: 'Ver Agendamentos' },
      { key: 'view_financial', label: 'Ver Financeiro' },
      { key: 'view_reports', label: 'Ver Relatórios' },
      { key: 'view_stock', label: 'Ver Estoque' },
      { key: 'view_employees', label: 'Ver Funcionários' },
      { key: 'view_medical_records', label: 'Ver Prontuários' },
      { key: 'view_contracts', label: 'Ver Contratos' },
      { key: 'view_messages', label: 'Ver Mensagens' },
      { key: 'view_files', label: 'Ver Arquivos' },
      { key: 'view_quality_control', label: 'Ver Controle de Qualidade' },
      { key: 'view_timesheet', label: 'Ver Ponto Eletrônico' },
      { key: 'view_meeting_alerts', label: 'Ver Alertas de Reunião' }
    ]
  },
  creating: {
    label: 'Criação',
    permissions: [
      { key: 'create_clients', label: 'Criar Clientes' },
      { key: 'create_schedules', label: 'Criar Agendamentos' },
      { key: 'create_financial_records', label: 'Criar Registros Financeiros' },
      { key: 'create_stock_items', label: 'Criar Itens de Estoque' },
      { key: 'create_employees', label: 'Criar Funcionários' },
      { key: 'create_medical_records', label: 'Criar Prontuários' },
      { key: 'create_contracts', label: 'Criar Contratos' },
      { key: 'create_messages', label: 'Criar Mensagens' },
      { key: 'create_files', label: 'Criar Arquivos' },
      { key: 'create_quality_evaluations', label: 'Criar Avaliações de Qualidade' },
      { key: 'create_meeting_alerts', label: 'Criar Alertas de Reunião' }
    ]
  },
  editing: {
    label: 'Edição',
    permissions: [
      { key: 'edit_clients', label: 'Editar Clientes' },
      { key: 'edit_schedules', label: 'Editar Agendamentos' },
      { key: 'edit_financial_records', label: 'Editar Registros Financeiros' },
      { key: 'edit_stock_items', label: 'Editar Itens de Estoque' },
      { key: 'edit_employees', label: 'Editar Funcionários' },
      { key: 'edit_medical_records', label: 'Editar Prontuários' },
      { key: 'edit_contracts', label: 'Editar Contratos' },
      { key: 'edit_files', label: 'Editar Arquivos' },
      { key: 'edit_system_settings', label: 'Editar Configurações do Sistema' },
      { key: 'edit_user_permissions', label: 'Editar Permissões de Usuários' }
    ]
  },
  deleting: {
    label: 'Exclusão',
    permissions: [
      { key: 'delete_clients', label: 'Excluir Clientes' },
      { key: 'delete_schedules', label: 'Excluir Agendamentos' },
      { key: 'delete_financial_records', label: 'Excluir Registros Financeiros' },
      { key: 'delete_stock_items', label: 'Excluir Itens de Estoque' },
      { key: 'delete_employees', label: 'Excluir Funcionários' },
      { key: 'delete_medical_records', label: 'Excluir Prontuários' },
      { key: 'delete_contracts', label: 'Excluir Contratos' },
      { key: 'delete_files', label: 'Excluir Arquivos' }
    ]
  },
  administrative: {
    label: 'Administrativo',
    permissions: [
      { key: 'manage_users', label: 'Gerenciar Usuários' },
      { key: 'manage_roles', label: 'Gerenciar Cargos' },
      { key: 'change_user_passwords', label: 'Alterar Senhas de Usuários' },
      { key: 'view_audit_logs', label: 'Ver Logs de Auditoria' },
      { key: 'manage_system_settings', label: 'Gerenciar Configurações' },
      { key: 'export_data', label: 'Exportar Dados' },
      { key: 'import_data', label: 'Importar Dados' },
      { key: 'view_sensitive_data', label: 'Ver Dados Sensíveis' }
    ]
  },
  special: {
    label: 'Especiais',
    permissions: [
      { key: 'confirm_appointments', label: 'Confirmar Atendimentos' },
      { key: 'cancel_appointments', label: 'Cancelar Atendimentos' },
      { key: 'approve_timesheet', label: 'Aprovar Ponto' },
      { key: 'assign_clients', label: 'Atribuir Clientes' },
      { key: 'generate_reports', label: 'Gerar Relatórios' },  
      { key: 'access_all_units', label: 'Acesso a Todas as Unidades' }
    ]
  }
};

export default function EmployeePermissions({ employeeId, employeeName }: EmployeePermissionsProps) {
  const { user } = useAuth();
  const [grantedPermissions, setGrantedPermissions] = useState<Set<string>>(new Set());
  const [blockedPermissions, setBlockedPermissions] = useState<Set<string>>(new Set());
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [employeeRole, setEmployeeRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isDirector, setIsDirector] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
    loadEmployeeRoleAndPermissions();
  }, [employeeId, user]);

  const checkUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setIsDirector(data.employee_role === 'director');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadEmployeeRoleAndPermissions = async () => {
    setLoading(true);
    try {
      // Buscar o cargo do funcionário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', employeeId)
        .single();

      if (profileError) throw profileError;
      
      const role = profileData?.employee_role;
      setEmployeeRole(role || '');
      console.log('🔍 Cargo do funcionário:', role);

      // Buscar permissões do cargo
      if (role) {
        const { data: rolePerms, error: rolePermsError } = await supabase
          .from('role_permissions')
          .select('permission, granted')
          .eq('employee_role', role)
          .eq('granted', true);

        console.log('📋 Permissões do cargo encontradas:', rolePerms);
        
        if (rolePermsError) {
          console.error('❌ Erro ao buscar permissões do cargo:', rolePermsError);
          throw rolePermsError;
        }
        
        const rolePermSet = new Set(rolePerms?.map(p => p.permission) || []);
        console.log('✅ Set de permissões do cargo:', Array.from(rolePermSet));
        setRolePermissions(rolePermSet);
      }

      // Buscar TODAS as permissões personalizadas específicas do usuário (inclusive as negativas)
      const { data: userPerms, error: userPermsError } = await supabase
        .from('user_specific_permissions')
        .select('permission, granted')
        .eq('user_id', employeeId);

      console.log('👤 Permissões personalizadas:', userPerms);
      
      if (userPermsError) throw userPermsError;
      
      // Criar dois conjuntos: permissões concedidas e permissões bloqueadas
      const customGranted = new Set<string>();
      const customBlocked = new Set<string>();
      
      userPerms?.forEach(p => {
        if (p.granted) {
          customGranted.add(p.permission);
        } else {
          customBlocked.add(p.permission);
        }
      });
      
      console.log('✅ Permissões personalizadas concedidas:', Array.from(customGranted));
      console.log('❌ Permissões bloqueadas:', Array.from(customBlocked));
      
      setGrantedPermissions(customGranted);
      setBlockedPermissions(customBlocked);
      
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as permissões.",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (permissionKey: string, granted: boolean) => {
    if (!isDirector) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas diretores podem alterar permissões."
      });
      return;
    }

    const hasRolePermission = rolePermissions.has(permissionKey);
    
    setLoading(true);
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Se está ativando e já tem pelo cargo, não precisa fazer nada
      if (granted && hasRolePermission) {
        // Remove override se existir (volta ao padrão do cargo)
        await supabase
          .from('user_specific_permissions')
          .delete()
          .eq('user_id', employeeId)
          .eq('permission', permissionKey as PermissionAction);
        
        setGrantedPermissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(permissionKey);
          return newSet;
        });
        
        toast({
          title: "Permissão do cargo",
          description: "Esta permissão já está incluída no cargo.",
        });
        return;
      }

      // Criar ou atualizar permissão específica
      const { error } = await supabase
        .from('user_specific_permissions')
        .upsert({
          user_id: employeeId,
          permission: permissionKey as PermissionAction,
          granted: granted,
          granted_by: currentUser.id,
        });

      if (error) throw error;
      
      if (granted) {
        setGrantedPermissions(prev => new Set(prev).add(permissionKey));
        setBlockedPermissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(permissionKey);
          return newSet;
        });
      } else {
        // Se desativando uma permissão do cargo, adiciona ao bloqueio
        if (hasRolePermission) {
          setBlockedPermissions(prev => new Set(prev).add(permissionKey));
        }
        setGrantedPermissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(permissionKey);
          return newSet;
        });
      }

      toast({
        title: "Sucesso",
        description: granted 
          ? "Permissão personalizada concedida com sucesso!" 
          : hasRolePermission 
            ? "Permissão do cargo foi bloqueada."
            : "Permissão removida com sucesso!",
      });

    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível atualizar a permissão.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isDirector) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Acesso restrito a diretores</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permissões Personalizadas - {employeeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
          <div key={categoryKey} className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm">
                {category.label}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
              {category.permissions.map((perm) => {
                const hasRolePermission = rolePermissions.has(perm.key);
                const hasCustomPermission = grantedPermissions.has(perm.key);
                const isBlocked = blockedPermissions.has(perm.key);
                const isActive = (hasRolePermission && !isBlocked) || hasCustomPermission;
                
                return (
                  <div 
                    key={perm.key} 
                    className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1">
                      <Label 
                        htmlFor={perm.key} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {perm.label}
                      </Label>
                      {hasRolePermission && !isBlocked && (
                        <div className="text-xs text-primary mt-1 font-medium">
                          ✓ Permissão do Cargo
                        </div>
                      )}
                      {hasCustomPermission && (
                        <div className="text-xs text-green-600 mt-1 font-medium">
                          ✓ Personalizado: Permitido
                        </div>
                      )}
                      {isBlocked && (
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          ✗ Bloqueado (override do cargo)
                        </div>
                      )}
                    </div>
                    <Switch
                      id={perm.key}
                      checked={isActive}
                      onCheckedChange={(checked) => 
                        togglePermission(perm.key, checked)
                      }
                      disabled={loading}
                      className="ml-3"
                    />
                  </div>
                );
              })}
            </div>
            
            <Separator className="my-4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}