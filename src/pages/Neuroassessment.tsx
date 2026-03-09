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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NeuroDeadlineAlerts } from '@/components/NeuroDeadlineAlerts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, FileDown, FileSpreadsheet, Calendar, Filter, Users, Clock, UserCheck, UserX, Pencil, ChevronDown, ChevronRight, MoreHorizontal, History, Calculator, BarChart3 } from 'lucide-react';
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
  neuro_patient_code: string | null;
  neuro_relevant_history: string | null;
  neuro_diagnostic_agreement: string | null;
  neuro_divergence_type: string | null;
  neuro_observations: string | null;
  unit: string | null;
  total_hours?: number;
  materials_used?: string[];
}

export default function Neuroassessment() {
  const [clients, setClients] = useState<NeuroClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportStatus, setReportStatus] = useState<string>('all');
  const [editingClient, setEditingClient] = useState<NeuroClient | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({
    neuro_patient_code: '',
    gender: '',
    neuro_test_start_date: '',
    neuro_report_deadline: '',
    neuro_diagnosis_suggestion: '',
    neuro_diagnosis_by: '',
    neuro_relevant_history: '',
    neuro_report_delivered: false,
    neuro_tests_applied: '',
    neuro_socioeconomic: '',
    neuro_final_diagnosis: '',
    neuro_completed_date: '',
    neuro_diagnostic_agreement: '',
    neuro_divergence_type: '',
    neuro_observations: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEditDialog = (client: NeuroClient) => {
    setEditingClient(client);
    setEditForm({
      neuro_patient_code: client.neuro_patient_code || '',
      gender: client.gender || '',
      neuro_test_start_date: client.neuro_test_start_date || '',
      neuro_report_deadline: client.neuro_report_deadline || '',
      neuro_diagnosis_suggestion: client.neuro_diagnosis_suggestion || '',
      neuro_diagnosis_by: client.neuro_diagnosis_by || '',
      neuro_relevant_history: client.neuro_relevant_history || '',
      neuro_report_delivered: !!client.neuro_report_file_path,
      neuro_tests_applied: Array.isArray(client.neuro_tests_applied) ? client.neuro_tests_applied.join(', ') : '',
      neuro_socioeconomic: client.neuro_socioeconomic || '',
      neuro_final_diagnosis: client.neuro_final_diagnosis || '',
      neuro_completed_date: client.neuro_completed_date || '',
      neuro_diagnostic_agreement: client.neuro_diagnostic_agreement || '',
      neuro_divergence_type: client.neuro_divergence_type || '',
      neuro_observations: client.neuro_observations || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;
    setSaving(true);
    try {
      const testsArray = editForm.neuro_tests_applied.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const { error } = await supabase
        .from('clients')
        .update({
          neuro_patient_code: editForm.neuro_patient_code || null,
          gender: editForm.gender || null,
          neuro_test_start_date: editForm.neuro_test_start_date || null,
          neuro_report_deadline: editForm.neuro_report_deadline || null,
          neuro_diagnosis_suggestion: editForm.neuro_diagnosis_suggestion || null,
          neuro_diagnosis_by: editForm.neuro_diagnosis_by || null,
          neuro_relevant_history: editForm.neuro_relevant_history || null,
          neuro_report_file_path: editForm.neuro_report_delivered ? 'delivered' : null,
          neuro_tests_applied: testsArray.length > 0 ? testsArray : null,
          neuro_socioeconomic: editForm.neuro_socioeconomic || null,
          neuro_final_diagnosis: editForm.neuro_final_diagnosis || null,
          neuro_completed_date: editForm.neuro_completed_date || null,
          neuro_diagnostic_agreement: editForm.neuro_diagnostic_agreement || null,
          neuro_divergence_type: editForm.neuro_divergence_type || null,
          neuro_observations: editForm.neuro_observations || null
        })
        .eq('id', editingClient.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Dados de neuroavaliação atualizados!" });
      setEditingClient(null);
      loadNeuroClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar os dados." });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { loadNeuroClients(); }, [startDate, endDate, reportStatus]);

  const loadNeuroClients = async () => {
    setLoading(true);
    try {
      let query = supabase.from('clients').select('*').eq('unit', 'floresta');
      if (startDate) query = query.gte('neuro_test_start_date', startDate);
      if (endDate) query = query.lte('neuro_test_start_date', endDate);
      if (reportStatus === 'pending') query = query.is('neuro_report_file_path', null);
      else if (reportStatus === 'delivered') query = query.not('neuro_report_file_path', 'is', null);

      const { data: clientsData, error } = await query.order('name');
      if (error) throw error;

      const clientsWithHours = await Promise.all(
        (clientsData || []).map(async (client, index) => {
          const { data: attendances } = await supabase
            .from('attendance_reports')
            .select('session_duration, materials_used')
            .eq('client_id', client.id)
            .eq('status', 'completed');

          const totalMinutes = attendances?.reduce((sum, att) => sum + (att.session_duration || 0), 0) || 0;
          const materialsMap = new Map<string, string>();
          attendances?.forEach(att => {
            if (att.materials_used && Array.isArray(att.materials_used)) {
              (att.materials_used as unknown as MaterialUsed[]).forEach(material => {
                if (material.name) materialsMap.set(material.name, material.name);
              });
            }
          });

          return {
            ...client,
            neuro_tests_applied: client.neuro_tests_applied as string[] | null,
            neuro_diagnosis_by: (client as any).neuro_diagnosis_by || null,
            neuro_final_diagnosis: (client as any).neuro_final_diagnosis || null,
            neuro_completed_date: (client as any).neuro_completed_date || null,
            neuro_patient_code: (client as any).neuro_patient_code || `PC${String(index + 1).padStart(2, '0')}`,
            neuro_relevant_history: (client as any).neuro_relevant_history || null,
            neuro_diagnostic_agreement: (client as any).neuro_diagnostic_agreement || null,
            neuro_divergence_type: (client as any).neuro_divergence_type || null,
            neuro_observations: (client as any).neuro_observations || null,
            total_hours: Math.round((totalMinutes / 60) * 10) / 10,
            materials_used: Array.from(materialsMap.values())
          };
        })
      );

      setClients(clientsWithHours);
    } catch (error) {
      console.error('Error loading neuro clients:', error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os dados de neuroavaliação." });
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas
  const stats = {
    total: clients.length,
    pending: clients.filter(c => !c.neuro_report_file_path).length,
    delivered: clients.filter(c => c.neuro_report_file_path).length,
    totalHours: clients.reduce((sum, c) => sum + (c.total_hours || 0), 0),
    male: clients.filter(c => c.gender === 'masculino').length,
    female: clients.filter(c => c.gender === 'feminino').length,
    other: clients.filter(c => c.gender === 'outro' || c.gender === 'nao-informar' || !c.gender).length
  };

  const genderData = [
    { name: 'Masculino', value: stats.male, color: '#3b82f6' },
    { name: 'Feminino', value: stats.female, color: '#ec4899' },
    { name: 'Outro/N.I.', value: stats.other, color: '#6b7280' }
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Entregues', value: stats.delivered, color: '#22c55e' },
    { name: 'Pendentes', value: stats.pending, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  const socioData = ['A', 'B', 'C', 'D', 'E'].map(level => ({
    name: `Classe ${level}`,
    value: clients.filter(c => c.neuro_socioeconomic === level).length
  })).filter(d => d.value > 0);

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

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    try { return differenceInYears(new Date(), parseISO(birthDate)); } catch { return null; }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR }); } catch { return '-'; }
  };

  const getGenderFull = (gender: string | null): string => {
    const labels: Record<string, string> = { 'masculino': 'Masculino', 'feminino': 'Feminino', 'outro': 'Outro', 'nao-informar': 'N.I.' };
    return gender ? labels[gender] || '-' : '-';
  };

  const getGenderLabel = (gender: string | null): string => {
    const labels: Record<string, string> = { 'masculino': 'M', 'feminino': 'F', 'outro': 'O', 'nao-informar': '-' };
    return gender ? labels[gender] || '-' : '-';
  };

  const getReportStatus = (filePath: string | null): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    return filePath ? { label: 'Entregue', variant: 'default' } : { label: 'Pendente', variant: 'secondary' };
  };

  const isOverdue = (client: NeuroClient) => {
    if (client.neuro_report_file_path) return false;
    if (!client.neuro_report_deadline) return false;
    return client.neuro_report_deadline < new Date().toISOString().split('T')[0];
  };

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a3');
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 153);
    doc.text('FUNDAÇÃO DOM BOSCO', 210, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Neuroavaliação', 210, 23, { align: 'center' });

    let filterText = 'Período: ';
    if (startDate && endDate) filterText += `${formatDate(startDate)} a ${formatDate(endDate)}`;
    else if (startDate) filterText += `A partir de ${formatDate(startDate)}`;
    else if (endDate) filterText += `Até ${formatDate(endDate)}`;
    else filterText += 'Todos';
    if (reportStatus !== 'all') filterText += ` | Status: ${reportStatus === 'pending' ? 'Pendente' : 'Entregue'}`;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(filterText, 210, 30, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total: ${stats.total} | M: ${stats.male} | F: ${stats.female} | Pendentes: ${stats.pending} | Entregues: ${stats.delivered} | Horas: ${stats.totalHours.toFixed(1)}h`, 210, 36, { align: 'center' });

    const tableData = clients.map(client => [
      client.neuro_patient_code || '-', client.name, formatDate(client.birth_date),
      calculateAge(client.birth_date) !== null ? `${calculateAge(client.birth_date)}` : '-',
      getGenderLabel(client.gender), client.neuro_diagnosis_by || '-', client.neuro_diagnosis_suggestion || '-',
      client.neuro_relevant_history?.substring(0, 30) || '-', formatDate(client.neuro_test_start_date),
      formatDate(client.neuro_report_deadline), formatDate(client.neuro_completed_date),
      client.materials_used?.join(', ')?.substring(0, 30) || '-', client.total_hours ? `${client.total_hours}h` : '-',
      getReportStatus(client.neuro_report_file_path).label, client.neuro_final_diagnosis?.substring(0, 25) || '-',
      client.neuro_diagnostic_agreement || '-', client.neuro_divergence_type?.substring(0, 15) || '-',
      client.neuro_socioeconomic || '-', client.neuro_observations?.substring(0, 20) || '-'
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Cód.', 'Nome', 'Nasc.', 'Idade', 'Sexo', 'Encam.', 'Suspeita', 'Histórico', 'Início', 'Prev.', 'Final.', 'Materiais', 'Horas', 'Status', 'Resultado', 'Concord.', 'Diverg.', 'Socio.', 'Obs.']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 153], textColor: 255, fontSize: 6, fontStyle: 'bold' },
      bodyStyles: { fontSize: 5 },
      columnStyles: {
        0: { cellWidth: 12 }, 1: { cellWidth: 30 }, 2: { cellWidth: 18 }, 3: { cellWidth: 10 },
        4: { cellWidth: 10 }, 5: { cellWidth: 20 }, 6: { cellWidth: 22 }, 7: { cellWidth: 25 },
        8: { cellWidth: 18 }, 9: { cellWidth: 18 }, 10: { cellWidth: 18 }, 11: { cellWidth: 28 },
        12: { cellWidth: 12 }, 13: { cellWidth: 15 }, 14: { cellWidth: 22 }, 15: { cellWidth: 15 },
        16: { cellWidth: 18 }, 17: { cellWidth: 12 }, 18: { cellWidth: 18 }
      },
      margin: { left: 10, right: 10 }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Total: ${clients.length}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i}/${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text(`Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 210, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`relatorio-neuroavaliacao-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: "PDF Exportado", description: "Relatório exportado com sucesso!" });
  };

  const exportToExcel = () => {
    const excelData = clients.map(client => ({
      'Código': client.neuro_patient_code || '-',
      'Nome': client.name,
      'Data de Nascimento': formatDate(client.birth_date),
      'Idade': calculateAge(client.birth_date) ?? '-',
      'Sexo': getGenderFull(client.gender),
      'Encaminhado por': client.neuro_diagnosis_by || '-',
      'Suspeita de Diagnóstico': client.neuro_diagnosis_suggestion || '-',
      'Histórico Relevante': client.neuro_relevant_history || '-',
      'Início dos Testes': formatDate(client.neuro_test_start_date),
      'Previsão de Laudo': formatDate(client.neuro_report_deadline),
      'Data de Finalização': formatDate(client.neuro_completed_date),
      'Materiais/Testes': client.materials_used?.join(', ') || '-',
      'Horas Totais': client.total_hours || 0,
      'Status do Laudo': getReportStatus(client.neuro_report_file_path).label,
      'Resultado': client.neuro_final_diagnosis || '-',
      'Concordância': client.neuro_diagnostic_agreement || '-',
      'Divergência': client.neuro_divergence_type || '-',
      'Socioeconômico': client.neuro_socioeconomic || '-',
      'Observações': client.neuro_observations || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Neuroavaliação');
    ws['!cols'] = [
      { wch: 10 }, { wch: 35 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 25 }, { wch: 25 },
      { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 12 },
      { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 30 }
    ];
    XLSX.writeFile(wb, `relatorio-neuroavaliacao-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: "Excel Exportado", description: "Relatório exportado com sucesso!" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Neuroavaliação</h1>
      </div>

      {/* Alertas de prazo */}
      <NeuroDeadlineAlerts />

      {/* Tabs */}
      <Tabs defaultValue="painel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="painel" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Painel
          </TabsTrigger>
          <TabsTrigger value="pacientes" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Pacientes
          </TabsTrigger>
          <TabsTrigger value="exportar" className="flex items-center gap-1.5">
            <FileDown className="h-3.5 w-3.5" />
            Exportar
          </TabsTrigger>
        </TabsList>

        {/* ===== ABA PAINEL ===== */}
        <TabsContent value="painel" className="space-y-4">
          {/* Stats compactos */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</p>
                    <p className="text-xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entregues</p>
                    <p className="text-xl font-bold">{stats.delivered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-violet-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Horas</p>
                    <p className="text-xl font-bold">{stats.totalHours.toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-sky-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Masculino</p>
                    <p className="text-xl font-bold">{stats.male}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Feminino</p>
                    <p className="text-xl font-bold">{stats.female}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos 2x2 */}
          {clients.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Distribuição por Sexo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={genderData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                        {genderData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Status dos Laudos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Nível Socioeconômico</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Suspeitas de Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
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
        </TabsContent>

        {/* ===== ABA PACIENTES ===== */}
        <TabsContent value="pacientes" className="space-y-4">
          {/* Filtros inline */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={reportStatus} onValueChange={setReportStatus}>
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-9" onClick={() => { setStartDate(''); setEndDate(''); setReportStatus('all'); }}>
              <Filter className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          </div>

          {/* Tabela simplificada com expandir */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum paciente encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30px]" />
                        <TableHead className="whitespace-nowrap text-xs">Código</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Nome</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Idade</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Suspeita</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Status Laudo</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Prazo</TableHead>
                        <TableHead className="w-[60px] text-xs">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => {
                        const status = getReportStatus(client.neuro_report_file_path);
                        const overdue = isOverdue(client);
                        const expanded = expandedRows.has(client.id);

                        return (
                          <>
                            <TableRow key={client.id} className={overdue ? 'bg-destructive/5' : ''}>
                              <TableCell className="p-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRow(client.id)}>
                                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </Button>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{client.neuro_patient_code || '-'}</TableCell>
                              <TableCell className="font-medium text-sm whitespace-nowrap">{client.name}</TableCell>
                              <TableCell className="text-xs">
                                {calculateAge(client.birth_date) !== null ? `${calculateAge(client.birth_date)} anos` : '-'}
                              </TableCell>
                              <TableCell className="text-xs max-w-[140px] truncate">{client.neuro_diagnosis_suggestion || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={overdue ? 'destructive' : status.variant} className="text-[10px]">
                                  {overdue ? 'Vencido' : status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatDate(client.neuro_report_deadline)}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                                    <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                      <Pencil className="h-3.5 w-3.5 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            {/* Linha expandida */}
                            {expanded && (
                              <TableRow key={`${client.id}-details`} className="bg-muted/30">
                                <TableCell colSpan={8} className="p-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Nascimento:</span>
                                      <p className="font-medium">{formatDate(client.birth_date)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Sexo:</span>
                                      <p className="font-medium">{getGenderFull(client.gender)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Encaminhado por:</span>
                                      <p className="font-medium">{client.neuro_diagnosis_by || '-'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Início Testes:</span>
                                      <p className="font-medium">{formatDate(client.neuro_test_start_date)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Data Finalização:</span>
                                      <p className="font-medium">{formatDate(client.neuro_completed_date)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Horas Totais:</span>
                                      <p className="font-medium">{client.total_hours ? `${client.total_hours}h` : '-'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Socioeconômico:</span>
                                      <p className="font-medium">{client.neuro_socioeconomic || '-'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Concordância:</span>
                                      <p className="font-medium">{client.neuro_diagnostic_agreement || '-'}</p>
                                    </div>
                                    {client.neuro_relevant_history && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Histórico Relevante:</span>
                                        <p className="font-medium">{client.neuro_relevant_history}</p>
                                      </div>
                                    )}
                                    {client.neuro_final_diagnosis && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Resultado do Laudo:</span>
                                        <p className="font-medium">{client.neuro_final_diagnosis}</p>
                                      </div>
                                    )}
                                    {client.materials_used && client.materials_used.length > 0 && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Materiais/Testes:</span>
                                        <p className="font-medium">{client.materials_used.join(', ')}</p>
                                      </div>
                                    )}
                                    {client.neuro_divergence_type && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Divergência:</span>
                                        <p className="font-medium">{client.neuro_divergence_type}</p>
                                      </div>
                                    )}
                                    {client.neuro_observations && (
                                      <div className="col-span-2 md:col-span-4">
                                        <span className="text-muted-foreground">Observações:</span>
                                        <p className="font-medium">{client.neuro_observations}</p>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ABA EXPORTAR ===== */}
        <TabsContent value="exportar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exportar Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resumo dos filtros ativos */}
                <div className="rounded-lg border border-border/50 p-4 space-y-2">
                  <p className="text-sm font-medium">Filtros Ativos</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Período: {startDate ? formatDate(startDate) : 'Início'} — {endDate ? formatDate(endDate) : 'Atual'}</p>
                    <p>Status: {reportStatus === 'all' ? 'Todos' : reportStatus === 'pending' ? 'Pendentes' : 'Entregues'}</p>
                    <p>Total de registros: <span className="font-medium text-foreground">{clients.length}</span></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={exportToPDF} disabled={clients.length === 0}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar como PDF (A3 Paisagem)
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={exportToExcel} disabled={clients.length === 0}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar como Excel (.xlsx)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição (mantido igual) */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Neuroavaliação - {editingClient?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-code">Código do Paciente</Label>
                  <Input id="edit-code" value={editForm.neuro_patient_code} onChange={(e) => setEditForm({ ...editForm, neuro_patient_code: e.target.value })} placeholder="PC01, PC02..." />
                </div>
                <div>
                  <Label htmlFor="edit-gender">Sexo</Label>
                  <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="nao-informar">Não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-diagnosis-by">Encaminhado por</Label>
                <Input id="edit-diagnosis-by" value={editForm.neuro_diagnosis_by} onChange={(e) => setEditForm({ ...editForm, neuro_diagnosis_by: e.target.value })} placeholder="Nome do médico/profissional" />
              </div>
              <div>
                <Label htmlFor="edit-diagnosis">Suspeita de Diagnóstico</Label>
                <Input id="edit-diagnosis" value={editForm.neuro_diagnosis_suggestion} onChange={(e) => setEditForm({ ...editForm, neuro_diagnosis_suggestion: e.target.value })} placeholder="Ex: TDAH, TEA, Dislexia..." />
              </div>
              <div>
                <Label htmlFor="edit-history">Histórico Relevante</Label>
                <Textarea id="edit-history" value={editForm.neuro_relevant_history} onChange={(e) => setEditForm({ ...editForm, neuro_relevant_history: e.target.value })} placeholder="Histórico médico, escolar, familiar relevante..." rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-start-date">Início dos Testes</Label>
                  <Input id="edit-start-date" type="date" value={editForm.neuro_test_start_date} onChange={(e) => setEditForm({ ...editForm, neuro_test_start_date: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="edit-deadline">Previsão de Laudo</Label>
                  <Input id="edit-deadline" type="date" value={editForm.neuro_report_deadline} onChange={(e) => setEditForm({ ...editForm, neuro_report_deadline: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="edit-completed-date">Data de Finalização</Label>
                  <Input id="edit-completed-date" type="date" value={editForm.neuro_completed_date} onChange={(e) => setEditForm({ ...editForm, neuro_completed_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-tests">Materiais/Testes Utilizados (separados por vírgula)</Label>
                <Textarea id="edit-tests" value={editForm.neuro_tests_applied} onChange={(e) => setEditForm({ ...editForm, neuro_tests_applied: e.target.value })} placeholder="WISC-IV, Bender, HTP..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status do Laudo</Label>
                  <Select value={editForm.neuro_report_delivered ? 'delivered' : 'pending'} onValueChange={(value) => setEditForm({ ...editForm, neuro_report_delivered: value === 'delivered' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-socio">Condição Socioeconômica</Label>
                  <Select value={editForm.neuro_socioeconomic} onValueChange={(value) => setEditForm({ ...editForm, neuro_socioeconomic: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="A">Classe A</SelectItem>
                      <SelectItem value="B">Classe B</SelectItem>
                      <SelectItem value="C">Classe C</SelectItem>
                      <SelectItem value="D">Classe D</SelectItem>
                      <SelectItem value="E">Classe E</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-final-diagnosis">Resultado do Laudo</Label>
                <Textarea id="edit-final-diagnosis" value={editForm.neuro_final_diagnosis} onChange={(e) => setEditForm({ ...editForm, neuro_final_diagnosis: e.target.value })} placeholder="Diagnóstico final após avaliação..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-agreement">Concordância Diagnóstica</Label>
                  <Select value={editForm.neuro_diagnostic_agreement} onValueChange={(value) => setEditForm({ ...editForm, neuro_diagnostic_agreement: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Parcial">Parcial</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-divergence">Tipo de Divergência</Label>
                  <Input id="edit-divergence" value={editForm.neuro_divergence_type} onChange={(e) => setEditForm({ ...editForm, neuro_divergence_type: e.target.value })} placeholder="Descreva a divergência se houver..." />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-observations">Observações</Label>
                <Textarea id="edit-observations" value={editForm.neuro_observations} onChange={(e) => setEditForm({ ...editForm, neuro_observations: e.target.value })} placeholder="Observações adicionais..." rows={3} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
