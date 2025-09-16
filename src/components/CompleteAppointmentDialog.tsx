import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Package, Plus, Minus, Trash2, Clock, User, DollarSign, FileText, TrendingUp, Calendar } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StockItem {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  category: string;
  unit_cost: number;
}

interface SelectedMaterial {
  stock_item_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
}

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  client_id: string;
  employee_id: string;
  clients?: { name: string };
  profiles?: { name: string };
}

interface CompleteAppointmentData {
  // Dados básicos
  scheduleId: string;
  clientId: string;
  employeeId: string;
  
  // Para relatórios
  actualDuration: number; // em minutos
  sessionNumber: number;
  progressNotes: string;
  clientProgress: string; // 'excellent' | 'good' | 'regular' | 'poor'
  
  // Para financeiro
  sessionValue: number;
  paymentMethod: string;
  paymentStatus: string; // 'paid' | 'pending' | 'scheduled'
  
  // Para estoque
  materials: SelectedMaterial[];
  totalMaterialsCost: number;
  
  // Para histórico clínico
  clinicalObservations: string;
  symptoms: string;
  nextSteps: string;
  followUpDate?: string;
}

interface CompleteAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onComplete: (data: CompleteAppointmentData) => Promise<void>;
}

export function CompleteAppointmentDialog({ 
  isOpen, 
  onClose, 
  schedule, 
  onComplete
}: CompleteAppointmentDialogProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Estados para os diferentes tipos de dados
  const [actualDuration, setActualDuration] = useState<number>(0);
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [progressNotes, setProgressNotes] = useState('');
  const [clientProgress, setClientProgress] = useState('good');
  
  const [sessionValue, setSessionValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    if (isOpen && schedule) {
      loadStockItems();
      loadSessionNumber();
      calculateDefaultDuration();
      resetForm();
    }
  }, [isOpen, schedule]);

  const resetForm = () => {
    setSelectedMaterials([]);
    setProgressNotes('');
    setSessionValue(0);
    setPaymentMethod('');
    setPaymentStatus('pending');
    setClinicalObservations('');
    setSymptoms('');
    setNextSteps('');
    setFollowUpDate('');
    setClientProgress('good');
  };

  const calculateDefaultDuration = () => {
    if (!schedule) return;
    
    const start = new Date(schedule.start_time);
    const end = new Date(schedule.end_time);
    const duration = differenceInMinutes(end, start);
    setActualDuration(duration);
  };

  const loadSessionNumber = async () => {
    if (!schedule) return;

    try {
      // Buscar número de sessões já completadas para este cliente
      const { data, error } = await supabase
        .from('appointment_sessions')
        .select('session_number')
        .eq('schedule_id', schedule.id);

      if (error) throw error;
      
      // Se já existe uma sessão, incrementar, senão começar com 1
      const maxSession = data?.reduce((max, session) => 
        Math.max(max, session.session_number || 0), 0) || 0;
      setSessionNumber(maxSession + 1);
    } catch (error) {
      console.error('Error loading session number:', error);
      setSessionNumber(1);
    }
  };

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

  const addMaterial = (stockItemId: string) => {
    const stockItem = stockItems.find(item => item.id === stockItemId);
    if (!stockItem) return;

    const existingMaterial = selectedMaterials.find(m => m.stock_item_id === stockItemId);
    if (existingMaterial) {
      toast({
        variant: "destructive",
        title: "Material já adicionado",
        description: "Este material já está na lista. Use os controles para ajustar a quantidade.",
      });
      return;
    }

    const newMaterial: SelectedMaterial = {
      stock_item_id: stockItemId,
      name: stockItem.name,
      quantity: 1,
      unit: stockItem.unit,
      unit_cost: stockItem.unit_cost || 0,
      total_cost: stockItem.unit_cost || 0
    };

    setSelectedMaterials([...selectedMaterials, newMaterial]);
  };

  const updateQuantity = (stockItemId: string, newQuantity: number) => {
    const stockItem = stockItems.find(item => item.id === stockItemId);
    if (!stockItem) return;

    if (newQuantity > stockItem.current_quantity) {
      toast({
        variant: "destructive",
        title: "Quantidade insuficiente",
        description: `Quantidade máxima disponível: ${stockItem.current_quantity} ${stockItem.unit}`,
      });
      return;
    }

    if (newQuantity <= 0) {
      removeMaterial(stockItemId);
      return;
    }

    setSelectedMaterials(materials =>
      materials.map(m =>
        m.stock_item_id === stockItemId 
          ? { ...m, quantity: newQuantity, total_cost: newQuantity * m.unit_cost }
          : m
      )
    );
  };

  const removeMaterial = (stockItemId: string) => {
    setSelectedMaterials(materials => 
      materials.filter(m => m.stock_item_id !== stockItemId)
    );
  };

  const getTotalMaterialsCost = () => {
    return selectedMaterials.reduce((total, material) => total + material.total_cost, 0);
  };

  const handleComplete = async () => {
    if (!schedule) return;

    // Validações básicas
    if (!progressNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Por favor, adicione observações sobre o progresso do atendimento.",
      });
      return;
    }

    if (!clinicalObservations.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Por favor, adicione observações clínicas sobre o atendimento.",
      });
      return;
    }

    setLoading(true);
    try {
      const completeData: CompleteAppointmentData = {
        scheduleId: schedule.id,
        clientId: schedule.client_id,
        employeeId: schedule.employee_id,
        
        // Para relatórios
        actualDuration,
        sessionNumber,
        progressNotes,
        clientProgress,
        
        // Para financeiro
        sessionValue,
        paymentMethod,
        paymentStatus,
        
        // Para estoque
        materials: selectedMaterials,
        totalMaterialsCost: getTotalMaterialsCost(),
        
        // Para histórico clínico
        clinicalObservations,
        symptoms,
        nextSteps,
        followUpDate: followUpDate || undefined
      };

      await onComplete(completeData);
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error completing appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableItems = stockItems.filter(item => 
    !selectedMaterials.some(m => m.stock_item_id === item.id)
  );

  const groupedItems = availableItems.reduce((groups, item) => {
    const category = item.category || 'Outros';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, StockItem[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-primary" />
            Concluir Atendimento - Registrar Informações
          </DialogTitle>
        </DialogHeader>

        {schedule && (
          <div className="space-y-6">
            {/* Detalhes do Agendamento */}
            <Card className="gradient-card shadow-professional">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Detalhes do Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                    <p className="font-medium">{schedule.clients?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Profissional</Label>
                    <p className="font-medium">{schedule.profiles?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                    <p className="font-medium">{schedule.title}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Horário Previsto</Label>
                    <p className="font-medium">
                      {format(new Date(schedule.start_time), 'dd/MM/yyyy HH:mm', { locale: ptBR })} às{' '}
                      {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Sessão Número</Label>
                    <p className="font-medium text-primary">#{sessionNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Abas com diferentes categorias de informações */}
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Progresso
                </TabsTrigger>
                <TabsTrigger value="clinical" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Clínico
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Materiais
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financeiro
                </TabsTrigger>
              </TabsList>

              {/* Aba Progresso - Para Relatórios */}
              <TabsContent value="progress" className="space-y-4">
                <Card className="shadow-professional">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Informações para Relatório
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="actualDuration">Duração Efetiva (minutos)</Label>
                        <Input
                          id="actualDuration"
                          type="number"
                          min="5"
                          max="480"
                          value={actualDuration}
                          onChange={(e) => setActualDuration(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientProgress">Avaliação do Progresso</Label>
                        <Select value={clientProgress} onValueChange={setClientProgress}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excelente</SelectItem>
                            <SelectItem value="good">Bom</SelectItem>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="poor">Necessita Atenção</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="progressNotes">Observações sobre o Progresso *</Label>
                      <Textarea
                        id="progressNotes"
                        value={progressNotes}
                        onChange={(e) => setProgressNotes(e.target.value)}
                        placeholder="Descreva como foi o atendimento, evolução do cliente, objetivos alcançados..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Clínico - Para Histórico do Cliente */}
              <TabsContent value="clinical" className="space-y-4">
                <Card className="shadow-professional">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Registro Clínico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="clinicalObservations">Observações Clínicas *</Label>
                      <Textarea
                        id="clinicalObservations"
                        value={clinicalObservations}
                        onChange={(e) => setClinicalObservations(e.target.value)}
                        placeholder="Observações técnicas, avaliações, diagnósticos..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="symptoms">Sintomas Observados</Label>
                      <Textarea
                        id="symptoms"
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Sintomas apresentados pelo cliente durante a sessão..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nextSteps">Próximos Passos</Label>
                      <Textarea
                        id="nextSteps"
                        value={nextSteps}
                        onChange={(e) => setNextSteps(e.target.value)}
                        placeholder="Recomendações, exercícios, atividades para casa..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="followUpDate">Data de Retorno (Opcional)</Label>
                      <Input
                        id="followUpDate"
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Materiais - Para Estoque */}
              <TabsContent value="materials" className="space-y-4">
                <Card className="shadow-professional">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Materiais Utilizados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Adicionar Material */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category}>
                          <Label className="text-sm font-medium text-primary mb-2 block">
                            {category} ({items.length} itens)
                          </Label>
                          <Select onValueChange={addMaterial}>
                            <SelectTrigger>
                              <SelectValue placeholder={`Selecione um item de ${category.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map((item) => (
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
                      ))}
                    </div>

                    {/* Materiais Selecionados */}
                    {selectedMaterials.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Materiais Selecionados</Label>
                        {selectedMaterials.map((material) => {
                          const stockItem = stockItems.find(item => item.id === material.stock_item_id);
                          return (
                            <div key={material.stock_item_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Package className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="font-medium">{material.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Disponível: {stockItem?.current_quantity} {material.unit} | 
                                    Custo: R$ {material.total_cost.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(material.stock_item_id, material.quantity - 1)}
                                  disabled={material.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  max={stockItem?.current_quantity}
                                  value={material.quantity}
                                  onChange={(e) => updateQuantity(material.stock_item_id, parseInt(e.target.value) || 1)}
                                  className="w-16 text-center"
                                />
                                <span className="text-sm font-medium min-w-fit">{material.unit}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(material.stock_item_id, material.quantity + 1)}
                                  disabled={material.quantity >= (stockItem?.current_quantity || 0)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeMaterial(material.stock_item_id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <p className="font-semibold text-primary">
                            Custo Total dos Materiais: R$ {getTotalMaterialsCost().toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Financeiro */}
              <TabsContent value="financial" className="space-y-4">
                <Card className="shadow-professional">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Informações Financeiras
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessionValue">Valor da Sessão (R$)</Label>
                        <Input
                          id="sessionValue"
                          type="number"
                          min="0"
                          step="0.01"
                          value={sessionValue}
                          onChange={(e) => setSessionValue(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentStatus">Status do Pagamento</Label>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="scheduled">Agendado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="card">Cartão</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="transfer">Transferência</SelectItem>
                          <SelectItem value="installments">Parcelado</SelectItem>
                          <SelectItem value="insurance">Convênio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Resumo Financeiro */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <h4 className="font-semibold">Resumo Financeiro</h4>
                      <div className="flex justify-between">
                        <span>Valor da Sessão:</span>
                        <span>R$ {sessionValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Custo de Materiais:</span>
                        <span>R$ {getTotalMaterialsCost().toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Receita Líquida:</span>
                        <span className="text-primary">R$ {(sessionValue - getTotalMaterialsCost()).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={loading || !progressNotes.trim() || !clinicalObservations.trim()}
                className="bg-primary hover:bg-primary/90 shadow-professional"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir Atendimento
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}