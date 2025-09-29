import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface AddStockItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CATEGORIES = [
  { value: 'Material Médico', label: 'Material Médico' },
  { value: 'Material Artístico', label: 'Material Artístico' },
  { value: 'Material de Escritório', label: 'Material de Escritório' },
  { value: 'Limpeza', label: 'Limpeza' },
  { value: 'Equipamentos', label: 'Equipamentos' },
  { value: 'Medicamentos', label: 'Medicamentos' },
  { value: 'Outros', label: 'Outros' }
];

const UNITS = [
  { value: 'Unidade', label: 'Unidade' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'litro', label: 'Litro' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'metro', label: 'Metro' },
  { value: 'cm', label: 'Centímetro' }
];

export default function AddStockItemDialog({ isOpen, onClose, onUpdate }: AddStockItemDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Material Médico', // Valor padrão válido
    unit: 'Unidade',
    current_quantity: 0,
    minimum_quantity: 5,
    unit_cost: 0,
    supplier: '',
    location: '',
    barcode: '',
    expiry_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome do item é obrigatório."
      });
      return;
    }

    if (!formData.unit) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Unidade de medida é obrigatória."
      });
      return;
    }

    setLoading(true);
    try {
      // Inserir item no estoque
      const { data: stockData, error: stockError } = await supabase
        .from('stock_items')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category && formData.category !== '' ? formData.category : null,
          unit: formData.unit,
          current_quantity: formData.current_quantity,
          minimum_quantity: formData.minimum_quantity,
          unit_cost: formData.unit_cost,
          supplier: formData.supplier.trim() || null,
          location: formData.location.trim() || null,
          barcode: formData.barcode.trim() || null,
          expiry_date: formData.expiry_date || null,
          created_by: user?.id,
          is_active: true
        })
        .select()
        .single();

      if (stockError) throw stockError;

      // Criar registro financeiro se houver custo e quantidade
      if (formData.unit_cost > 0 && formData.current_quantity > 0) {
        const totalCost = formData.unit_cost * formData.current_quantity;
        
        const { error: financialError } = await supabase
          .from('financial_records')
          .insert({
            type: 'expense',
            category: 'supplies',
            description: `Compra de estoque: ${formData.name}${formData.supplier ? ` - ${formData.supplier}` : ''}`,
            amount: totalCost,
            date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            notes: `Item: ${formData.name} | Categoria: ${formData.category} | Quantidade: ${formData.current_quantity} ${formData.unit} | Custo unitário: R$ ${formData.unit_cost.toFixed(2)}${formData.supplier ? ` | Fornecedor: ${formData.supplier}` : ''}${formData.location ? ` | Localização: ${formData.location}` : ''}`,
            created_by: user?.id
          });

        if (financialError) {
          console.error('Error creating financial record:', financialError);
          // Não falha a operação se der erro no financeiro, mas avisa o usuário
          toast({
            variant: "destructive",
            title: "Aviso",
            description: "Item adicionado ao estoque, mas houve erro ao criar o registro financeiro."
          });
        }
      }

      if (stockError) throw stockError;

      toast({
        title: "Sucesso",
        description: formData.unit_cost > 0 && formData.current_quantity > 0 
          ? `Item adicionado ao estoque e registro financeiro criado (R$ ${(formData.unit_cost * formData.current_quantity).toFixed(2)})!`
          : "Item adicionado ao estoque com sucesso!"
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'Material Médico', // Valor padrão válido
        unit: 'Unidade',
        current_quantity: 0,
        minimum_quantity: 5,
        unit_cost: 0,
        supplier: '',
        location: '',
        barcode: '',
        expiry_date: ''
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error adding stock item:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o item ao estoque."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Novo Item ao Estoque
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Item *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome do item"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => handleInputChange('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_quantity">Quantidade Inicial</Label>
              <Input
                id="current_quantity"
                type="number"
                min="0"
                value={formData.current_quantity}
                onChange={(e) => handleInputChange('current_quantity', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_quantity">Estoque Mínimo</Label>
              <Input
                id="minimum_quantity"
                type="number"
                min="0"
                value={formData.minimum_quantity}
                onChange={(e) => handleInputChange('minimum_quantity', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Valor Unitário (R$)</Label>
              <Input
                id="unit_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => handleInputChange('unit_cost', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="Nome do fornecedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Local de armazenamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="Código de barras do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Data de Validade</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição detalhada do item"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}