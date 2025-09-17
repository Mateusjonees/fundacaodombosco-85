import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPermissions();
  }, [employeeId]);

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
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: employeeId,
          permission_key: permissionKey,
          permission_value: value,
          granted_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso!",
      });

      loadPermissions();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a permissão.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermissionValue = (key: string) => {
    const permission = permissions.find(p => p.permission_key === key);
    return permission?.permission_value || 'none';
  };

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