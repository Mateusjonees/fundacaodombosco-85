import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Clock, Star, Target, Package, DollarSign, FileText, Plus } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  category: string;
  unit_cost?: number;
}

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  title: string;
  clients?: { name: string };
}

interface CompleteAttendanceDialogProps {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CompleteAttendanceDialog({ 
  schedule, 
  isOpen, 
  onClose, 
  onComplete 
}: CompleteAttendanceDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  
  const [attendanceData, setAttendanceData] = useState({
    // Informações básicas
    sessionType: 'Consulta',
    actualDuration: 60,
    actualStartTime: '',
    actualEndTime: '',
    
    // Avaliações de qualidade (1-5 estrelas)
    overallQuality: 5,
    patientCooperation: 5,
    goalAchievement: 5,
    effortRating: 5,
    
    // Objetivos e resultados
    sessionObjectives: '',
    objectivesAchieved: '',
    patientResponse: '',
    
    // Materiais utilizados
    materialsUsed: [] as Array<{
      stock_item_id: string;
      name: string;
      quantity: number;
      unit: string;
      available_quantity: number;
      observation?: string;
    }>,
    materialsNotes: '',
    
    // Observações profissionais
    clinicalObservations: '',
    nextSessionPlan: '',
    homeRecommendations: '',
    supervisionNeeded: false,
    
    // Dados financeiros
    sessionValue: 0,
    paymentMethod: 'cash',
    paymentReceived: true,
    paymentNotes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadStockItems();
    }
  }, [isOpen]);

  const loadStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('id, name, current_quantity, unit, category, unit_cost')
        .eq('is_active', true)
        .gt('current_quantity', 0)
        .order('name');

      if (error) throw error;
      setStockItems(data || []);
    } catch (error) {
      console.error('Error loading stock items:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os itens do estoque.",
      });
    }
  };

  const handleComplete = async () => {
    if (!schedule || !user) return;
    
    setLoading(true);
    try {
      // 1. Atualizar o status do agendamento
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ 
          status: 'completed',
          session_notes: attendanceData.clinicalObservations,
          session_amount: attendanceData.sessionValue,
          payment_method: attendanceData.paymentMethod,
          completed_at: new Date().toISOString(),
          completed_by: user.id
        })
        .eq('id', schedule.id);

      if (updateError) throw updateError;

      // 2. Criar relatório de atendimento
      const { error: reportError } = await supabase
        .from('attendance_reports')
        .insert({
          schedule_id: schedule.id,
          client_id: schedule.client_id,
          employee_id: user.id,
          patient_name: schedule.clients?.name || '',
          professional_name: user.email || '',
          attendance_type: attendanceData.sessionType,
          start_time: attendanceData.actualStartTime || schedule.start_time,
          end_time: attendanceData.actualEndTime || schedule.end_time,
          session_duration: attendanceData.actualDuration,
          observations: attendanceData.clinicalObservations,
          session_notes: attendanceData.nextSessionPlan,
          materials_used: attendanceData.materialsUsed,
          techniques_used: attendanceData.sessionObjectives,
          patient_response: attendanceData.patientResponse,
          next_session_plan: attendanceData.nextSessionPlan,
          amount_charged: attendanceData.sessionValue,
          created_by: user.id
        });

      if (reportError) throw reportError;

      // 3. Criar relatório do funcionário (mais detalhado)
      const { error: employeeReportError } = await supabase
        .from('employee_reports')
        .insert({
          employee_id: user.id,
          client_id: schedule.client_id,
          schedule_id: schedule.id,
          session_date: new Date().toISOString().split('T')[0],
          session_type: attendanceData.sessionType,
          session_duration: attendanceData.actualDuration,
          effort_rating: attendanceData.effortRating,
          quality_rating: attendanceData.overallQuality,
          patient_cooperation: attendanceData.patientCooperation,
          goal_achievement: attendanceData.goalAchievement,
          session_objectives: attendanceData.sessionObjectives,
          techniques_used: attendanceData.objectivesAchieved,
          patient_response: attendanceData.patientResponse,
          professional_notes: attendanceData.clinicalObservations,
          next_session_plan: attendanceData.nextSessionPlan,
          materials_used: attendanceData.materialsUsed,
          materials_cost: 0, // Será calculado se necessário
          session_location: 'Clínica',
          supervision_required: attendanceData.supervisionNeeded,
          follow_up_needed: attendanceData.nextSessionPlan ? true : false
        });

      if (employeeReportError) throw employeeReportError;

      // 4. Criar registro financeiro se houver valor
      if (attendanceData.sessionValue > 0) {
        const { error: financialError } = await supabase
          .from('financial_records')
          .insert({
            type: 'revenue',
            category: 'Atendimento',
            description: `${attendanceData.sessionType} - ${schedule.clients?.name}`,
            amount: attendanceData.sessionValue,
            date: new Date().toISOString().split('T')[0],
            payment_method: attendanceData.paymentMethod,
            client_id: schedule.client_id,
            employee_id: user.id,
            created_by: user.id,
            notes: attendanceData.paymentNotes
          });

        if (financialError) console.error('Financial record error:', financialError);
      }

      // 5. Processar materiais utilizados - criar movimentações e atualizar estoque
      if (attendanceData.materialsUsed.length > 0) {
        for (const material of attendanceData.materialsUsed) {
          // Criar movimentação de estoque
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
              stock_item_id: material.stock_item_id,
              type: 'out',
              quantity: material.quantity,
              reason: 'Utilizado em atendimento',
              notes: `${attendanceData.sessionType} - ${schedule.clients?.name}${material.observation ? ` - ${material.observation}` : ''}`,
              created_by: user.id,
              client_id: schedule.client_id,
              schedule_id: schedule.id
            });

          if (movementError) {
            console.error('Error creating stock movement:', movementError);
            continue;
          }

          // Atualizar quantidade no estoque
          const { data: currentItem, error: fetchError } = await supabase
            .from('stock_items')
            .select('current_quantity')
            .eq('id', material.stock_item_id)
            .single();

          if (fetchError || !currentItem) {
            console.error('Error fetching current stock:', fetchError);
            continue;
          }

          const newQuantity = Math.max(0, currentItem.current_quantity - material.quantity);
          
          const { error: updateStockError } = await supabase
            .from('stock_items')
            .update({ current_quantity: newQuantity })
            .eq('id', material.stock_item_id);

          if (updateStockError) {
            console.error('Error updating stock quantity:', updateStockError);
          }
        }
      }

      toast({
        title: "Atendimento Concluído!",
        description: "Todas as informações foram registradas com sucesso no sistema.",
      });

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing attendance:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível concluir o atendimento. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = (stockItemId: string) => {
    const stockItem = stockItems.find(item => item.id === stockItemId);
    if (!stockItem) return;

    const existingMaterial = attendanceData.materialsUsed.find(m => m.stock_item_id === stockItemId);
    if (existingMaterial) {
      toast({
        variant: "destructive",
        title: "Material já adicionado",
        description: "Este material já está na lista. Use os controles para ajustar a quantidade.",
      });
      return;
    }

    const newMaterial = {
      stock_item_id: stockItemId,
      name: stockItem.name,
      quantity: 1,
      unit: stockItem.unit,
      available_quantity: stockItem.current_quantity,
      observation: ''
    };

    setAttendanceData(prev => ({
      ...prev,
      materialsUsed: [...prev.materialsUsed, newMaterial]
    }));
  };

  const removeMaterial = (index: number) => {
    setAttendanceData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    if (field === 'quantity') {
      const material = attendanceData.materialsUsed[index];
      if (value > material.available_quantity) {
        toast({
          variant: "destructive",
          title: "Quantidade insuficiente",
          description: `Quantidade máxima disponível: ${material.available_quantity} ${material.unit}`,
        });
        return;
      }
    }
    
    setAttendanceData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const renderStarRating = (field: string, value: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          variant="ghost"
          size="sm"
          className="p-0 w-6 h-6"
          onClick={() => setAttendanceData(prev => ({ ...prev, [field]: star }))}
        >
          <Star
            className={`h-4 w-4 ${
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </Button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
    </div>
  );

  if (!schedule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Concluir Atendimento - {schedule.clients?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Informações da Sessão
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Atendimento</Label>
                <Select 
                  value={attendanceData.sessionType} 
                  onValueChange={(value) => setAttendanceData(prev => ({...prev, sessionType: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consulta">Consulta</SelectItem>
                    <SelectItem value="Terapia">Terapia</SelectItem>
                    <SelectItem value="Avaliação">Avaliação</SelectItem>
                    <SelectItem value="Fonoaudiologia">Fonoaudiologia</SelectItem>
                    <SelectItem value="Psicologia">Psicologia</SelectItem>
                    <SelectItem value="Musicoterapia">Musicoterapia</SelectItem>
                    <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                    <SelectItem value="Nutrição">Nutrição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Duração Real (minutos)</Label>
                <Input
                  type="number"
                  min="1"
                  value={attendanceData.actualDuration}
                  onChange={(e) => setAttendanceData(prev => ({...prev, actualDuration: parseInt(e.target.value) || 60}))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Avaliações de Qualidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Avaliação da Sessão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Qualidade Geral</Label>
                {renderStarRating('overallQuality', attendanceData.overallQuality)}
              </div>
              
              <div>
                <Label>Cooperação do Paciente</Label>
                {renderStarRating('patientCooperation', attendanceData.patientCooperation)}
              </div>
              
              <div>
                <Label>Alcance dos Objetivos</Label>
                {renderStarRating('goalAchievement', attendanceData.goalAchievement)}
              </div>
              
              <div>
                <Label>Avaliação do Esforço</Label>
                {renderStarRating('effortRating', attendanceData.effortRating)}
              </div>
            </CardContent>
          </Card>

          {/* Objetivos e Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objetivos e Resultados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Objetivos da Sessão</Label>
                <Textarea
                  value={attendanceData.sessionObjectives}
                  onChange={(e) => setAttendanceData(prev => ({...prev, sessionObjectives: e.target.value}))}
                  placeholder="Descreva os objetivos planejados para esta sessão..."
                />
              </div>
              
              <div>
                <Label>Objetivos Alcançados</Label>
                <Textarea
                  value={attendanceData.objectivesAchieved}
                  onChange={(e) => setAttendanceData(prev => ({...prev, objectivesAchieved: e.target.value}))}
                  placeholder="Descreva quais objetivos foram alcançados..."
                />
              </div>
              
              <div>
                <Label>Resposta do Paciente</Label>
                <Textarea
                  value={attendanceData.patientResponse}
                  onChange={(e) => setAttendanceData(prev => ({...prev, patientResponse: e.target.value}))}
                  placeholder="Como o paciente reagiu durante a sessão..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Materiais Utilizados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materiais Utilizados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendanceData.materialsUsed.map((material, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Material</Label>
                    <div className="text-sm font-medium p-2 bg-muted rounded">
                      {material.name}
                      <Badge variant="outline" className="ml-2">
                        {material.available_quantity} {material.unit} disponível
                      </Badge>
                    </div>
                  </div>
                  <div className="w-20">
                    <Label>Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      max={material.available_quantity}
                      value={material.quantity}
                      onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Observação</Label>
                    <Input
                      value={material.observation || ''}
                      onChange={(e) => updateMaterial(index, 'observation', e.target.value)}
                      placeholder="Observação (opcional)"
                    />
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeMaterial(index)}>
                    Remover
                  </Button>
                </div>
              ))}
              
              <div className="space-y-2">
                <Label>Adicionar Material do Estoque</Label>
                <Select onValueChange={addMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um material" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockItems
                      .filter(item => !attendanceData.materialsUsed.some(m => m.stock_item_id === item.id))
                      .map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{item.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {item.current_quantity} {item.unit}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Observações Clínicas */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Clínicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Observações da Sessão</Label>
                <Textarea
                  value={attendanceData.clinicalObservations}
                  onChange={(e) => setAttendanceData(prev => ({...prev, clinicalObservations: e.target.value}))}
                  placeholder="Observações detalhadas sobre o atendimento..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label>Plano para Próxima Sessão</Label>
                <Textarea
                  value={attendanceData.nextSessionPlan}
                  onChange={(e) => setAttendanceData(prev => ({...prev, nextSessionPlan: e.target.value}))}
                  placeholder="Planejamento para o próximo atendimento..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor da Sessão (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={attendanceData.sessionValue}
                  onChange={(e) => setAttendanceData(prev => ({...prev, sessionValue: parseFloat(e.target.value) || 0}))}
                />
              </div>
              
              <div>
                <Label>Forma de Pagamento</Label>
                <Select 
                  value={attendanceData.paymentMethod} 
                  onValueChange={(value) => setAttendanceData(prev => ({...prev, paymentMethod: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="insurance">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? 'Salvando...' : 'Concluir Atendimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}