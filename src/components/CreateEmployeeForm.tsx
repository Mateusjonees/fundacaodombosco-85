import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RequiredLabel } from '@/components/ui/required-label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useRolePermissions, ROLE_LABELS, EmployeeRole } from '@/hooks/useRolePermissions';
import { TempPasswordDialog } from './TempPasswordDialog';
import { UserPlus, KeyRound } from 'lucide-react';
import { requiresMedicalLicense } from '@/utils/professionalCredentials';
import { getEdgeFunctionError } from '@/utils/edgeError';

interface CreateEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface JobPosition {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
}

// Função para gerar senha temporária segura
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const special = '@#$!';
  let password = 'Temp';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += special.charAt(Math.floor(Math.random() * special.length));
  return password;
};

const emptyFormData = {
  name: '',
  email: '',
  employee_role: 'staff' as EmployeeRole,
  phone: '',
  department: '',
  unit: '',
  job_position_id: '',
  professional_license: '',
  professional_rqe: ''
};

export const CreateEmployeeForm = ({ isOpen, onClose, onSuccess }: CreateEmployeeFormProps) => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { userRole } = useRolePermissions();
  const [loading, setLoading] = useState(false);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  
  // Estado para o dialog de senha temporária
  const [showTempPasswordDialog, setShowTempPasswordDialog] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<{
    name: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  
  const [formData, setFormData] = useState(emptyFormData);

  const needsMedicalLicense = requiresMedicalLicense(formData.employee_role);

  useEffect(() => {
    if (isOpen) {
      loadJobPositions();
      // Cada abertura começa com um cadastro novo e independente.
      resetForm();
    }
  }, [isOpen]);

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
    setFormData({ ...emptyFormData });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.unit.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome, email e unidade são obrigatórios.",
      });
      return;
    }

    if (needsMedicalLicense && !formData.professional_license.trim()) {
      toast({
        variant: "destructive",
        title: "CRM obrigatório",
        description: "Informe o CRM (e o RQE, se houver) para profissionais médicos.",
      });
      return;
    }

    setLoading(true);
    
    // Gerar senha temporária automaticamente
    const tempPassword = generateTempPassword();
    
    try {
      // Usar edge function que cria usuário via API Admin (não faz login automático)
      const { data, error } = await supabase.functions.invoke('create-users', {
        body: {
          email: formData.email.trim().toLowerCase(),
          password: tempPassword,
          name: formData.name.trim().toUpperCase(),
          employee_role: formData.employee_role,
          phone: formData.phone || null,
          department: formData.department || null,
          unit: formData.unit || null
        }
      });

      if (error) {
        console.error('Create user error:', error);
        toast({
          variant: "destructive",
          title: "Erro ao criar funcionário",
          description: await getEdgeFunctionError(error, "Erro ao criar funcionário."),
        });
        return;
      }

      // Verificar erro retornado pela edge function
      if (data?.error) {
        console.error('Edge function error:', data.error);
        toast({
          variant: "destructive",
          title: "Erro ao criar funcionário",
          description: data.error,
        });
        return;
      }

      const userId = data?.user?.id;

      if (userId) {
        // Registros profissionais (CRM/RQE) para receituários, laudos e encaminhamentos
        if (formData.professional_license.trim() || formData.professional_rqe.trim()) {
          try {
            await (supabase.from('profiles') as any)
              .update({
                professional_license: formData.professional_license.trim() || null,
                professional_rqe: formData.professional_rqe.trim() || null
              })
              .eq('user_id', userId);
          } catch (licenseError) {
            console.log('Warning: Could not save professional license:', licenseError);
          }
        }

        // Se um cargo foi selecionado, criar a associação
        if (formData.job_position_id) {
          try {
            await supabase
              .from('user_job_assignments')
              .insert({
                user_id: userId,
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

        // Log the action
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

        // Guardar dados para o dialog de senha temporária
        setCreatedEmployee({
          name: formData.name.trim().toUpperCase(),
          email: formData.email.trim().toLowerCase(),
          tempPassword
        });
        
        // Mostrar dialog com senha temporária
        setShowTempPasswordDialog(true);
        
        resetForm();
        onSuccess();
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

  const handleTempPasswordDialogClose = () => {
    setShowTempPasswordDialog(false);
    setCreatedEmployee(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showTempPasswordDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Criar Novo Funcionário
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Campos isca para impedir autofill do navegador */}
            <input type="text" name="prevent_autofill" className="hidden" autoComplete="off" tabIndex={-1} />
            <input type="password" name="password_fake" className="hidden" autoComplete="new-password" tabIndex={-1} />
            <div className="space-y-2">
              <RequiredLabel htmlFor="name" required>Nome Completo</RequiredLabel>
              <Input
                id="name"
                name="new-employee-full-name"
                type="text"
                autoComplete="new-password"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value.toUpperCase())}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="email" required>Email</RequiredLabel>
              <Input
                id="email"
                name="new-employee-contact-email"
                type="email"
                autoComplete="new-password"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            {/* Aviso sobre senha temporária */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20 p-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <KeyRound className="h-4 w-4" />
                <p className="text-sm">
                  Uma senha temporária será gerada automaticamente. 
                  O funcionário deverá alterá-la no primeiro acesso.
                </p>
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
                    if (userRole === 'coordinator_madre' || userRole === 'coordinator_floresta' || userRole === 'coordinator_atendimento_floresta') {
                      if (value === 'director' || value.startsWith('coordinator_')) {
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
                autoComplete="off"
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
                autoComplete="off"
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="ex: Psicologia, Fisioterapia"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="professional_license">
                  CRM / Registro{needsMedicalLicense ? ' *' : ''}
                </Label>
                <Input
                  id="professional_license"
                  autoComplete="off"
                  value={formData.professional_license}
                  onChange={(e) => handleInputChange('professional_license', e.target.value)}
                  placeholder="ex: CRM/MG 12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_rqe">RQE</Label>
                <Input
                  id="professional_rqe"
                  autoComplete="off"
                  value={formData.professional_rqe}
                  onChange={(e) => handleInputChange('professional_rqe', e.target.value)}
                  placeholder="ex: 6789"
                />
              </div>
            </div>
            {needsMedicalLicense && (
              <p className="text-xs text-muted-foreground -mt-2">
                CRM e RQE são impressos nos receituários, laudos e encaminhamentos.
              </p>
            )}

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
                  <SelectItem value="madre">MADRE (Clínica Social)</SelectItem>
                  <SelectItem value="floresta">Floresta (Neuroavaliação)</SelectItem>
                  <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
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

      {/* Dialog de senha temporária */}
      {createdEmployee && (
        <TempPasswordDialog
          isOpen={showTempPasswordDialog}
          onClose={handleTempPasswordDialogClose}
          employeeName={createdEmployee.name}
          employeeEmail={createdEmployee.email}
          tempPassword={createdEmployee.tempPassword}
        />
      )}
    </>
  );
};
