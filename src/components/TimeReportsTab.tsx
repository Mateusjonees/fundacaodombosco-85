import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, FileDown, Users, Calendar, Timer, Activity } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, startOfYear, getWeek, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

interface AttendanceReport {
  id: string;
  employee_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  session_duration?: number;
  attendance_type?: string;
  amount_charged?: number;
  professional_name?: string;
  patient_name?: string;
  profiles?: { name: string };
  clients?: { name: string; unit?: string };
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  employee_role: string;
}

interface TimeReportsTabProps {
  attendanceReports: AttendanceReport[];
  employees: Profile[];
  selectedEmployee: string;
  selectedClient: string;
  selectedUnit: string;
  sessionType: string;
  dateFrom: string;
  dateTo: string;
  selectedMonth: string;
}

type GroupByPeriod = 'day' | 'week' | 'month' | 'year';

interface PeriodStats {
  period: string;
  periodKey: string;
  count: number;
  totalMinutes: number;
  avgMinutes: number;
}

interface EmployeeStats {
  employeeId: string;
  employeeName: string;
  count: number;
  totalMinutes: number;
  avgMinutes: number;
  percentage: number;
}

interface TypeStats {
  type: string;
  count: number;
  totalMinutes: number;
  avgMinutes: number;
}

const formatHoursMinutes = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes <= 0) return '0min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
};

export default function TimeReportsTab({
  attendanceReports,
  employees,
  selectedEmployee,
  selectedClient,
  selectedUnit,
  sessionType,
  dateFrom,
  dateTo,
  selectedMonth,
}: TimeReportsTabProps) {
  const [groupBy, setGroupBy] = useState<GroupByPeriod>('month');
  const { toast } = useToast();

  // Filtrar apenas atendimentos com duração registrada
  const reportsWithDuration = useMemo(() => {
    return attendanceReports.filter(r => r.session_duration && r.session_duration > 0);
  }, [attendanceReports]);

  // Calcular total de minutos
  const totalMinutes = useMemo(() => {
    return reportsWithDuration.reduce((sum, r) => sum + (r.session_duration || 0), 0);
  }, [reportsWithDuration]);

  // Calcular total de horas (decimal)
  const totalHours = useMemo(() => {
    return totalMinutes / 60;
  }, [totalMinutes]);

  // Calcular média por atendimento
  const averageMinutes = useMemo(() => {
    if (reportsWithDuration.length === 0) return 0;
    return totalMinutes / reportsWithDuration.length;
  }, [totalMinutes, reportsWithDuration.length]);

  // Agrupar por período
  const statsByPeriod = useMemo((): PeriodStats[] => {
    const groups = new Map<string, { count: number; totalMinutes: number; label: string }>();

    reportsWithDuration.forEach(report => {
      const date = parseISO(report.start_time);
      let key: string;
      let label: string;

      switch (groupBy) {
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          label = format(date, 'dd/MM/yyyy', { locale: ptBR });
          break;
        case 'week':
          const weekStart = startOfWeek(date, { weekStartsOn: 1 });
          key = format(weekStart, 'yyyy-ww');
          label = `Semana ${getWeek(date)} - ${format(weekStart, 'dd/MM', { locale: ptBR })}`;
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          label = format(date, 'MMMM/yyyy', { locale: ptBR });
          break;
        case 'year':
          key = format(date, 'yyyy');
          label = format(date, 'yyyy');
          break;
        default:
          key = format(date, 'yyyy-MM');
          label = format(date, 'MMMM/yyyy', { locale: ptBR });
      }

      const existing = groups.get(key) || { count: 0, totalMinutes: 0, label };
      existing.count += 1;
      existing.totalMinutes += report.session_duration || 0;
      groups.set(key, existing);
    });

    return Array.from(groups.entries())
      .map(([periodKey, data]) => ({
        period: data.label,
        periodKey,
        count: data.count,
        totalMinutes: data.totalMinutes,
        avgMinutes: data.count > 0 ? data.totalMinutes / data.count : 0,
      }))
      .sort((a, b) => b.periodKey.localeCompare(a.periodKey));
  }, [reportsWithDuration, groupBy]);

  // Agrupar por profissional
  const statsByEmployee = useMemo((): EmployeeStats[] => {
    const groups = new Map<string, { name: string; count: number; totalMinutes: number }>();

    reportsWithDuration.forEach(report => {
      const employeeId = report.employee_id;
      const employeeName = report.profiles?.name || report.professional_name || 'N/A';

      const existing = groups.get(employeeId) || { name: employeeName, count: 0, totalMinutes: 0 };
      existing.count += 1;
      existing.totalMinutes += report.session_duration || 0;
      groups.set(employeeId, existing);
    });

    return Array.from(groups.entries())
      .map(([employeeId, data]) => ({
        employeeId,
        employeeName: data.name,
        count: data.count,
        totalMinutes: data.totalMinutes,
        avgMinutes: data.count > 0 ? data.totalMinutes / data.count : 0,
        percentage: totalMinutes > 0 ? (data.totalMinutes / totalMinutes) * 100 : 0,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [reportsWithDuration, totalMinutes]);

  // Agrupar por tipo de atendimento
  const statsByType = useMemo((): TypeStats[] => {
    const groups = new Map<string, { count: number; totalMinutes: number }>();

    reportsWithDuration.forEach(report => {
      const type = report.attendance_type || 'Não especificado';

      const existing = groups.get(type) || { count: 0, totalMinutes: 0 };
      existing.count += 1;
      existing.totalMinutes += report.session_duration || 0;
      groups.set(type, existing);
    });

    return Array.from(groups.entries())
      .map(([type, data]) => ({
        type,
        count: data.count,
        totalMinutes: data.totalMinutes,
        avgMinutes: data.count > 0 ? data.totalMinutes / data.count : 0,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [reportsWithDuration]);

  // Exportar PDF
  const exportTimePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text('Relatório de Tempo de Atendimentos', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Filtros aplicados
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    const filterInfo: string[] = [];
    if (selectedEmployee !== 'all') {
      const emp = employees.find(e => e.user_id === selectedEmployee);
      filterInfo.push(`Profissional: ${emp?.name || '-'}`);
    }
    if (selectedUnit !== 'all') {
      const unitName = selectedUnit === 'madre' ? 'MADRE' : 
                       selectedUnit === 'floresta' ? 'Floresta' : 
                       selectedUnit === 'atendimento_floresta' ? 'Atendimento Floresta' : selectedUnit;
      filterInfo.push(`Unidade: ${unitName}`);
    }
    if (sessionType !== 'all') {
      filterInfo.push(`Tipo: ${sessionType}`);
    }
    if (dateFrom) {
      filterInfo.push(`De: ${format(new Date(dateFrom), 'dd/MM/yyyy')}`);
    }
    if (dateTo) {
      filterInfo.push(`Até: ${format(new Date(dateTo), 'dd/MM/yyyy')}`);
    }
    if (!dateFrom && !dateTo && selectedMonth) {
      filterInfo.push(`Mês: ${format(parseISO(selectedMonth + '-01'), 'MMMM/yyyy', { locale: ptBR })}`);
    }

    if (filterInfo.length > 0) {
      doc.text(`Filtros: ${filterInfo.join(' | ')}`, margin, yPos);
      yPos += 8;
    }

    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPos);
    yPos += 12;

    // Resumo Geral
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO GERAL', margin + 4, yPos + 5.5);
    yPos += 12;

    doc.setTextColor(33, 33, 33);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryData = [
      ['Total de Horas', formatHoursMinutes(totalMinutes)],
      ['Total de Minutos', `${totalMinutes.toLocaleString('pt-BR')} min`],
      ['Média por Atendimento', `${Math.round(averageMinutes)} min`],
      ['Atendimentos Contabilizados', reportsWithDuration.length.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 50 },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Estatísticas por Período
    if (statsByPeriod.length > 0) {
      doc.setFillColor(34, 197, 94);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const groupLabel = groupBy === 'day' ? 'DIA' : groupBy === 'week' ? 'SEMANA' : groupBy === 'month' ? 'MÊS' : 'ANO';
      doc.text(`ESTATÍSTICAS POR ${groupLabel}`, margin + 4, yPos + 5.5);
      yPos += 12;

      autoTable(doc, {
        startY: yPos,
        head: [['Período', 'Atendimentos', 'Horas Totais', 'Minutos Totais', 'Média (min)']],
        body: statsByPeriod.map(stat => [
          stat.period,
          stat.count.toString(),
          formatHoursMinutes(stat.totalMinutes),
          stat.totalMinutes.toLocaleString('pt-BR'),
          Math.round(stat.avgMinutes).toString(),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 9, cellPadding: 2 },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Nova página se necessário
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // Estatísticas por Profissional
    if (statsByEmployee.length > 0) {
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTATÍSTICAS POR PROFISSIONAL', margin + 4, yPos + 5.5);
      yPos += 12;

      autoTable(doc, {
        startY: yPos,
        head: [['Profissional', 'Atendimentos', 'Horas', 'Média (min)', '% do Total']],
        body: statsByEmployee.map(stat => [
          stat.employeeName,
          stat.count.toString(),
          formatHoursMinutes(stat.totalMinutes),
          Math.round(stat.avgMinutes).toString(),
          `${stat.percentage.toFixed(1)}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9, cellPadding: 2 },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Nova página se necessário
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // Estatísticas por Tipo
    if (statsByType.length > 0) {
      doc.setFillColor(168, 85, 247);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTATÍSTICAS POR TIPO DE ATENDIMENTO', margin + 4, yPos + 5.5);
      yPos += 12;

      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Atendimentos', 'Horas', 'Média (min)']],
        body: statsByType.map(stat => [
          stat.type,
          stat.count.toString(),
          formatHoursMinutes(stat.totalMinutes),
          Math.round(stat.avgMinutes).toString(),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247] },
        styles: { fontSize: 9, cellPadding: 2 },
        margin: { left: margin, right: margin },
      });
    }

    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${totalPages} - Relatório de Tempo`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Salvar
    const fileName = `relatorio_tempo_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(fileName);

    toast({
      title: "PDF Exportado",
      description: `Relatório de tempo salvo como ${fileName}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {formatHoursMinutes(totalMinutes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalHours.toFixed(1)} horas decimais
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-500/10 via-card to-green-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Minutos</CardTitle>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Timer className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              {totalMinutes.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">minutos registrados</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-500/10 via-card to-purple-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Atend.</CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              {Math.round(averageMinutes)} min
            </div>
            <p className="text-xs text-muted-foreground mt-1">duração média</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-500/10 via-card to-orange-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              {reportsWithDuration.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">com duração registrada</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Agrupar por</Label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByPeriod)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Dia</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mês</SelectItem>
                    <SelectItem value="year">Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={exportTimePDF} 
              disabled={reportsWithDuration.length === 0}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF de Tempo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela por Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Estatísticas por {groupBy === 'day' ? 'Dia' : groupBy === 'week' ? 'Semana' : groupBy === 'month' ? 'Mês' : 'Ano'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsByPeriod.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum atendimento com duração registrada encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Atendimentos</TableHead>
                  <TableHead className="text-center">Horas Totais</TableHead>
                  <TableHead className="text-center">Minutos Totais</TableHead>
                  <TableHead className="text-center">Média (min)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsByPeriod.map((stat) => (
                  <TableRow key={stat.periodKey}>
                    <TableCell className="font-medium capitalize">{stat.period}</TableCell>
                    <TableCell className="text-center">{stat.count}</TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">
                      {formatHoursMinutes(stat.totalMinutes)}
                    </TableCell>
                    <TableCell className="text-center">{stat.totalMinutes.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-center">{Math.round(stat.avgMinutes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Accordion com Por Profissional e Por Tipo */}
      <Accordion type="multiple" defaultValue={['by-employee', 'by-type']} className="space-y-4">
        {/* Por Profissional */}
        <AccordionItem value="by-employee" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Estatísticas por Profissional</span>
              <Badge variant="secondary" className="ml-2">{statsByEmployee.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {statsByEmployee.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum dado disponível.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead className="text-center">Atendimentos</TableHead>
                    <TableHead className="text-center">Horas</TableHead>
                    <TableHead className="text-center">Média (min)</TableHead>
                    <TableHead className="text-center">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsByEmployee.map((stat) => (
                    <TableRow key={stat.employeeId}>
                      <TableCell className="font-medium">{stat.employeeName}</TableCell>
                      <TableCell className="text-center">{stat.count}</TableCell>
                      <TableCell className="text-center font-semibold text-blue-600">
                        {formatHoursMinutes(stat.totalMinutes)}
                      </TableCell>
                      <TableCell className="text-center">{Math.round(stat.avgMinutes)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{stat.percentage.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Por Tipo de Atendimento */}
        <AccordionItem value="by-type" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">Estatísticas por Tipo de Atendimento</span>
              <Badge variant="secondary" className="ml-2">{statsByType.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {statsByType.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum dado disponível.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Atendimentos</TableHead>
                    <TableHead className="text-center">Horas</TableHead>
                    <TableHead className="text-center">Média (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsByType.map((stat) => (
                    <TableRow key={stat.type}>
                      <TableCell>
                        <Badge variant="outline">{stat.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{stat.count}</TableCell>
                      <TableCell className="text-center font-semibold text-purple-600">
                        {formatHoursMinutes(stat.totalMinutes)}
                      </TableCell>
                      <TableCell className="text-center">{Math.round(stat.avgMinutes)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
