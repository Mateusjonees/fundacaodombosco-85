import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAuditLog } from '@/hooks/useAuditLog';
import { usePermissions } from '@/hooks/usePermissions';
import { UserPlus, Edit, Trash2, Eye, Calendar, MapPin, Building2, CreditCard } from 'lucide-react';

type EmployeeRole = 'director' | 'coordinator_madre' | 'coordinator_floresta' | 'staff' | 'intern' | 'musictherapist' | 'financeiro' | 'receptionist' | 'psychologist' | 'psychopedagogue' | 'speech_therapist' | 'nutritionist' | 'physiotherapist';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  employee_role: EmployeeRole;
  phone?: string;
  document_cpf?: string;
  document_rg?: string;
  address?: string;
  department?: string;
  is_active: boolean;
  hire_date: string;
  salary?: number;
  permissions?: any;
  birth_date?: string;
}

interface FormData {
  name: string;
  employee_role: EmployeeRole;
  phone: string;
  document_cpf: string;
  document_rg: string;
  address: string;
  department: string;
  salary: string;
  birth_date: string;
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Diretor(a)',
  coordinator_madre: 'Coordenador(a) Madre',
  coordinator_floresta: 'Coordenador(a) Floresta',
  staff: 'Funcionário(a) Geral',
  intern: 'Estagiário(a)',
  musictherapist: 'Musicoterapeuta',
  financeiro: 'Financeiro',
  receptionist: 'Recepcionista',
  psychologist: 'Psicólogo(a)',
  psychopedagogue: 'Psicopedagogo(a)',
  speech_therapist: 'Fonoaudiólogo(a)',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta'
};

const EMPLOYEE_ROLES = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export const EmployeeManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { isDirector, canManageUsers, loading: permissionsLoading } = usePermissions();
  
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<FormData>({
    name: '',
    employee_role: 'staff',
    phone: '',
    document_cpf: '',
    document_rg: '',
    address: '',
    department: '',
    salary: '',
    birth_date: '',
  });

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

      if (error) {
        console.error('Error loading employees:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os funcionários.",
        });
        return;
      }

      setEmployees(data || []);
      
      await logAction({
        entityType: 'employees',
        action: 'list_viewed',
        metadata: { total_employees: data?.length || 0 }
      });
    } catch (error) {
      console.error('Unexpected error loading employees:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    try {
      // This would require admin privileges to create auth users
      // For now, we'll just show the signup form instructions
      toast({
        title: "Cadastro de Funcionário",
        description: "Para cadastrar um novo funcionário, use o formulário de cadastro na tela de login.",
      });
      
      await logAction({
        entityType: 'employees',
        action: 'create_attempted',
        newData: formData
      });
      
      setIsCreateModalOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o funcionário.",
      });
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          employee_role: formData.employee_role,
          phone: formData.phone,
          document_cpf: formData.document_cpf,
          document_rg: formData.document_rg,
          address: formData.address,
          department: formData.department,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          birth_date: formData.birth_date || null,
        })
        .eq('id', selectedEmployee.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Funcionário atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });

      await logAction({
        entityType: 'employees',
        entityId: selectedEmployee.id,
        action: 'updated',
        oldData: selectedEmployee,
        newData: formData
      });

      setIsEditModalOpen(false);
      loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o funcionário.",
      });
    }
  };

  const handleDeactivateEmployee = async (employee: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', employee.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Funcionário desativado",
        description: "O funcionário foi desativado com sucesso.",
      });

      await logAction({
        entityType: 'employees',
        entityId: employee.id,
        action: 'deactivated',
        oldData: { is_active: employee.is_active },
        newData: { is_active: false }
      });

      loadEmployees();
    } catch (error) {
      console.error('Error deactivating employee:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível desativar o funcionário.",
      });
    }
  };

  const openEditModal = (employee: Profile) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name || '',
      employee_role: employee.employee_role,
      phone: employee.phone || '',
      document_cpf: employee.document_cpf || '',
      document_rg: employee.document_rg || '',
      address: employee.address || '',
      department: employee.department || '',
      salary: employee.salary?.toString() || '',
      birth_date: employee.birth_date || '',
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = async (employee: Profile) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
    
    await logAction({
      entityType: 'employees',
      entityId: employee.id,
      action: 'viewed',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      employee_role: 'staff',
      phone: '',
      document_cpf: '',
      document_rg: '',
      address: '',
      department: '',
      salary: '',
      birth_date: '',
    });
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando permissões...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Funcionários</h2>
        <div className="flex gap-2">
          <Button onClick={loadEmployees} disabled={loading} variant="outline">
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
          {isDirector && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Para cadastrar um novo funcionário, ele deve usar o formulário de cadastro na tela de login.
                    Aqui você pode apenas visualizar as informações dos funcionários já cadastrados.
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(false)} className="w-full">
                    Entendido
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando funcionários...</p>
          ) : employees.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum funcionário encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Contratação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
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
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openViewModal(employee)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isDirector && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {employee.is_active && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeactivateEmployee(employee)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Employee Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Funcionário</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.name}</p>
                </div>
                <div>
                  <Label>Função</Label>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_LABELS[selectedEmployee.employee_role]}
                  </p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.phone || '-'}</p>
                </div>
                <div>
                  <Label>CPF</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.document_cpf || '-'}</p>
                </div>
                <div>
                  <Label>RG</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.document_rg || '-'}</p>
                </div>
                <div>
                  <Label>Departamento</Label>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.department || '-'}</p>
                </div>
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployee.birth_date ? new Date(selectedEmployee.birth_date).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div>
                <Label>Endereço</Label>
                <p className="text-sm text-muted-foreground">{selectedEmployee.address || '-'}</p>
              </div>
              {selectedEmployee.salary && (
                <div>
                  <Label>Salário</Label>
                  <p className="text-sm text-muted-foreground">
                    R$ {selectedEmployee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              <div>
                <Label>Data de Contratação</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployee.hire_date ? new Date(selectedEmployee.hire_date).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={selectedEmployee.is_active ? "default" : "secondary"}>
                  {selectedEmployee.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Função</Label>
                <Select value={formData.employee_role} onValueChange={(value: EmployeeRole) => setFormData({ ...formData, employee_role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.document_cpf}
                  onChange={(e) => setFormData({ ...formData, document_cpf: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.document_rg}
                  onChange={(e) => setFormData({ ...formData, document_rg: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
              <div>
                <Label htmlFor="salary">Salário (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateEmployee}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};