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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Package, Plus, Minus, Trash2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StockItem {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
  category: string;
}

interface SelectedMaterial {
  stock_item_id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  clients?: { name: string };
  profiles?: { name: string };
}

interface ConfirmAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onConfirm: (scheduleId: string, materials: SelectedMaterial[], notes: string) => Promise<void>;
}

export function ConfirmAppointmentDialog({ 
  isOpen, 
  onClose, 
  schedule, 
  onConfirm 
}: ConfirmAppointmentDialogProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadStockItems();
    }
  }, [isOpen]);

  const loadStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('id, name, current_quantity, unit, category')
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
      unit: stockItem.unit
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
        m.stock_item_id === stockItemId ? { ...m, quantity: newQuantity } : m
      )
    );
  };

  const removeMaterial = (stockItemId: string) => {
    setSelectedMaterials(materials => 
      materials.filter(m => m.stock_item_id !== stockItemId)
    );
  };

  const handleConfirm = async () => {
    if (!schedule) return;

    setLoading(true);
    try {
      await onConfirm(schedule.id, selectedMaterials, notes);
      
      // Reset form
      setSelectedMaterials([]);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error confirming appointment:', error);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-primary" />
            Confirmar Atendimento
          </DialogTitle>
        </DialogHeader>

        {schedule && (
          <div className="space-y-6">
            {/* Appointment Details */}
            <Card className="gradient-card shadow-professional">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Detalhes do Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                    <p className="font-medium">{schedule.clients?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Profissional</Label>
                    <p className="font-medium">{schedule.profiles?.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tipo de Atendimento</Label>
                    <p className="font-medium">{schedule.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Horário</Label>
                    <p className="font-medium">
                      {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} às{' '}
                      {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Materials Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Materiais Utilizados (Opcional)</h3>
              </div>

              {/* Add Material */}
              <Card className="shadow-professional">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Adicionar Material</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Selected Materials */}
              {selectedMaterials.length > 0 && (
                <Card className="shadow-professional">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Materiais Selecionados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedMaterials.map((material) => {
                        const stockItem = stockItems.find(item => item.id === material.stock_item_id);
                        return (
                          <div key={material.stock_item_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg animate-slide-in">
                            <div className="flex items-center gap-3">
                              <Package className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium">{material.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Disponível: {stockItem?.current_quantity} {material.unit}
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
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold">Observações do Atendimento</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva como foi o atendimento, resultados, próximos passos..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={loading}
                className="bg-primary hover:bg-primary/90 shadow-professional"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Atendimento
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