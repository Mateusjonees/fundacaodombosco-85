import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { Shield } from 'lucide-react';

interface Permission {
  id: string;
  permission_key: string;
  permission_value: string;
}

interface EmployeePermissionsProps {
  employeeId: string;
  employeeName: string;
}

const PERMISSION_OPTIONS = [
  { key: 'cadastrar_cliente', label: 'Cadastrar Paciente' },
  { key: 'agenda_dia', label: 'Agenda do Dia' },
  { key: 'todos_pacientes', label: 'Todos os Pacientes' },
  { key: 'meus_pacientes', label: 'Meus Pacientes' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'estoque', label: 'Estoque' },
  { key: 'funcionarios', label: 'Funcionários' },
  { key: 'mural_coordenador', label: 'Mural do Coordenador' },
];

const ACCESS_LEVELS = [
  { value: 'none', label: 'Sem Acesso' },
  { value: 'view', label: 'Visualizar' },
  { value: 'edit', label: 'Editar' },
  { value: 'full', label: 'Acesso Completo' },
];

export default function EmployeePermissions({ employeeId, employeeName }: EmployeePermissionsProps) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDirector, setIsDirector] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
    loadPermissions();
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

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', employeeId);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as permissões.",
      });
    }
  };

  const updatePermission = async (permissionKey: string, value: string) => {
    if (!isDirector) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas diretores podem alterar permissões."
      });
      return;
    }

    setLoading(true);
    try {
      // Primeiro obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Erro ao obter dados do usuário: ' + userError.message);
      }

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Depois fazer o upsert
      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: employeeId,
          permission_key: permissionKey,
          permission_value: value,
          granted_by: user.id,
        });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Erro do banco de dados: ' + error.message);
      }

      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso!",
      });

      loadPermissions();
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

  const getPermissionValue = (key: string) => {
    const permission = permissions.find(p => p.permission_key === key);
    return permission?.permission_value || 'none';
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
        <CardTitle>Permissões - {employeeName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERMISSION_OPTIONS.map((option) => (
            <div key={option.key} className="space-y-2">
              <Label htmlFor={option.key}>{option.label}</Label>
              <Select
                value={getPermissionValue(option.key)}
                onValueChange={(value) => updatePermission(option.key, value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}