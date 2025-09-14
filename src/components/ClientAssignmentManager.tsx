import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Plus, UserCheck, UserX, Shield, X } from 'lucide-react';

interface ClientAssignment {
  id: string;
  client_id: string;
  employee_id: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
  clients?: { name: string };
  profiles?: { name: string };
  assigned_by_profile?: { name: string };
}

interface Employee {
  id: string;
  name: string;
  employee_role: string;
  user_id: string;
}

interface Client {
  id: string;
  name: string;
}

export function ClientAssignmentManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<ClientAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [addingToClient, setAddingToClient] = useState<string | null>(null);
  const [newEmployeeForClient, setNewEmployeeForClient] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('client_assignments')
        .select(`
          *,
          clients (name),
          profiles!client_assignments_employee_id_fkey (name),
          assigned_by_profile:profiles!client_assignments_assigned_by_fkey (name)
        `)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('id, name, employee_role, user_id')
        .eq('is_active', true)
        .neq('employee_role', 'director') // Directors don't need assignments
        .order('name');

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedClient || !selectedEmployee) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um cliente e um funcionário.",
      });
      return;
    }

    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('client_assignments')
        .select('id, is_active')
        .eq('client_id', selectedClient)
        .eq('employee_id', selectedEmployee)
        .single();

      if (existing) {
        if (existing.is_active) {
          toast({
            variant: "destructive",
            title: "Atribuição já existe",
            description: "Este funcionário já está atribuído a este cliente.",
          });
          return;
        } else {
          // Reactivate existing assignment
          const { error } = await supabase
            .from('client_assignments')
            .update({ is_active: true, assigned_by: user?.id })
            .eq('id', existing.id);

          if (error) throw error;
        }
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('client_assignments')
          .insert({
            client_id: selectedClient,
            employee_id: selectedEmployee,
            assigned_by: user?.id,
            is_active: true
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Atribuição criada com sucesso!",
      });

      setSelectedClient('');
      setSelectedEmployee('');
      setIsDialogOpen(false);
      loadData();

    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a atribuição.",
      });
    }
  };

  const handleToggleAssignment = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('client_assignments')
        .update({ 
          is_active: !currentStatus,
          assigned_by: user?.id
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Atribuição ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`,
      });

      loadData();
    } catch (error) {
      console.error('Error toggling assignment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar a atribuição.",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      staff: 'Funcionário',
      psychologist: 'Psicólogo(a)',
      psychopedagogue: 'Psicopedagogo(a)',
      speech_therapist: 'Fonoaudiólogo(a)',
      nutritionist: 'Nutricionista',
      physiotherapist: 'Fisioterapeuta',
      musictherapist: 'Musicoterapeuta',
      coordinator_madre: 'Coordenador(a) Madre',
      coordinator_floresta: 'Coordenador(a) Floresta'
    };
    return labels[role] || role;
  };

  // Get available clients (not yet assigned to selected employee)
  const availableClients = clients.filter(client => {
    if (!selectedEmployee) return true;
    return !assignments.some(a => 
      a.client_id === client.id && 
      a.employee_id === selectedEmployee && 
      a.is_active
    );
  });

  // Get available employees - allow unlimited assignments (no filtering)
  const availableEmployees = employees;

  // Group assignments by client
  const clientsWithAssignments = clients.map(client => {
    const clientAssignments = assignments.filter(a => a.client_id === client.id && a.is_active);
    return {
      ...client,
      assignments: clientAssignments
    };
  }).filter(client => client.assignments.length > 0);

  // Get employees not yet assigned to specific client
  const getAvailableEmployeesForClient = (clientId: string) => {
    const assignedEmployeeIds = assignments
      .filter(a => a.client_id === clientId && a.is_active)
      .map(a => a.employee_id);
    return employees.filter(emp => !assignedEmployeeIds.includes(emp.user_id));
  };

  const handleAddEmployeeToClient = async (clientId: string, employeeId: string) => {
    try {
      const { error } = await supabase
        .from('client_assignments')
        .insert({
          client_id: clientId,
          employee_id: employeeId,
          assigned_by: user?.id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Profissional vinculado com sucesso!",
      });

      setAddingToClient(null);
      setNewEmployeeForClient('');
      loadData();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível vincular o profissional.",
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('client_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vínculo removido com sucesso!",
      });

      loadData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o vínculo.",
      });
    }
  };

  return (
    <Card className="shadow-professional">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Gerenciar Atribuições de Clientes
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Atribuição
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Atribuição</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cliente:</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Funcionário:</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.user_id} value={employee.user_id}>
                        {employee.name} - {getRoleLabel(employee.employee_role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAssignment}>
                  Criar Atribuição
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : clientsWithAssignments.length === 0 ? (
          <div className="text-center py-8">Nenhuma atribuição encontrada</div>
        ) : (
          <div className="space-y-4">
            {clientsWithAssignments.map((client) => (
              <div key={client.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddingToClient(addingToClient === client.id ? null : client.id)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar Profissional
                  </Button>
                </div>

                {/* Lista de profissionais vinculados */}
                <div className="space-y-2">
                  {client.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{assignment.profiles?.name}</span>
                        <Badge variant="outline">
                          {getRoleLabel(employees.find(e => e.user_id === assignment.employee_id)?.employee_role || '')}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Formulário para adicionar novo profissional */}
                {addingToClient === client.id && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border">
                    <div className="flex items-center gap-2">
                      <Select 
                        value={newEmployeeForClient} 
                        onValueChange={setNewEmployeeForClient}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione um profissional" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableEmployeesForClient(client.id).map((employee) => (
                            <SelectItem key={employee.user_id} value={employee.user_id}>
                              {employee.name} - {getRoleLabel(employee.employee_role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleAddEmployeeToClient(client.id, newEmployeeForClient)}
                        disabled={!newEmployeeForClient}
                      >
                        Adicionar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddingToClient(null);
                          setNewEmployeeForClient('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            ℹ️ Informação de Segurança
          </h4>
          <p className="text-sm text-blue-800">
            <strong>Política de Segurança Ativa:</strong> Funcionários só podem visualizar e gerenciar clientes que foram especificamente atribuídos a eles. Diretores e coordenadores mantêm acesso total para supervisão.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}