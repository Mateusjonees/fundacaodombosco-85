import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeManager } from '@/components/EmployeeManager';
import { PermissionManager } from '@/components/PermissionManager';
import { usePermissions } from '@/hooks/usePermissions';
import { Users, Shield, Settings } from 'lucide-react';

export default function Employees() {
  const { hasPermission, loading } = usePermissions();
  const canManagePermissions = hasPermission('manage_permissions');
  const canViewEmployees = hasPermission('view_employees');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando permissões...</p>
      </div>
    );
  }

  if (!canViewEmployees) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">Acesso Negado</h3>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para visualizar funcionários.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Funcionários</h1>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className={`grid w-full ${canManagePermissions ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Funcionários
            </TabsTrigger>
            {canManagePermissions && (
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissões
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="employees" className="mt-6">
            <EmployeeManager />
          </TabsContent>
          
          {canManagePermissions && (
            <TabsContent value="permissions" className="mt-6">
              <PermissionManager />
            </TabsContent>
          )}
        </Tabs>

        {!canManagePermissions && (
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <Settings className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Recursos de administração disponíveis apenas para diretores.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}