import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

type EmployeeRole = 'director' | 'coordinator_madre' | 'coordinator_floresta' | 'staff' | 'intern' | 'terapeuta_ocupacional' | 'advogada' | 'musictherapist' | 'financeiro' | 'receptionist' | 'psychologist' | 'psychopedagogue' | 'speech_therapist' | 'nutritionist' | 'physiotherapist';

interface CreateEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledData?: {
    name?: string;
    email?: string;
    password?: string;
    employee_role?: EmployeeRole;
    unit?: string;
  };
}

interface JobPosition {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
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

export const CreateEmployeeForm = ({ isOpen, onClose, onSuccess, prefilledData }: CreateEmployeeFormProps) => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { userRole } = useRolePermissions();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  
  const [formData, setFormData] = useState({
    name: prefilledData?.name || '',
    email: prefilledData?.email || '',
    password: prefilledData?.password || '',
    employee_role: (prefilledData?.employee_role || 'staff') as EmployeeRole,
    phone: '',
    department: '',
    unit: prefilledData?.unit || '',
    job_position_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadJobPositions();
      // Atualizar form com dados preenchidos quando o dialog abrir
      if (prefilledData) {
        setFormData({
          name: prefilledData.name || '',
          email: prefilledData.email || '',
          password: prefilledData.password || '',
          employee_role: (prefilledData.employee_role || 'staff') as EmployeeRole,
          phone: '',
          department: '',
          unit: prefilledData.unit || '',
          job_position_id: ''
        });
      }
    }
  }, [isOpen, prefilledData]);

  const loadJobPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_job_positions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setJobPositions(data || []);
    } catch (error) {
      console.error('Error loading job positions:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      employee_role: 'staff',
      phone: '',
      department: '',
      unit: '',
      job_position_id: ''
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.unit.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome, email, senha e unidade são obrigatórios.",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);
    try {
      // Usar supabase.auth.signUp para criação segura
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: formData.name,
            employee_role: formData.employee_role,
            phone: formData.phone || null,
            department: formData.department || null,
            unit: formData.unit || null,
            job_position_id: formData.job_position_id || null
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        toast({
          variant: "destructive",
          title: "Erro ao criar funcionário",
          description: error.message || "Erro ao criar funcionário.",
        });
        return;
      }

      // Verificar se o usuário foi criado
      if (data?.user) {
        // Se um cargo foi selecionado, criar a associação
        if (formData.job_position_id) {
          try {
            await supabase
              .from('user_job_assignments')
              .insert({
                user_id: data.user.id,
                position_id: formData.job_position_id,
                assigned_by: userRole
              });
          } catch (assignmentError) {
            console.log('Warning: Could not assign job position:', assignmentError);
          }
        }

        // Enviar email de boas-vindas
        try {
          await supabase.functions.invoke('send-employee-confirmation', {
            body: {
              name: formData.name,
              email: formData.email,
              employeeRole: formData.employee_role
            }
          });
        } catch (emailError) {
          console.log('Warning: Could not send welcome email:', emailError);
        }

        // Sucesso
        toast({
          title: "Funcionário criado com sucesso",
          description: `Login criado para ${formData.name}. O funcionário já pode fazer login no sistema.`,
        });

        // Log the action (optional - don't fail if it doesn't work)
        try {
          await logAction({
            entityType: 'employees',
            action: 'created',
            metadata: { 
              employee_name: formData.name,
              employee_email: formData.email,
              employee_role: formData.employee_role,
              created_by: 'admin_panel'
            }
          });
        } catch (logError) {
          console.warn('Could not log action:', logError);
        }

        resetForm();
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar funcionário",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Novo Funcionário
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função *</Label>
            <Select 
              value={formData.employee_role} 
              onValueChange={(value: EmployeeRole) => handleInputChange('employee_role', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => {
                  // Coordenadores não podem criar diretores ou outros coordenadores
                  if (userRole === 'coordinator_madre' || userRole === 'coordinator_floresta') {
                    if (value === 'director' || value === 'coordinator_madre' || value === 'coordinator_floresta') {
                      return null;
                    }
                  }
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              type="text"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              placeholder="ex: Psicologia, Fisioterapia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Select 
              value={formData.unit} 
              onValueChange={(value) => handleInputChange('unit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="madre">MADRE</SelectItem>
                <SelectItem value="floresta">Floresta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {jobPositions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="job_position">Cargo Customizado</Label>
              <Select 
                value={formData.job_position_id} 
                onValueChange={(value) => handleInputChange('job_position_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {jobPositions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: position.color }}
                        />
                        {position.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Criando...' : 'Criar Funcionário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};