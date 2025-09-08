import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Package, AlertTriangle, TrendingUp, TrendingDown, Edit } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  current_quantity: number;
  minimum_quantity: number;
  unit: string;
  cost_per_unit?: number;
  supplier?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface StockMovement {
  id: string;
  stock_item_id: string;
  type: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reason?: string;
  created_by: string;
  date: string;
  stock_items?: { name: string };
  profiles?: { name: string };
}

export default function Stock() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    current_quantity: '',
    minimum_quantity: '',
    unit: '',
    cost_per_unit: '',
    supplier: '',
    description: ''
  });

  const [newMovement, setNewMovement] = useState({
    stock_item_id: '',
    type: 'in',
    quantity: '',
    unit_cost: '',
    reason: ''
  });

  useEffect(() => {
    loadStockItems();
    loadMovements();
  }, []);

  const loadStockItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setStockItems(data || []);
    } catch (error) {
      console.error('Error loading stock items:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o estoque.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          stock_items (name),
          profiles (name)
        `)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error loading stock movements:', error);
    }
  };

  const handleCreateItem = async () => {
    try {
      const { error } = await supabase
        .from('stock_items')
        .insert([{
          ...newItem,
          current_quantity: parseInt(newItem.current_quantity),
          minimum_quantity: parseInt(newItem.minimum_quantity),
          cost_per_unit: newItem.cost_per_unit ? parseFloat(newItem.cost_per_unit) : null
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item adicionado ao estoque com sucesso!",
      });
      
      setIsItemDialogOpen(false);
      setNewItem({
        name: '',
        category: '',
        current_quantity: '',
        minimum_quantity: '',
        unit: '',
        cost_per_unit: '',
        supplier: '',
        description: ''
      });
      loadStockItems();
    } catch (error) {
      console.error('Error creating stock item:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o item ao estoque.",
      });
    }
  };

  const handleCreateMovement = async () => {
    try {
      // Get current user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profileData) throw new Error('Profile not found');

      const { error } = await supabase
        .from('stock_movements')
        .insert([{
          ...newMovement,
          quantity: parseInt(newMovement.quantity),
          unit_cost: newMovement.unit_cost ? parseFloat(newMovement.unit_cost) : null,
          total_cost: newMovement.unit_cost ? parseFloat(newMovement.unit_cost) * parseInt(newMovement.quantity) : null,
          created_by: profileData.id,
          date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      // Update stock quantity
      const selectedItem = stockItems.find(item => item.id === newMovement.stock_item_id);
      if (selectedItem) {
        const quantityChange = newMovement.type === 'in' 
          ? parseInt(newMovement.quantity) 
          : -parseInt(newMovement.quantity);
        
        await supabase
          .from('stock_items')
          .update({ 
            current_quantity: selectedItem.current_quantity + quantityChange,
            updated_at: new Date().toISOString()
          })
          .eq('id', newMovement.stock_item_id);
      }

      toast({
        title: "Sucesso",
        description: "Movimentação de estoque registrada com sucesso!",
      });
      
      setIsMovementDialogOpen(false);
      setNewMovement({
        stock_item_id: '',
        type: 'in',
        quantity: '',
        unit_cost: '',
        reason: ''
      });
      loadStockItems();
      loadMovements();
    } catch (error) {
      console.error('Error creating stock movement:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar a movimentação.",
      });
    }
  };

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = filteredItems.filter(item => item.current_quantity <= item.minimum_quantity);
  const totalValue = filteredItems.reduce((sum, item) => 
    sum + (item.current_quantity * (item.cost_per_unit || 0)), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Estoque</h1>
        <div className="flex gap-2">
          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Movimentação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_item_id">Item</Label>
                  <Select value={newMovement.stock_item_id} onValueChange={(value) => setNewMovement({ ...newMovement, stock_item_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (Atual: {item.current_quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Movimentação</Label>
                  <Select value={newMovement.type} onValueChange={(value) => setNewMovement({ ...newMovement, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newMovement.quantity}
                    onChange={(e) => setNewMovement({ ...newMovement, quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Custo Unitário (R$)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={newMovement.unit_cost}
                    onChange={(e) => setNewMovement({ ...newMovement, unit_cost: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    value={newMovement.reason}
                    onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
                    placeholder="Motivo da movimentação"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateMovement} disabled={!newMovement.stock_item_id || !newMovement.quantity}>
                  Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Item ao Estoque</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Item *</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Digite o nome do item"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical_supplies">Material Médico</SelectItem>
                      <SelectItem value="office_supplies">Material de Escritório</SelectItem>
                      <SelectItem value="cleaning">Limpeza</SelectItem>
                      <SelectItem value="equipment">Equipamentos</SelectItem>
                      <SelectItem value="medication">Medicamentos</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_quantity">Quantidade Atual *</Label>
                  <Input
                    id="current_quantity"
                    type="number"
                    value={newItem.current_quantity}
                    onChange={(e) => setNewItem({ ...newItem, current_quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_quantity">Quantidade Mínima *</Label>
                  <Input
                    id="minimum_quantity"
                    type="number"
                    value={newItem.minimum_quantity}
                    onChange={(e) => setNewItem({ ...newItem, minimum_quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade</SelectItem>
                      <SelectItem value="cx">Caixa</SelectItem>
                      <SelectItem value="kg">Quilograma</SelectItem>
                      <SelectItem value="l">Litro</SelectItem>
                      <SelectItem value="m">Metro</SelectItem>
                      <SelectItem value="pct">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_per_unit">Custo Unitário (R$)</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    value={newItem.cost_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, cost_per_unit: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input
                    id="supplier"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Descrição do item, especificações, etc."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateItem} disabled={!newItem.name || !newItem.current_quantity || !newItem.minimum_quantity}>
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="low-stock">Estoque Baixo</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Itens</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Carregando itens...</p>
              ) : filteredItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {searchTerm ? 'Nenhum item encontrado.' : 'Nenhum item no estoque.'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Custo Unitário</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.current_quantity}</TableCell>
                        <TableCell>{item.minimum_quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          {item.cost_per_unit 
                            ? `R$ ${item.cost_per_unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{item.supplier || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.current_quantity <= item.minimum_quantity ? "destructive" : "default"}
                          >
                            {item.current_quantity <= item.minimum_quantity ? 'Baixo' : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Itens com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum item com estoque baixo.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Quantidade Atual</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Diferença</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-red-600">{item.current_quantity}</TableCell>
                        <TableCell>{item.minimum_quantity}</TableCell>
                        <TableCell className="text-red-600">
                          -{item.minimum_quantity - item.current_quantity}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Reabastecer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma movimentação registrada.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Custo Unitário</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{movement.stock_items?.name}</TableCell>
                        <TableCell>
                          <Badge variant={movement.type === 'in' ? "default" : "destructive"}>
                            {movement.type === 'in' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell className={movement.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                        </TableCell>
                        <TableCell>
                          {movement.unit_cost 
                            ? `R$ ${movement.unit_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {movement.total_cost 
                            ? `R$ ${movement.total_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{movement.profiles?.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {movement.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}