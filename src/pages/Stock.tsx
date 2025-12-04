import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useCustomPermissions } from '@/hooks/useCustomPermissions';
import { Package, Plus, AlertTriangle, TrendingUp, ArrowLeftRight, Search, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StockItemActions from '@/components/StockItemActions';
import AddStockItemDialog from '@/components/AddStockItemDialog';
import { StockMovementDialog } from '@/components/StockMovementDialog';
import { StockMovementHistory } from '@/components/StockMovementHistory';
import { ImportExcelStockDialog } from '@/components/ImportExcelStockDialog';
import { importAllStockItems } from '@/utils/importStockData';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

interface Client {
  id: string;
  name: string;
}

export default function Stock() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { userRole, loading: roleLoading } = useRolePermissions();
  const customPermissions = useCustomPermissions();

  // Verificar acesso ao estoque
  useEffect(() => {
    if (roleLoading || customPermissions.loading) return;
    
    const hasAccess = userRole === 'director' || 
                      userRole === 'financeiro' ||
                      userRole === 'coordinator_madre' ||
                      userRole === 'coordinator_floresta' ||
                      customPermissions.hasPermission('view_stock');
    
    console.log('🔐 Verificação de acesso - Stock:', {
      userRole,
      hasCustomPermission: customPermissions.hasPermission('view_stock'),
      hasAccess
    });
    
    if (!hasAccess) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para acessar o estoque.",
      });
      window.history.back();
    }
  }, [roleLoading, customPermissions.loading, userRole]);

  useEffect(() => {
    loadStockItems();
    loadClients();
  }, []);

  // Auto-import stock items if empty
  useEffect(() => {
    if (!loading && stockItems.length === 0) {
      handleImportStock();
    }
  }, [loading, stockItems.length]);

  const loadStockItems = async () => {
    try {
      console.log('Loading stock items...');
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading stock items:', error);
        throw error;
      }
      
      console.log('Stock items loaded:', data);
      
      // Garantir que os dados sempre tenham valores válidos para o Select
      // mas sem sobrescrever valores existentes
      const processedData = (data || []).map(item => ({
        ...item,
        category: item.category || 'Outros',
        unit: item.unit || 'Unidade'
      }));
      
      console.log('Processed stock items:', processedData);
      setStockItems(processedData);
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

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleImportStock = async () => {
    setIsImporting(true);
    try {
      const { importAllItemsFromList } = await import('@/utils/importStockFromList');
      const result = await importAllItemsFromList();
      
      toast({
        title: "Importação concluída!",
        description: `${result.imported} itens importados com sucesso. ${result.errors > 0 ? `${result.errors} erros encontrados.` : ''}`,
        variant: result.errors > 0 ? "destructive" : "default"
      });

      if (result.imported > 0) {
        loadStockItems();
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação dos itens.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getLowStockItems = () => {
    return stockItems.filter(item => item.current_quantity <= item.minimum_quantity);
  };

  const getStockStatus = (item: StockItem) => {
    if (item.current_quantity === 0) return { label: 'Esgotado', variant: 'destructive' as const };
    if (item.current_quantity <= item.minimum_quantity) return { label: 'Baixo', variant: 'secondary' as const };
    return { label: 'Normal', variant: 'default' as const };
  };

  const getFilteredItems = () => {
    if (!searchTerm.trim()) return stockItems;
    
    return stockItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const filteredItems = getFilteredItems();
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const exportShoppingListPDF = () => {
    const itemsToExport = stockItems.filter(item => selectedItems.has(item.id));
    
    if (itemsToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para exportar.",
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Compras - Estoque', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fundação Dom Bosco - ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 28, { align: 'center' });
    
    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Itens: ${itemsToExport.length}`, 14, 45);
    
    const totalEstimated = itemsToExport.reduce((sum, item) => {
      const quantityToBuy = Math.max(0, item.minimum_quantity - item.current_quantity + 5);
      return sum + (quantityToBuy * item.unit_cost);
    }, 0);
    
    doc.text(`Valor Estimado: R$ ${totalEstimated.toFixed(2)}`, 14, 52);

    // Group by category
    const groupedItems: { [key: string]: StockItem[] } = {};
    itemsToExport.forEach(item => {
      const category = item.category || 'Outros';
      if (!groupedItems[category]) {
        groupedItems[category] = [];
      }
      groupedItems[category].push(item);
    });

    // Table data
    const tableData: any[] = [];
    Object.keys(groupedItems).sort().forEach(category => {
      // Category header row
      tableData.push([
        { content: category.toUpperCase(), colSpan: 6, styles: { fillColor: [229, 231, 235], fontStyle: 'bold', fontSize: 10 } }
      ]);
      
      groupedItems[category].forEach((item, index) => {
        const quantityToBuy = Math.max(0, item.minimum_quantity - item.current_quantity + 5);
        const estimatedCost = quantityToBuy * item.unit_cost;
        
        tableData.push([
          `${index + 1}. ${item.name}`,
          `${item.current_quantity} ${item.unit}`,
          `${item.minimum_quantity} ${item.unit}`,
          `${quantityToBuy} ${item.unit}`,
          `R$ ${item.unit_cost.toFixed(2)}`,
          `R$ ${estimatedCost.toFixed(2)}`
        ]);
      });
    });

    // Generate table
    (doc as any).autoTable({
      startY: 60,
      head: [['Item', 'Qtd. Atual', 'Qtd. Mínima', 'Comprar', 'Valor Unit.', 'Valor Est.']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      },
      didDrawPage: (data: any) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });

    doc.save(`lista-compras-estoque-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: "PDF gerado com sucesso!",
      description: `Lista de compras com ${itemsToExport.length} itens exportada.`,
    });
  };

  if (loading) {
    return <div className="p-6">Carregando estoque...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        <div className="flex gap-2">
          <Button 
            className="gap-2" 
            variant="outline"
            onClick={handleImportStock}
            disabled={isImporting}
          >
            <Package className="h-4 w-4" />
            {isImporting ? "Importando..." : "Importar Itens da Planilha"}
          </Button>
          <Button 
            className="gap-2" 
            variant="outline"
            onClick={() => setIsMovementDialogOpen(true)}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Nova Movimentação
          </Button>
          <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Item
          </Button>
        </div>
        
        <AddStockItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onUpdate={loadStockItems}
        />
        
        <StockMovementDialog
          open={isMovementDialogOpen}
          onOpenChange={setIsMovementDialogOpen}
          stockItems={stockItems}
          clients={clients}
          onMovementCreated={loadStockItems}
        />
        
        <ImportExcelStockDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImportComplete={loadStockItems}
        />
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
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Sistema de rastreamento</p>
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
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <CardTitle>Itens em Estoque</CardTitle>
                {selectedItems.size > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {selectedItems.size} selecionado(s)
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedItems.size > 0 && (
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={exportShoppingListPDF}
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar Lista de Compras
                  </Button>
                )}
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, categoria, localização..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={getFilteredItems().length > 0 && selectedItems.size === getFilteredItems().length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
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
                {getFilteredItems().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {searchTerm ? 'Nenhum item encontrado com os termos de busca.' : 'Nenhum item cadastrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredItems().map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id} className={selectedItems.has(item.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                          />
                        </TableCell>
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
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'movements' && (
        <StockMovementHistory />
      )}
    </div>
  );
}