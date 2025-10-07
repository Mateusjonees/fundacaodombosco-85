import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Building2, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UnitData {
  unit: string;
  receita: number;
  despesa: number;
  saldo: number;
}

const COLORS = {
  madre: '#0088FE',
  floresta: '#00C49F',
  receita: '#00C49F',
  despesa: '#FF8042'
};

export const CostCenterAnalysis = () => {
  const [unitData, setUnitData] = useState<UnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('current'); // current, last_month, year
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    loadCostCenterData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        };
      case 'year':
        return {
          start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
          end: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd')
        };
      default: // current month
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
    }
  };

  const loadCostCenterData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Buscar dados financeiros por unidade
      const units: UnitData[] = [];
      const categories: Record<string, number> = {};

      for (const unit of ['madre', 'floresta']) {
        // Receitas por unidade
        const { data: revenues } = await supabase
          .from('financial_records')
          .select('amount, category')
          .eq('type', 'income')
          .gte('date', start)
          .lte('date', end);

        // Despesas por unidade
        const { data: expenses } = await supabase
          .from('financial_records')
          .select('amount, category')
          .eq('type', 'expense')
          .gte('date', start)
          .lte('date', end);

        // Também buscar de client_payments se tiver unidade
        const { data: clientPayments } = await supabase
          .from('client_payments')
          .select('amount_paid, unit')
          .eq('unit', unit)
          .gte('due_date', start)
          .lte('due_date', end);

        const receita = (revenues?.reduce((sum, r) => sum + Number(r.amount), 0) || 0) +
                       (clientPayments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0);
        const despesa = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        units.push({
          unit: unit.charAt(0).toUpperCase() + unit.slice(1),
          receita,
          despesa,
          saldo: receita - despesa
        });

        // Agregar por categoria
        revenues?.forEach(r => {
          categories[r.category] = (categories[r.category] || 0) + Number(r.amount);
        });
      }

      setUnitData(units);

      // Converter categorias para array para o gráfico
      const categoryArray = Object.entries(categories).map(([name, value]) => ({
        name: getCategoryLabel(name),
        value
      }));
      setCategoryData(categoryArray);

    } catch (error) {
      console.error('Erro ao carregar centro de custo:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      consultation: 'Consultas',
      supplies: 'Materiais',
      rent: 'Aluguel',
      utilities: 'Utilidades',
      salary: 'Salários',
      professional_payment: 'Pagamento Profissionais',
      foundation_revenue: 'Receita Fundação',
      other: 'Outros'
    };
    return labels[category] || category;
  };

  if (loading) {
    return <div className="text-center p-8">Carregando análise...</div>;
  }

  const totalReceita = unitData.reduce((sum, u) => sum + u.receita, 0);
  const totalDespesa = unitData.reduce((sum, u) => sum + u.despesa, 0);
  const totalSaldo = totalReceita - totalDespesa;

  return (
    <div className="space-y-6">
      {/* Seletor de período */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mês Atual</SelectItem>
            <SelectItem value="last_month">Mês Anterior</SelectItem>
            <SelectItem value="year">Ano Completo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalSaldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="units" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="units">Por Unidade</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={unitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="unit" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill={COLORS.receita} />
                  <Bar dataKey="despesa" name="Despesa" fill={COLORS.despesa} />
                  <Bar dataKey="saldo" name="Saldo" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detalhamento por unidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unitData.map((unit) => (
              <Card key={unit.unit}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Unidade {unit.unit}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Receita:</span>
                    <span className="font-bold text-green-600">
                      R$ {unit.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Despesa:</span>
                    <span className="font-bold text-red-600">
                      R$ {unit.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-bold">Saldo:</span>
                    <span className={`font-bold ${unit.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {unit.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: R$ ${entry.value.toFixed(2)}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
