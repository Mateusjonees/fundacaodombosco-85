import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Users, Clock, User, Award, Printer, Download, RefreshCw, Activity } from 'lucide-react';

interface EmployeeStats {
  employee: any;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  inProgressAppointments: number;
  totalHours: number;
  uniqueClients: number;
  avgAppointmentDuration: number;
  avgAppointmentsPerClient: number;
  completionRate: number;
  performanceScore: number;
  monthlyStats: any[];
  clientsList: any[];
  recentAppointments: any[];
}

export default function Reports() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh || !selectedEmployee) return;
    
    const interval = setInterval(() => {
      generateEmployeeReport();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedEmployee, dateRange]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      generateEmployeeReport();
    }
  }, [selectedEmployee, dateRange]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role, department, phone')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
      
      // Auto-select current user if they're in the list
      const currentUserProfile = data?.find(emp => emp.user_id === user?.id);
      if (currentUserProfile) {
        setSelectedEmployee(currentUserProfile.user_id);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
      });
    }
  };

  const generateEmployeeReport = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const employee = employees.find(emp => emp.user_id === selectedEmployee);
      if (!employee) return;

      // Load appointments for the employee with cancellation reasons
      const { data: appointments, error: appointmentsError } = await supabase
        .from('schedules')
        .select(`
          id, title, start_time, end_time, status, description, client_id, notes,
          clients:client_id (id, name, unit)
        `)
        .eq('employee_id', selectedEmployee)
        .gte('start_time', `${dateRange.start}T00:00:00`)
        .lte('start_time', `${dateRange.end}T23:59:59`)
        .order('start_time', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Calculate statistics
      const totalAppointments = appointments?.length || 0;
      const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
      const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0;
      const inProgressAppointments = appointments?.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length || 0;
      
      // Calculate total hours
      const totalHours = appointments?.reduce((sum, apt) => {
        const start = new Date(apt.start_time);
        const end = new Date(apt.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) || 0;

      const uniqueClients = new Set(appointments?.map(a => a.client_id)).size;
      const avgAppointmentDuration = totalAppointments > 0 ? totalHours / totalAppointments : 0;
      const avgAppointmentsPerClient = uniqueClients > 0 ? totalAppointments / uniqueClients : 0;
      const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
      
      // Calculate performance score based on completion rate and efficiency
      const efficiencyScore = avgAppointmentDuration > 0 ? Math.min(100, (1.5 / avgAppointmentDuration) * 100) : 0;
      const performanceScore = (completionRate * 0.7) + (efficiencyScore * 0.3);

      // Monthly statistics
      const monthlyStats = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthAppointments = appointments?.filter(a => {
          const date = new Date(a.start_time);
          return date.getMonth() + 1 === month && date.getFullYear() === new Date().getFullYear();
        }) || [];

        const monthHours = monthAppointments.reduce((sum, apt) => {
          const start = new Date(apt.start_time);
          const end = new Date(apt.end_time);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        return {
          month: new Date(2025, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
          appointments: monthAppointments.length,
          hours: monthHours,
          completed: monthAppointments.filter(a => a.status === 'completed').length
        };
      });

      // Get unique clients list with appointment count
      const clientsMap = new Map();
      appointments?.forEach(apt => {
        if (apt.clients) {
          const clientId = apt.clients.id;
          if (clientsMap.has(clientId)) {
            clientsMap.get(clientId).appointmentCount++;
          } else {
            clientsMap.set(clientId, {
              ...apt.clients,
              appointmentCount: 1
            });
          }
        }
      });

      const clientsList = Array.from(clientsMap.values());

      setEmployeeStats({
        employee,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        inProgressAppointments,
        totalHours: Math.round(totalHours * 100) / 100,
        uniqueClients,
        avgAppointmentDuration: Math.round(avgAppointmentDuration * 100) / 100,
        avgAppointmentsPerClient: Math.round(avgAppointmentsPerClient * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        performanceScore: Math.round(performanceScore * 100) / 100,
        monthlyStats,
        clientsList,
        recentAppointments: appointments || []
      });

    } catch (error) {
      console.error('Error generating employee report:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o relatório do funcionário.",
      });
    } finally {
      setLoading(false);
    }
  };

  const printEmployeeReport = () => {
    if (!employeeStats) return;

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Relatório Detalhado - ${employeeStats.employee.name}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2563eb;
                font-size: 28px;
                margin-bottom: 10px;
            }
            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .section h2 {
                background-color: #f8fafc;
                padding: 10px;
                border-left: 4px solid #2563eb;
                margin-bottom: 15px;
                font-size: 18px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                background: #f9fafb;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }
            .info-item strong {
                color: #1f2937;
                display: block;
                margin-bottom: 5px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .stat-card {
                background: #ffffff;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
            }
            .stat-label {
                font-size: 12px;
                color: #6b7280;
                margin-top: 5px;
            }
            .appointment-item {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-left: 4px solid #2563eb;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 0 8px 8px 0;
            }
            .appointment-title {
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 8px;
            }
            .appointment-details {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 10px;
                font-size: 14px;
                color: #6b7280;
            }
            .client-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }
            .client-item:last-child {
                border-bottom: none;
            }
            .monthly-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .month-card {
                background: #f9fafb;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                border: 1px solid #e5e7eb;
            }
            .month-name {
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
            }
            .month-stats {
                font-size: 14px;
                color: #6b7280;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
            @media print {
                body { margin: 0; }
                .section { page-break-inside: avoid; }
                .stats-grid { grid-template-columns: repeat(2, 1fr); }
                .monthly-stats { grid-template-columns: repeat(2, 1fr); }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>RELATÓRIO DETALHADO DO FUNCIONÁRIO</h1>
            <p>Sistema de Gestão Clínica</p>
            <p><strong>Período:</strong> ${new Date(dateRange.start).toLocaleDateString('pt-BR')} - ${new Date(dateRange.end).toLocaleDateString('pt-BR')}</p>
        </div>

        <div class="section">
            <h2>INFORMAÇÕES PESSOAIS</h2>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Nome Completo:</strong>
                    ${employeeStats.employee.name}
                </div>
                <div class="info-item">
                    <strong>Cargo:</strong>
                    ${employeeStats.employee.employee_role}
                </div>
                <div class="info-item">
                    <strong>Departamento:</strong>
                    ${employeeStats.employee.department || 'Não informado'}
                </div>
                <div class="info-item">
                    <strong>Telefone:</strong>
                    ${employeeStats.employee.phone || 'Não informado'}
                </div>
            </div>
        </div>

        <div class="section">
            <h2>ESTATÍSTICAS GERAIS</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${employeeStats.totalAppointments}</div>
                    <div class="stat-label">Total de Atendimentos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${employeeStats.completedAppointments}</div>
                    <div class="stat-label">Atendimentos Concluídos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${employeeStats.totalHours}h</div>
                    <div class="stat-label">Total de Horas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${employeeStats.uniqueClients}</div>
                    <div class="stat-label">Clientes Únicos</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>DETALHES COMPLETOS DOS ATENDIMENTOS (${employeeStats.totalAppointments} total)</h2>
            ${employeeStats.recentAppointments.map((appointment, index) => {
                const startTime = new Date(appointment.start_time);
                const endTime = new Date(appointment.end_time);
                const duration = ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(2);
                
                return `
                <div class="appointment-item">
                    <div class="appointment-title">
                        ${index + 1}. ${appointment.title}
                    </div>
                    <div class="appointment-details">
                        <div>
                            <strong>Cliente:</strong><br>
                            ${appointment.clients?.name || 'N/A'}
                        </div>
                        <div>
                            <strong>Data e Horário:</strong><br>
                            ${startTime.toLocaleDateString('pt-BR')}<br>
                            ${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                            ${endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>
                            <strong>Duração:</strong><br>
                            ${duration} horas<br>
                            <span style="color: ${appointment.status === 'completed' ? '#059669' : '#dc2626'};">
                                ${appointment.status === 'completed' ? 'Concluído' : appointment.status}
                            </span>
                        </div>
                    </div>
                    ${appointment.description ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                        <strong>Observações:</strong> ${appointment.description}
                    </div>
                    ` : ''}
                </div>
                `;
            }).join('')}
        </div>

        <div class="section">
            <h2>CLIENTES ATENDIDOS (${employeeStats.uniqueClients} únicos)</h2>
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px;">
                ${employeeStats.clientsList.map((client, index) => `
                <div class="client-item">
                    <div>
                        <strong>${index + 1}. ${client.name}</strong><br>
                        <span style="color: #6b7280; font-size: 14px;">
                            Unidade: ${client.unit === 'madre' ? 'Clínica Social (Madre)' : 'Neuro (Floresta)'}
                        </span>
                    </div>
                    <div style="text-align: right; color: #2563eb; font-weight: bold;">
                        ${client.appointmentCount} atendimentos
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>ESTATÍSTICAS MENSAIS</h2>
            <div class="monthly-stats">
                ${employeeStats.monthlyStats.map(month => `
                <div class="month-card">
                    <div class="month-name">${month.month.toUpperCase()}</div>
                    <div class="month-stats">
                        <div><strong>${month.appointments}</strong> atendimentos</div>
                        <div><strong>${month.hours.toFixed(1)}</strong> horas</div>
                        <div><strong>${month.completed}</strong> concluídos</div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>INDICADORES DE PERFORMANCE</h2>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Eficiência de Conclusão:</strong>
                    ${employeeStats.totalAppointments > 0 ? ((employeeStats.completedAppointments / employeeStats.totalAppointments) * 100).toFixed(1) : 0}%
                    <div style="color: #6b7280; font-size: 12px; margin-top: 5px;">
                        ${employeeStats.completedAppointments} de ${employeeStats.totalAppointments} atendimentos concluídos
                    </div>
                </div>
                <div class="info-item">
                    <strong>Produtividade Diária:</strong>
                    ${((employeeStats.totalHours / ((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)} horas/dia
                    <div style="color: #6b7280; font-size: 12px; margin-top: 5px;">
                        Baseado no período selecionado
                    </div>
                </div>
                <div class="info-item">
                    <strong>Fidelização de Clientes:</strong>
                    ${employeeStats.uniqueClients > 0 ? (employeeStats.totalAppointments / employeeStats.uniqueClients).toFixed(1) : 0} consultas/cliente
                    <div style="color: #6b7280; font-size: 12px; margin-top: 5px;">
                        Média de retornos por cliente
                    </div>
                </div>
                <div class="info-item">
                    <strong>Capacidade de Atendimento:</strong>
                    ${(employeeStats.totalAppointments / 12).toFixed(1)} consultas/mês
                    <div style="color: #6b7280; font-size: 12px; margin-top: 5px;">
                        Média mensal no período
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Relatório gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Sistema:</strong> Gestão Clínica | <strong>Período:</strong> ${new Date(dateRange.start).toLocaleDateString('pt-BR')} - ${new Date(dateRange.end).toLocaleDateString('pt-BR')}</p>
            <p><strong>ID do Funcionário:</strong> ${employeeStats.employee.user_id}</p>
        </div>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      toast({
        title: "Relatório de Impressão",
        description: "Abrindo janela de impressão com relatório completo!",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.",
      });
    }
  };

  const exportEmployeeReport = () => {
    if (!employeeStats) return;

    const reportContent = `
RELATÓRIO DETALHADO DO FUNCIONÁRIO
==================================

DADOS PESSOAIS
===============
Nome: ${employeeStats.employee.name}
Cargo: ${employeeStats.employee.employee_role}
Departamento: ${employeeStats.employee.department || 'Não informado'}
Telefone: ${employeeStats.employee.phone || 'Não informado'}
ID do Funcionário: ${employeeStats.employee.user_id}

PERÍODO DO RELATÓRIO
===================
Data Início: ${new Date(dateRange.start).toLocaleDateString('pt-BR')}
Data Fim: ${new Date(dateRange.end).toLocaleDateString('pt-BR')}

ESTATÍSTICAS GERAIS
==================
Total de Atendimentos: ${employeeStats.totalAppointments}
Atendimentos Concluídos: ${employeeStats.completedAppointments}
Taxa de Conclusão: ${employeeStats.totalAppointments > 0 ? ((employeeStats.completedAppointments / employeeStats.totalAppointments) * 100).toFixed(1) : 0}%

HORAS TRABALHADAS
================
Total de Horas: ${employeeStats.totalHours} horas
Duração Média por Atendimento: ${employeeStats.avgAppointmentDuration} horas
Horas por Mês (Média): ${(employeeStats.totalHours / 12).toFixed(2)} horas

CLIENTES ATENDIDOS
=================
Total de Clientes Únicos: ${employeeStats.uniqueClients}
Atendimentos por Cliente (Média): ${employeeStats.uniqueClients > 0 ? (employeeStats.totalAppointments / employeeStats.uniqueClients).toFixed(1) : 0}

LISTA DE CLIENTES
================
${employeeStats.clientsList.map((client, index) => `
${index + 1}. ${client.name}
   - Unidade: ${client.unit === 'madre' ? 'Clínica Social (Madre)' : 'Neuro (Floresta)'}
   - Total de Atendimentos: ${client.appointmentCount}
`).join('\n')}

DETALHES COMPLETOS DE TODOS OS ATENDIMENTOS
==========================================
${employeeStats.recentAppointments.map((apt, index) => {
    const startTime = new Date(apt.start_time);
    const endTime = new Date(apt.end_time);
    const duration = ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(2);
    
    return `
${index + 1}. ${apt.title}
   Data: ${startTime.toLocaleDateString('pt-BR')}
   Horário: ${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
   Duração: ${duration} horas
   Cliente: ${apt.clients?.name || 'N/A'}
   Status: ${apt.status === 'completed' ? 'Concluído' : apt.status}
   ${apt.description ? `Observações: ${apt.description}` : 'Sem observações'}
`;
}).join('\n')}

ESTATÍSTICAS MENSAIS
===================
${employeeStats.monthlyStats.map(month => `
${month.month}: ${month.appointments} atendimentos, ${month.hours.toFixed(1)} horas, ${month.completed} concluídos
`).join('')}

INDICADORES DE PERFORMANCE
=========================
- Produtividade: ${(employeeStats.totalHours / ((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24 * 30))).toFixed(2)} horas/mês
- Eficiência: ${((employeeStats.completedAppointments / employeeStats.totalAppointments) * 100).toFixed(1)}% de conclusão
- Fidelização: ${employeeStats.uniqueClients > 0 ? (employeeStats.totalAppointments / employeeStats.uniqueClients).toFixed(1) : 0} atendimentos por cliente

Relatório gerado em: ${new Date().toLocaleString('pt-BR')}
Gerado por: Sistema de Gestão Clínica
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-funcionario-${employeeStats.employee.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório Exportado",
      description: "O relatório detalhado do funcionário foi baixado com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios de Funcionários</h1>
        <div className="flex items-center gap-2">
          {selectedEmployee && (
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className="gap-1"
            >
              <Activity className="h-4 w-4" />
              {autoRefresh ? "Atualizando..." : "Atualização Automática"}
            </Button>
          )}
          {employeeStats && (
            <>
              <Button onClick={printEmployeeReport} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={exportEmployeeReport} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Filtros do Relatório
            {selectedEmployee && (
              <Button
                onClick={generateEmployeeReport}
                variant="outline"
                size="sm"
                disabled={loading}
                className="gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.name} - {employee.employee_role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
          {autoRefresh && selectedEmployee && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3 animate-pulse" />
              Relatório atualiza automaticamente a cada 30 segundos
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Carregando relatório...</p>
          </CardContent>
        </Card>
      )}

      {!loading && employeeStats && (
        <>
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{employeeStats.employee.name}</h3>
                  <p className="text-muted-foreground">{employeeStats.employee.employee_role}</p>
                  {employeeStats.employee.department && (
                    <p className="text-sm">Departamento: {employeeStats.employee.department}</p>
                  )}
                </div>
                <div>
                  {employeeStats.employee.phone && (
                    <p className="text-sm">Telefone: {employeeStats.employee.phone}</p>
                  )}
                  <p className="text-sm">Período: {new Date(dateRange.start).toLocaleDateString('pt-BR')} - {new Date(dateRange.end).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeeStats.totalAppointments}</div>
                <p className="text-xs text-muted-foreground">Atendimentos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <Award className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{employeeStats.completedAppointments}</div>
                <p className="text-xs text-muted-foreground">{employeeStats.completionRate}% conclusão</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
                <Calendar className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{employeeStats.cancelledAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {employeeStats.totalAppointments > 0 ? ((employeeStats.cancelledAppointments / employeeStats.totalAppointments) * 100).toFixed(1) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{employeeStats.inProgressAppointments}</div>
                <p className="text-xs text-muted-foreground">Agendados/Confirmados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Totais</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeeStats.totalHours}h</div>
                <p className="text-xs text-muted-foreground">Média: {employeeStats.avgAppointmentDuration}h/atendimento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{employeeStats.performanceScore}%</div>
                <p className="text-xs text-muted-foreground">Score geral</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeeStats.uniqueClients}</div>
                <p className="text-xs text-muted-foreground">
                  {employeeStats.avgAppointmentsPerClient} atendimentos/cliente em média
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtividade</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(employeeStats.totalHours / ((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24 * 30))).toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">Horas por mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(employeeStats.totalAppointments / 12).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Atendimentos por mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={employeeStats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="hsl(var(--primary))" name="Total" />
                    <Bar dataKey="completed" fill="hsl(var(--secondary))" name="Concluídos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horas por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={employeeStats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']} />
                    <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Clients List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Atendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {employeeStats.clientsList.map((client) => (
                    <div key={client.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.unit === 'madre' ? 'Clínica Social (Madre)' : 'Neuro (Floresta)'}
                        </div>
                      </div>
                      <Badge variant="outline">{client.appointmentCount} atendimentos</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimos Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {employeeStats.recentAppointments.slice(0, 10).map((appointment) => (
                    <div key={appointment.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="font-medium">{appointment.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Cliente: {appointment.clients?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Profissional: {employeeStats.employee.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(appointment.start_time).toLocaleString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={
                            appointment.status === 'completed' ? 'default' : 
                            appointment.status === 'cancelled' ? 'destructive' : 
                            appointment.status === 'confirmed' || appointment.status === 'scheduled' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {appointment.status === 'completed' ? 'Concluído' : 
                           appointment.status === 'cancelled' ? 'Cancelado' :
                           appointment.status === 'confirmed' ? 'Em andamento' :
                           appointment.status === 'scheduled' ? 'Em andamento' :
                           appointment.status}
                        </Badge>
                      </div>
                      {appointment.status === 'cancelled' && appointment.description && (
                        <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
                          <strong>Motivo do cancelamento:</strong> {appointment.description}
                        </div>
                      )}
                      {appointment.status === 'completed' && appointment.description && (
                        <div className="text-sm text-muted-foreground mt-2">
                          <strong>Observações:</strong> {appointment.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!loading && !employeeStats && selectedEmployee && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado.</p>
          </CardContent>
        </Card>
      )}

      {!selectedEmployee && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Selecione um funcionário para gerar o relatório.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}