import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, Minus, Search, X, ChevronDown } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  current_quantity: number;
  unit: string;
}

interface SelectedMaterial {
  stock_item_id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface AttendanceMaterialSelectorProps {
  selectedMaterials: SelectedMaterial[];
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
}

export default function AttendanceMaterialSelector({
  selectedMaterials,
  onMaterialsChange
}: AttendanceMaterialSelectorProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('id, name, category, current_quantity, unit')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStockItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = (item: StockItem) => {
    const existing = selectedMaterials.find(m => m.stock_item_id === item.id);
    if (existing) {
      onMaterialsChange(
        selectedMaterials.map(m =>
          m.stock_item_id === item.id
            ? { ...m, quantity: m.quantity + 1 }
            : m
        )
      );
    } else {
      onMaterialsChange([
        ...selectedMaterials,
        {
          stock_item_id: item.id,
          name: item.name,
          quantity: 1,
          unit: item.unit
        }
      ]);
    }
  };

  const updateQuantity = (stockItemId: string, delta: number) => {
    onMaterialsChange(
      selectedMaterials
        .map(m =>
          m.stock_item_id === stockItemId
            ? { ...m, quantity: Math.max(0, m.quantity + delta) }
            : m
        )
        .filter(m => m.quantity > 0)
    );
  };

  const removeMaterial = (stockItemId: string) => {
    onMaterialsChange(selectedMaterials.filter(m => m.stock_item_id !== stockItemId));
  };

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          type="button"
          className="w-full justify-between h-auto py-2 px-3"
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="text-sm font-medium">Materiais Utilizados</span>
            {selectedMaterials.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedMaterials.length}
              </Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>

      {/* Materiais selecionados - sempre visível */}
      {selectedMaterials.length > 0 && !isOpen && (
        <div className="flex flex-wrap gap-1.5">
          {selectedMaterials.map(material => (
            <Badge
              key={material.stock_item_id}
              variant="secondary"
              className="flex items-center gap-1 py-0.5 px-2 text-xs"
            >
              <span className="font-medium">{material.quantity}x</span>
              <span className="max-w-[80px] truncate">{material.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMaterial(material.stock_item_id);
                }}
                className="hover:bg-destructive/20 rounded p-0.5 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <CollapsibleContent className="space-y-2">
        {/* Materiais selecionados com controles */}
        {selectedMaterials.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-lg">
            {selectedMaterials.map(material => (
              <Badge
                key={material.stock_item_id}
                variant="secondary"
                className="flex items-center gap-1 py-1 px-2"
              >
                <button
                  type="button"
                  onClick={() => updateQuantity(material.stock_item_id, -1)}
                  className="hover:bg-background/50 rounded p-0.5"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-medium">{material.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(material.stock_item_id, 1)}
                  className="hover:bg-background/50 rounded p-0.5"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <span className="text-xs max-w-[100px] truncate">{material.name}</span>
                <button
                  type="button"
                  onClick={() => removeMaterial(material.stock_item_id)}
                  className="hover:bg-destructive/20 rounded p-0.5 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Lista de itens */}
        <ScrollArea className="h-[120px] border rounded-lg">
          {loading ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Carregando...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Nenhum item encontrado
            </div>
          ) : (
            <div className="p-1">
              {filteredItems.map(item => {
                const selected = selectedMaterials.find(m => m.stock_item_id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addMaterial(item)}
                    className="w-full flex items-center justify-between p-1.5 hover:bg-muted rounded-md text-left text-xs transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Est: {item.current_quantity} {item.unit}
                      </p>
                    </div>
                    {selected ? (
                      <Badge variant="default" className="ml-2 shrink-0 text-[10px]">
                        {selected.quantity}x
                      </Badge>
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-muted-foreground ml-2 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
