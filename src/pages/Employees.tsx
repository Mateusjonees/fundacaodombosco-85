import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Edit, UserPlus, Users, Clock, Settings, Shield } from 'lucide-react';
import EmployeePermissions from '@/components/EmployeePermissions';
import PasswordManager from '@/components/PasswordManager';
import { CustomRoleManager } from '@/components/CustomRoleManager';

interface Employee {
  id: string;
  user_id: string;
  name: string;
  employee_role: string;
  phone?: string;
  document_cpf?: string;
  is_active: boolean;
  hire_date: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  employee_role: string;
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Diretor(a)',
  coordinator_madre: 'Coordenador(a) Madre',
  coordinator_floresta: 'Coordenador(a) Floresta',
  staff: 'Funcionário(a) Geral',
  intern: 'Estagiário(a)',
  musictherapist: 'Musicoterapeuta',
  receptionist: 'Recepcionista',
  psychologist: 'Psicólogo(a)',
  psychopedagogue: 'Psicopedagogo(a)',
  speech_therapist: 'Fonoaudiólogo(a)',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta'
};

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const { toast } = useToast();

  const isDirector = userProfile?.employee_role === 'director';

  useEffect(() => {
    loadUserProfile();
    loadEmployees();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeEmployees = filteredEmployees.filter(e => e.is_active);
  const inactiveEmployees = filteredEmployees.filter(e => !e.is_active);

  // Group employees by role
  const employeesByRole = filteredEmployees.reduce((acc: any, employee) => {
    const role = employee.employee_role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(employee);
    return acc;
  }, {});

  const openPermissionsDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setPermissionsDialogOpen(true);
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Funcionários</h1>
        {isDirector && (
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Cadastrar Funcionário
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEmployees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{inactiveEmployees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cargos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(employeesByRole).length}</div>
          </CardContent>
        </Card>
      </div>

      {isDirector ? (
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Lista de Funcionários</TabsTrigger>
            <TabsTrigger value="permissions">Gerenciar Permissões</TabsTrigger>
            <TabsTrigger value="roles">Gerenciar Cargos</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Employees by Role */}
              <Card>
                <CardHeader>
                  <CardTitle>Funcionários por Cargo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(employeesByRole).map(([role, roleEmployees]) => (
                      <div key={role} className="flex justify-between items-center">
                        <span className="text-sm">{ROLE_LABELS[role] || role}</span>
                        <Badge variant="outline">{(roleEmployees as Employee[]).length}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Hires */}
              <Card>
                <CardHeader>
                  <CardTitle>Contratações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredEmployees
                      .sort((a, b) => new Date(b.hire_date || 0).getTime() - new Date(a.hire_date || 0).getTime())
                      .slice(0, 5)
                      .map((employee) => (
                        <div key={employee.id} className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {ROLE_LABELS[employee.employee_role] || employee.employee_role}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-BR') : '-'}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active vs Inactive */}
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Funcionários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Funcionários Ativos</span>
                      <Badge variant="default">{activeEmployees.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Funcionários Inativos</span>
                      <Badge variant="secondary">{inactiveEmployees.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Taxa de Atividade</span>
                      <Badge variant="outline">
                        {filteredEmployees.length > 0 
                          ? ((activeEmployees.length / filteredEmployees.length) * 100).toFixed(1) 
                          : 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Employees Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Funcionários</CardTitle>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Carregando funcionários...</p>
                ) : filteredEmployees.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchTerm ? 'Nenhum funcionário encontrado.' : 'Nenhum funcionário cadastrado.'}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ROLE_LABELS[employee.employee_role] || employee.employee_role}
                            </Badge>
                          </TableCell>
                          <TableCell>{employee.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={employee.is_active ? "default" : "secondary"}>
                              {employee.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPermissionsDialog(employee)}
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
                              <PasswordManager 
                                employeeId={employee.user_id}
                                employeeName={employee.name || 'Funcionário'}
                                employeeEmail={employee.phone || 'email@exemplo.com'}
                              />
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

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gerenciar Permissões de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEmployees.map((employee) => (
                    <Card key={employee.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => openPermissionsDialog(employee)}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-medium">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ROLE_LABELS[employee.employee_role] || employee.employee_role}
                          </p>
                          <Button variant="outline" size="sm" className="mt-3">
                            Gerenciar Permissões
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <CustomRoleManager />
          </TabsContent>
        </Tabs>
      ) : (
        // View for non-directors
        <Card>
          <CardHeader>
            <CardTitle>Lista de Funcionários</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando funcionários...</p>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? 'Nenhum funcionário encontrado.' : 'Nenhum funcionário cadastrado.'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROLE_LABELS[employee.employee_role] || employee.employee_role}
                        </Badge>
                      </TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? "default" : "secondary"}>
                          {employee.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões do Funcionário</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Editando permissões para: <span className="font-medium">{selectedEmployee.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {selectedEmployee.user_id}
                </p>
              </div>
              <EmployeePermissions 
                employeeId={selectedEmployee.user_id}
                employeeName={selectedEmployee.name || 'Funcionário'}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}