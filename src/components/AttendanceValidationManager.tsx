import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, Clock, User, Calendar, Package, Filter } from 'lucide-react';

interface PendingAttendance {
  id: string;
  schedule_id: string;
  client_id: string;
  employee_id: string;
  patient_name: string;
  professional_name: string;
  attendance_type: string;
  session_duration: number;
  amount_charged: number;
  materials_used: any;
  attachments: any;
  created_at: string;
  validation_status: string;
  start_time: string;
  end_time: string;
  observations: string;
  session_notes: string;
  techniques_used: string;
  patient_response: string;
  next_session_plan: string;
  unit?: string;
}

interface Employee {
  user_id: string;
  name: string;
}

export default function AttendanceValidationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingAttendances, setPendingAttendances] = useState<PendingAttendance[]>([]);
  const [allAttendances, setAllAttendances] = useState<PendingAttendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState<PendingAttendance | null>(null);
  const [validationAction, setValidationAction] = useState<'validate' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadPendingAttendances();
      loadEmployees();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [unitFilter, employeeFilter, allAttendances]);

  const loadPendingAttendances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_reports')
        .select(`
          *,
          clients!inner(unit)
        `)
        .eq('validation_status', 'pending_validation')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const attendancesWithUnit = data?.map(attendance => ({
        ...attendance,
        unit: attendance.clients?.unit || 'madre'
      })) || [];
      
      setAllAttendances(attendancesWithUnit);
      setPendingAttendances(attendancesWithUnit);
    } catch (error) {
      console.error('Error loading pending attendances:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os atendimentos pendentes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name')
        .not('employee_role', 'is', null)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allAttendances];

    if (unitFilter !== 'all') {
      filtered = filtered.filter(attendance => attendance.unit === unitFilter);
    }

    if (employeeFilter !== 'all') {
      filtered = filtered.filter(attendance => attendance.employee_id === employeeFilter);
    }

    setPendingAttendances(filtered);
  };

  const handleValidationAction = async () => {
    if (!selectedAttendance || !validationAction) return;

    if (validationAction === 'reject' && !rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição.",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('validate_attendance_report', {
        p_attendance_report_id: selectedAttendance.id,
        p_action: validationAction,
        p_rejection_reason: validationAction === 'reject' ? rejectionReason : null
      });

      if (error) throw error;

      toast({
        title: validationAction === 'validate' ? "Atendimento Validado!" : "Atendimento Rejeitado",
        description: validationAction === 'validate' 
          ? "O atendimento foi validado e os dados foram processados no sistema."
          : "O atendimento foi rejeitado e retornado ao profissional.",
      });

      // Recarregar lista
      loadPendingAttendances();
      
      // Fechar dialog
      setSelectedAttendance(null);
      setValidationAction(null);
      setRejectionReason('');
      
    } catch (error) {
      console.error('Error processing validation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível processar a validação. Tente novamente.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalMaterialsCost = (materials: any) => {
    if (!materials || !Array.isArray(materials)) return 0;
    return materials.reduce((total, material) => total + (material.total_cost || 0), 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Carregando atendimentos pendentes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Validação de Atendimentos</h1>
          <p className="text-muted-foreground">
            Atendimentos aguardando validação para serem processados no sistema
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {pendingAttendances.length} pendente{pendingAttendances.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit-filter">Unidade</Label>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  <SelectItem value="madre">Unidade Madre</SelectItem>
                  <SelectItem value="floresta">Unidade Floresta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employee-filter">Funcionário</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingAttendances.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum atendimento pendente</h3>
            <p className="text-muted-foreground">
              Todos os atendimentos foram validados ou não há atendimentos para revisar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingAttendances.map((attendance) => (
            <Card key={attendance.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {attendance.patient_name}
                  </CardTitle>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Profissional</Label>
                    <p className="text-muted-foreground">{attendance.professional_name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Unidade</Label>
                    <p className="text-muted-foreground">
                      {attendance.unit === 'madre' ? 'Madre' : 'Floresta'}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Tipo</Label>
                    <p className="text-muted-foreground">{attendance.attendance_type}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Duração</Label>
                    <p className="text-muted-foreground">{attendance.session_duration} min</p>
                  </div>
                  <div>
                    <Label className="font-medium">Data/Hora</Label>
                    <p className="text-muted-foreground">
                      {formatDate(attendance.start_time)}
                    </p>
                  </div>
                </div>

                {attendance.materials_used && Array.isArray(attendance.materials_used) && attendance.materials_used.length > 0 && (
                  <div>
                    <Label className="font-medium flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      Materiais ({Array.isArray(attendance.materials_used) ? attendance.materials_used.length : 0})
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Custo total: R$ {getTotalMaterialsCost(attendance.materials_used).toFixed(2)}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedAttendance(attendance)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Revisar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedAttendance(attendance);
                      setValidationAction('validate');
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Validar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      setSelectedAttendance(attendance);
                      setValidationAction('reject');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Revisão Detalhada */}
      <Dialog open={!!selectedAttendance && !validationAction} onOpenChange={() => setSelectedAttendance(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisão Detalhada do Atendimento</DialogTitle>
          </DialogHeader>
          
          {selectedAttendance && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Sessão</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Paciente</Label>
                    <p>{selectedAttendance.patient_name}</p>
                  </div>
                  <div>
                    <Label>Profissional</Label>
                    <p>{selectedAttendance.professional_name}</p>
                  </div>
                  <div>
                    <Label>Tipo de Atendimento</Label>
                    <p>{selectedAttendance.attendance_type}</p>
                  </div>
                  <div>
                    <Label>Duração</Label>
                    <p>{selectedAttendance.session_duration} minutos</p>
                  </div>
                  <div>
                    <Label>Horário</Label>
                    <p>{formatTime(selectedAttendance.start_time)} - {formatTime(selectedAttendance.end_time)}</p>
                  </div>
                  <div>
                    <Label>Valor Cobrado</Label>
                    <p>R$ {selectedAttendance.amount_charged.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              <Card>
                <CardHeader>
                  <CardTitle>Objetivos e Observações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Objetivos da Sessão</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                      {selectedAttendance.techniques_used || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label>Resposta do Paciente</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                      {selectedAttendance.patient_response || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label>Observações Clínicas</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                      {selectedAttendance.observations || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label>Plano para Próxima Sessão</Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                      {selectedAttendance.next_session_plan || 'Não informado'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Materiais */}
              {selectedAttendance.materials_used && Array.isArray(selectedAttendance.materials_used) && selectedAttendance.materials_used.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Materiais Utilizados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedAttendance.materials_used.map((material, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <span className="font-medium">{material.name}</span>
                            {material.observation && (
                              <p className="text-xs text-muted-foreground">{material.observation}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              {material.quantity} {material.unit}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              R$ {material.total_cost?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="text-right font-medium pt-2 border-t">
                        Total: R$ {getTotalMaterialsCost(selectedAttendance.materials_used).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Anexos */}
              {selectedAttendance.attachments && Array.isArray(selectedAttendance.attachments) && selectedAttendance.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos Anexos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedAttendance.attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="text-lg">📄</span>
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAttendance(null)}>
              Fechar
            </Button>
            <Button 
              onClick={() => {
                setValidationAction('validate');
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Validar Atendimento
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                setValidationAction('reject');
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Rejeitar Atendimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Ação */}
      <Dialog open={!!validationAction} onOpenChange={() => {
        setValidationAction(null);
        setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationAction === 'validate' ? 'Validar Atendimento' : 'Rejeitar Atendimento'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>
              {validationAction === 'validate' 
                ? 'Tem certeza que deseja validar este atendimento? Os dados serão processados no sistema (estoque, financeiro, histórico).'
                : 'Tem certeza que deseja rejeitar este atendimento? O profissional precisará revisar e reenviar.'
              }
            </p>

            {validationAction === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo da rejeição para que o profissional possa corrigir..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setValidationAction(null);
                setRejectionReason('');
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleValidationAction}
              disabled={processing}
              variant={validationAction === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Processando...' : (
                validationAction === 'validate' ? 'Confirmar Validação' : 'Confirmar Rejeição'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}