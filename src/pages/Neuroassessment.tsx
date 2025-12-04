import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, FileDown, FileSpreadsheet, Calendar, Filter, Users, Clock, UserCheck, UserX, Pencil } from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MaterialUsed {
  stock_item_id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface NeuroClient {
  id: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  neuro_test_start_date: string | null;
  neuro_report_deadline: string | null;
  neuro_report_file_path: string | null;
  neuro_diagnosis_suggestion: string | null;
  neuro_diagnosis_by: string | null;
  neuro_tests_applied: string[] | null;
  neuro_socioeconomic: string | null;
  neuro_final_diagnosis: string | null;
  neuro_completed_date: string | null;
  unit: string | null;
  total_hours?: number;
  materials_used?: string[];
}

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#6b7280'];
const STATUS_COLORS = ['#22c55e', '#f59e0b'];

export default function Neuroassessment() {
  const [clients, setClients] = useState<NeuroClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportStatus, setReportStatus] = useState<string>('all');
  const [editingClient, setEditingClient] = useState<NeuroClient | null>(null);
  const [editForm, setEditForm] = useState({
    gender: '',
    neuro_test_start_date: '',
    neuro_diagnosis_suggestion: '',
    neuro_diagnosis_by: '',
    neuro_report_delivered: false,
    neuro_tests_applied: '',
    neuro_socioeconomic: '',
    neuro_final_diagnosis: '',
    neuro_completed_date: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const openEditDialog = (client: NeuroClient) => {
    setEditingClient(client);
    setEditForm({
      gender: client.gender || '',
      neuro_test_start_date: client.neuro_test_start_date || '',
      neuro_diagnosis_suggestion: client.neuro_diagnosis_suggestion || '',
      neuro_diagnosis_by: client.neuro_diagnosis_by || '',
      neuro_report_delivered: !!client.neuro_report_file_path,
      neuro_tests_applied: Array.isArray(client.neuro_tests_applied) ? client.neuro_tests_applied.join(', ') : '',
      neuro_socioeconomic: client.neuro_socioeconomic || '',
      neuro_final_diagnosis: client.neuro_final_diagnosis || '',
      neuro_completed_date: client.neuro_completed_date || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;
    
    setSaving(true);
    try {
      const testsArray = editForm.neuro_tests_applied
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const { error } = await supabase
        .from('clients')
        .update({
          gender: editForm.gender || null,
          neuro_test_start_date: editForm.neuro_test_start_date || null,
          neuro_diagnosis_suggestion: editForm.neuro_diagnosis_suggestion || null,
          neuro_diagnosis_by: editForm.neuro_diagnosis_by || null,
          neuro_report_file_path: editForm.neuro_report_delivered ? 'delivered' : null,
          neuro_tests_applied: testsArray.length > 0 ? testsArray : null,
          neuro_socioeconomic: editForm.neuro_socioeconomic || null,
          neuro_final_diagnosis: editForm.neuro_final_diagnosis || null,
          neuro_completed_date: editForm.neuro_completed_date || null
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados de neuroavaliação atualizados!",
      });

      setEditingClient(null);
      loadNeuroClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar os dados.",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadNeuroClients();
  }, [startDate, endDate, reportStatus]);

  const loadNeuroClients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('unit', 'floresta')
        .eq('is_active', true);

      if (startDate) {
        query = query.gte('neuro_test_start_date', startDate);
      }
      if (endDate) {
        query = query.lte('neuro_test_start_date', endDate);
      }

      if (reportStatus === 'pending') {
        query = query.is('neuro_report_file_path', null);
      } else if (reportStatus === 'delivered') {
        query = query.not('neuro_report_file_path', 'is', null);
      }

      const { data: clientsData, error } = await query.order('name');

      if (error) throw error;

      const clientsWithHours = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { data: attendances } = await supabase
            .from('attendance_reports')
            .select('session_duration, materials_used')
            .eq('client_id', client.id)
            .eq('status', 'completed');

          const totalMinutes = attendances?.reduce((sum, att) => sum + (att.session_duration || 0), 0) || 0;
          const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

          // Extrair materiais únicos usados nos atendimentos
          const materialsMap = new Map<string, string>();
          attendances?.forEach(att => {
            if (att.materials_used && Array.isArray(att.materials_used)) {
              (att.materials_used as unknown as MaterialUsed[]).forEach(material => {
                if (material.name && !materialsMap.has(material.name)) {
                  materialsMap.set(material.name, material.name);
                }
              });
            }
          });
          const uniqueMaterials = Array.from(materialsMap.values());

          return {
            ...client,
            neuro_tests_applied: client.neuro_tests_applied as string[] | null,
            neuro_diagnosis_by: (client as any).neuro_diagnosis_by || null,
            neuro_final_diagnosis: (client as any).neuro_final_diagnosis || null,
            neuro_completed_date: (client as any).neuro_completed_date || null,
            total_hours: totalHours,
            materials_used: uniqueMaterials
          };
        })
      );

      setClients(clientsWithHours);
    } catch (error) {
      console.error('Error loading neuro clients:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados de neuroavaliação.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas calculadas
  const stats = {
    total: clients.length,
    pending: clients.filter(c => !c.neuro_report_file_path).length,
    delivered: clients.filter(c => c.neuro_report_file_path).length,
    totalHours: clients.reduce((sum, c) => sum + (c.total_hours || 0), 0),
    male: clients.filter(c => c.gender === 'masculino').length,
    female: clients.filter(c => c.gender === 'feminino').length,
    other: clients.filter(c => c.gender === 'outro' || c.gender === 'nao-informar' || !c.gender).length
  };

  // Dados para gráficos
  const genderData = [
    { name: 'Masculino', value: stats.male, color: '#3b82f6' },
    { name: 'Feminino', value: stats.female, color: '#ec4899' },
    { name: 'Outro/N.I.', value: stats.other, color: '#6b7280' }
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Entregues', value: stats.delivered, color: '#22c55e' },
    { name: 'Pendentes', value: stats.pending, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Dados socioeconômicos
  const socioData = ['A', 'B', 'C', 'D', 'E'].map(level => ({
    name: `Classe ${level}`,
    value: clients.filter(c => c.neuro_socioeconomic === level).length
  })).filter(d => d.value > 0);

  // Suspeitas de diagnóstico mais comuns
  const diagnosisCount: Record<string, number> = {};
  clients.forEach(c => {
    if (c.neuro_diagnosis_suggestion) {
      const diag = c.neuro_diagnosis_suggestion.trim();
      diagnosisCount[diag] = (diagnosisCount[diag] || 0) + 1;
    }
  });
  const diagnosisData = Object.entries(diagnosisCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const calculateAge = (birthDate: string | null): string => {
    if (!birthDate) return '-';
    try {
      return `${differenceInYears(new Date(), parseISO(birthDate))} anos`;
    } catch {
      return '-';
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const getGenderLabel = (gender: string | null): string => {
    const labels: Record<string, string> = {
      'masculino': 'M',
      'feminino': 'F',
      'outro': 'O',
      'nao-informar': '-'
    };
    return gender ? labels[gender] || '-' : '-';
  };

  const getGenderFull = (gender: string | null): string => {
    const labels: Record<string, string> = {
      'masculino': 'Masculino',
      'feminino': 'Feminino',
      'outro': 'Outro',
      'nao-informar': 'Não informado'
    };
    return gender ? labels[gender] || '-' : '-';
  };

  const getReportStatus = (filePath: string | null): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    return filePath 
      ? { label: 'Entregue', variant: 'default' }
      : { label: 'Pendente', variant: 'secondary' };
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 153);
    doc.text('FUNDAÇÃO DOM BOSCO', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Neuroavaliação', 148, 23, { align: 'center' });
    
    let filterText = 'Período: ';
    if (startDate && endDate) {
      filterText += `${formatDate(startDate)} a ${formatDate(endDate)}`;
    } else if (startDate) {
      filterText += `A partir de ${formatDate(startDate)}`;
    } else if (endDate) {
      filterText += `Até ${formatDate(endDate)}`;
    } else {
      filterText += 'Todos';
    }
    
    if (reportStatus !== 'all') {
      filterText += ` | Status: ${reportStatus === 'pending' ? 'Pendente' : 'Entregue'}`;
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(filterText, 148, 30, { align: 'center' });

    // Resumo estatístico
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const summaryText = `Total: ${stats.total} | Masculino: ${stats.male} | Feminino: ${stats.female} | Pendentes: ${stats.pending} | Entregues: ${stats.delivered} | Horas: ${stats.totalHours.toFixed(1)}h`;
    doc.text(summaryText, 148, 36, { align: 'center' });

    const tableData = clients.map(client => [
      client.name,
      formatDate(client.birth_date),
      getGenderLabel(client.gender),
      formatDate(client.neuro_test_start_date),
      client.neuro_diagnosis_suggestion || '-',
      client.neuro_diagnosis_by || '-',
      getReportStatus(client.neuro_report_file_path).label,
      client.neuro_final_diagnosis || '-',
      formatDate(client.neuro_completed_date),
      client.total_hours ? `${client.total_hours}h` : '-',
      client.neuro_socioeconomic || '-'
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Nome', 'Nasc.', 'Sexo', 'Início', 'Suspeita Dx', 'Encaminhado', 'Status', 'Resultado', 'Finalizado', 'Horas', 'Socio.']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 102, 153],
        textColor: 255,
        fontSize: 7,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 6
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 20 },
        2: { cellWidth: 10 },
        3: { cellWidth: 20 },
        4: { cellWidth: 28 },
        5: { cellWidth: 25 },
        6: { cellWidth: 15 },
        7: { cellWidth: 38 },
        8: { cellWidth: 20 },
        9: { cellWidth: 12 },
        10: { cellWidth: 12 }
      },
      margin: { left: 10, right: 10 }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Total de Pacientes: ${clients.length}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 148, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`relatorio-neuroavaliacao-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: "PDF Exportado",
      description: "Relatório de neuroavaliação exportado com sucesso!",
    });
  };

  const exportToExcel = () => {
    const excelData = clients.map(client => ({
      'Nome do Paciente': client.name,
      'Data de Nascimento': formatDate(client.birth_date),
      'Sexo': getGenderFull(client.gender),
      'Início dos Testes': formatDate(client.neuro_test_start_date),
      'Previsão Laudo': formatDate(client.neuro_report_deadline),
      'Suspeita de Diagnóstico': client.neuro_diagnosis_suggestion || '-',
      'Encaminhado por': client.neuro_diagnosis_by || '-',
      'Status do Laudo': getReportStatus(client.neuro_report_file_path).label,
      'Resultado do Laudo': client.neuro_final_diagnosis || '-',
      'Data Finalização': formatDate(client.neuro_completed_date),
      'Materiais Utilizados': client.materials_used && client.materials_used.length > 0 ? client.materials_used.join(', ') : '-',
      'Horas Totais': client.total_hours || 0,
      'Socioeconômico': client.neuro_socioeconomic || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Neuroavaliação');
    
    ws['!cols'] = [
      { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 15 }
    ];

    XLSX.writeFile(wb, `relatorio-neuroavaliacao-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({
      title: "Excel Exportado",
      description: "Relatório de neuroavaliação exportado com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Neuroavaliação</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF} disabled={clients.length === 0}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel} disabled={clients.length === 0}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reportStatus">Status do Laudo</Label>
              <Select value={reportStatus} onValueChange={setReportStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setReportStatus('all');
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileDown className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Horas</p>
                <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-sky-500/10 to-sky-600/5 border-sky-200 dark:border-sky-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-sky-500" />
              <div>
                <p className="text-sm text-muted-foreground">Masculino</p>
                <p className="text-2xl font-bold">{stats.male}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserX className="h-8 w-8 text-pink-500" />
              <div>
                <p className="text-sm text-muted-foreground">Feminino</p>
                <p className="text-2xl font-bold">{stats.female}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gráfico de Sexo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribuição por Sexo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status dos Laudos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico Socioeconômico */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nível Socioeconômico</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={socioData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Diagnósticos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Suspeitas de Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={diagnosisData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Pacientes */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Neuroavaliação</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum paciente encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Paciente</TableHead>
                    <TableHead>Nascimento</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Início Testes</TableHead>
                    <TableHead>Suspeita de Diagnóstico</TableHead>
                    <TableHead>Encaminhado por</TableHead>
                    <TableHead>Status Laudo</TableHead>
                    <TableHead>Resultado do Laudo</TableHead>
                    <TableHead>Data Finalização</TableHead>
                    <TableHead>Materiais Utilizados</TableHead>
                    <TableHead>Horas Totais</TableHead>
                    <TableHead>Socioeconômico</TableHead>
                    <TableHead className="w-[60px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => {
                    const status = getReportStatus(client.neuro_report_file_path);
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          {formatDate(client.birth_date)}
                          <span className="text-muted-foreground text-xs block">
                            {calculateAge(client.birth_date)}
                          </span>
                        </TableCell>
                        <TableCell>{getGenderFull(client.gender)}</TableCell>
                        <TableCell>{formatDate(client.neuro_test_start_date)}</TableCell>
                        <TableCell>{client.neuro_diagnosis_suggestion || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{client.neuro_diagnosis_by || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          {client.neuro_final_diagnosis || '-'}
                        </TableCell>
                        <TableCell>{formatDate(client.neuro_completed_date)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {client.materials_used && client.materials_used.length > 0
                            ? client.materials_used.join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell>{client.total_hours ? `${client.total_hours}h` : '-'}</TableCell>
                        <TableCell>{client.neuro_socioeconomic || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(client)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Neuroavaliação - {editingClient?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-gender">Sexo</Label>
                <Select
                  value={editForm.gender}
                  onValueChange={(value) => setEditForm({ ...editForm, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="nao-informar">Não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-start-date">Início dos Testes</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editForm.neuro_test_start_date}
                  onChange={(e) => setEditForm({ ...editForm, neuro_test_start_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-diagnosis">Suspeita de Diagnóstico</Label>
              <Input
                id="edit-diagnosis"
                value={editForm.neuro_diagnosis_suggestion}
                onChange={(e) => setEditForm({ ...editForm, neuro_diagnosis_suggestion: e.target.value })}
                placeholder="Ex: TDAH, TEA, Dislexia..."
              />
            </div>
            <div>
              <Label htmlFor="edit-diagnosis-by">Encaminhado por</Label>
              <Input
                id="edit-diagnosis-by"
                value={editForm.neuro_diagnosis_by}
                onChange={(e) => setEditForm({ ...editForm, neuro_diagnosis_by: e.target.value })}
                placeholder="Nome do médico/profissional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-socio">Nível Socioeconômico</Label>
                <Select
                  value={editForm.neuro_socioeconomic}
                  onValueChange={(value) => setEditForm({ ...editForm, neuro_socioeconomic: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="A">Classe A</SelectItem>
                    <SelectItem value="B">Classe B</SelectItem>
                    <SelectItem value="C">Classe C</SelectItem>
                    <SelectItem value="D">Classe D</SelectItem>
                    <SelectItem value="E">Classe E</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status do Laudo</Label>
                <Select
                  value={editForm.neuro_report_delivered ? 'delivered' : 'pending'}
                  onValueChange={(value) => setEditForm({ ...editForm, neuro_report_delivered: value === 'delivered' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-final-diagnosis">Resultado do Laudo (Diagnóstico Final)</Label>
              <Textarea
                id="edit-final-diagnosis"
                value={editForm.neuro_final_diagnosis}
                onChange={(e) => setEditForm({ ...editForm, neuro_final_diagnosis: e.target.value })}
                placeholder="Diagnóstico final após avaliação..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-completed-date">Data de Finalização do Laudo</Label>
              <Input
                id="edit-completed-date"
                type="date"
                value={editForm.neuro_completed_date}
                onChange={(e) => setEditForm({ ...editForm, neuro_completed_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-tests">Testes Aplicados (separados por vírgula)</Label>
              <Textarea
                id="edit-tests"
                value={editForm.neuro_tests_applied}
                onChange={(e) => setEditForm({ ...editForm, neuro_tests_applied: e.target.value })}
                placeholder="WISC-IV, Bender, HTP..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
