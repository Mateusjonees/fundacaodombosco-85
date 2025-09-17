import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Edit, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StockItemActions from '@/components/StockItemActions';

interface StockItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number;
  supplier?: string;
  location?: string;
  is_active: boolean;
  updated_at: string;
}

interface StockMovement {
  id: string;
  stock_item_id: string;
  type: string;
  quantity: number;
  reason?: string;
  date: string;
  created_by?: string;
  stock_items?: { name: string };
  profiles?: { name: string };
}

export default function Stock() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const { toast } = useToast();

  useEffect(() => {
    loadStockItems();
  }, []);

  const loadStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStockItems(data || []);
    } catch (error) {
      console.error('Error loading stock items:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os itens do estoque."
      });
    } finally {
      setLoading(false);
    }
  };

  // Função loadStockMovements removida temporariamente - tabela stock_movements será criada futuramente

  const getLowStockItems = () => {
    return stockItems.filter(item => item.current_quantity <= item.minimum_quantity);
  };

  const getStockStatus = (item: StockItem) => {
    if (item.current_quantity === 0) return { label: 'Esgotado', variant: 'destructive' as const };
    if (item.current_quantity <= item.minimum_quantity) return { label: 'Baixo', variant: 'secondary' as const };
    return { label: 'Normal', variant: 'default' as const };
  };

  if (loading) {
    return <div className="p-6">Carregando estoque...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockItems.length}</div>
            <p className="text-xs text-muted-foreground">Itens cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{getLowStockItems().length}</div>
            <p className="text-xs text-muted-foreground">Itens com estoque baixo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stockItems.reduce((sum, item) => sum + (item.current_quantity * item.unit_cost), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Valor do estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
            <p className="text-xs text-muted-foreground">Últimas 100 movimentações</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Estoque Baixo */}
      {getLowStockItems().length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Itens com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getLowStockItems().map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="secondary">
                    {item.current_quantity} {item.unit} restantes
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Itens em Estoque
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movements' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Movimentações
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'items' && (
        <Card>
          <CardHeader>
            <CardTitle>Itens em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockItems.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.current_quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>R$ {item.unit_cost.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>{item.location || '-'}</TableCell>
                       <TableCell>
                         <StockItemActions 
                           item={item} 
                           onUpdate={loadStockItems}
                         />
                       </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {format(new Date(movement.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{movement.stock_items?.name}</TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'in' ? 'default' : 'secondary'}>
                        {movement.type === 'in' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.quantity}</TableCell>
                    <TableCell>{movement.reason || '-'}</TableCell>
                    <TableCell>{movement.profiles?.name || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}