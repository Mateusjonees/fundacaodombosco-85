import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Edit, UserPlus, Users, Clock } from 'lucide-react';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

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
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Funcionários</h1>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Cadastrar Funcionário
        </Button>
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
                .sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
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
                      {new Date(employee.hire_date).toLocaleDateString('pt-BR')}
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
                  <TableHead>CPF</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Contratação</TableHead>
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
                    <TableCell>{employee.document_cpf || '-'}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? "default" : "secondary"}>
                        {employee.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}