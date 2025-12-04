import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, FileDown, FileSpreadsheet, Calendar, Filter, Users } from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface NeuroClient {
  id: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  neuro_test_start_date: string | null;
  neuro_report_deadline: string | null;
  neuro_report_file_path: string | null;
  neuro_diagnosis_suggestion: string | null;
  neuro_tests_applied: string[] | null;
  neuro_socioeconomic: string | null;
  unit: string | null;
  total_hours?: number;
}

export default function Neuroassessment() {
  const [clients, setClients] = useState<NeuroClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportStatus, setReportStatus] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadNeuroClients();
  }, [startDate, endDate, reportStatus]);

  const loadNeuroClients = async () => {
    setLoading(true);
    try {
      // Buscar clientes da unidade floresta (neuroavaliação)
      let query = supabase
        .from('clients')
        .select('*')
        .eq('unit', 'floresta')
        .eq('is_active', true);

      // Filtro de data de início dos testes
      if (startDate) {
        query = query.gte('neuro_test_start_date', startDate);
      }
      if (endDate) {
        query = query.lte('neuro_test_start_date', endDate);
      }

      // Filtro de status do laudo
      if (reportStatus === 'pending') {
        query = query.is('neuro_report_file_path', null);
      } else if (reportStatus === 'delivered') {
        query = query.not('neuro_report_file_path', 'is', null);
      }

      const { data: clientsData, error } = await query.order('name');

      if (error) throw error;

      // Buscar horas totais de atendimento para cada cliente
      const clientsWithHours = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { data: attendances } = await supabase
            .from('attendance_reports')
            .select('session_duration')
            .eq('client_id', client.id)
            .eq('status', 'completed');

          const totalMinutes = attendances?.reduce((sum, att) => sum + (att.session_duration || 0), 0) || 0;
          const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

          return {
            ...client,
            neuro_tests_applied: client.neuro_tests_applied as string[] | null,
            total_hours: totalHours
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

  const getReportStatus = (filePath: string | null): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    return filePath 
      ? { label: 'Entregue', variant: 'default' }
      : { label: 'Pendente', variant: 'secondary' };
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 153);
    doc.text('FUNDAÇÃO DOM BOSCO', 148, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Neuroavaliação', 148, 23, { align: 'center' });
    
    // Filtros aplicados
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

    // Tabela
    const tableData = clients.map(client => [
      client.name,
      formatDate(client.birth_date),
      getGenderLabel(client.gender),
      formatDate(client.neuro_test_start_date),
      client.neuro_diagnosis_suggestion || '-',
      getReportStatus(client.neuro_report_file_path).label,
      Array.isArray(client.neuro_tests_applied) ? client.neuro_tests_applied.join(', ') : '-',
      client.total_hours ? `${client.total_hours}h` : '-',
      client.neuro_socioeconomic || '-'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Nome', 'Nascimento', 'Sexo', 'Início Testes', 'Sugestão Dx', 'Laudo', 'Testes', 'Horas', 'Socio.']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 102, 153],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        5: { cellWidth: 20 },
        6: { cellWidth: 50 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 }
      },
      margin: { left: 10, right: 10 }
    });

    // Footer
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
      'Sexo': getGenderLabel(client.gender),
      'Início dos Testes': formatDate(client.neuro_test_start_date),
      'Previsão Laudo': formatDate(client.neuro_report_deadline),
      'Sugestão de Diagnóstico': client.neuro_diagnosis_suggestion || '-',
      'Status do Laudo': getReportStatus(client.neuro_report_file_path).label,
      'Testes Aplicados': Array.isArray(client.neuro_tests_applied) ? client.neuro_tests_applied.join(', ') : '-',
      'Horas Totais': client.total_hours || 0,
      'Socioeconômico': client.neuro_socioeconomic || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Neuroavaliação');
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 35 }, { wch: 15 }, { wch: 8 }, { wch: 15 }, { wch: 15 },
      { wch: 25 }, { wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 15 }
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Pacientes</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Laudos Pendentes</p>
                <p className="text-2xl font-bold">{clients.filter(c => !c.neuro_report_file_path).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileDown className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Laudos Entregues</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.neuro_report_file_path).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Horas</p>
                <p className="text-2xl font-bold">{clients.reduce((sum, c) => sum + (c.total_hours || 0), 0).toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <TableHead>Sugestão Diagnóstico</TableHead>
                    <TableHead>Status Laudo</TableHead>
                    <TableHead>Testes Aplicados</TableHead>
                    <TableHead>Horas Totais</TableHead>
                    <TableHead>Socioeconômico</TableHead>
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
                        <TableCell>{getGenderLabel(client.gender)}</TableCell>
                        <TableCell>{formatDate(client.neuro_test_start_date)}</TableCell>
                        <TableCell>{client.neuro_diagnosis_suggestion || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {Array.isArray(client.neuro_tests_applied) && client.neuro_tests_applied.length > 0
                            ? client.neuro_tests_applied.join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell>{client.total_hours ? `${client.total_hours}h` : '-'}</TableCell>
                        <TableCell>{client.neuro_socioeconomic || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}