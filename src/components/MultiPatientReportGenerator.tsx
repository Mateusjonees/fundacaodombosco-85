import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/fundacao-logo-report.png';

interface Client {
  id: string;
  name: string;
  cpf?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  responsible_name?: string;
  responsible_phone?: string;
  unit?: string;
  address?: string;
  diagnosis?: string;
  neuropsych_complaint?: string;
  clinical_observations?: string;
  medical_history?: string;
  current_symptoms?: string;
  treatment_progress?: string;
  treatment_expectations?: string;
  is_active: boolean;
  created_at: string;
}

interface MultiPatientReportGeneratorProps {
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
}

export function MultiPatientReportGenerator({ clients, isOpen, onClose }: MultiPatientReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPatient, setCurrentPatient] = useState('');
  const { toast } = useToast();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const today = new Date();
    const age = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} anos`;
  };

  const getUnitLabel = (unit?: string) => {
    switch (unit) {
      case 'madre': return 'MADRE (Clínica Social)';
      case 'floresta': return 'Floresta (Neuroavaliação)';
      case 'atendimento_floresta': return 'Atendimento Floresta';
      default: return unit || 'N/A';
    }
  };

  const getAttendanceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'consultation': 'Consulta',
      'therapy': 'Terapia',
      'evaluation': 'Avaliação',
      'follow_up': 'Retorno',
      'anamnesis': 'Anamnese',
      'neuroassessment': 'Neuroavaliação',
    };
    return types[type] || type;
  };

  const fetchAttendanceReports = async (clientId: string) => {
    const { data, error } = await supabase
      .from('attendance_reports')
      .select('*')
      .eq('client_id', clientId)
      .eq('validation_status', 'validated')
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching attendance reports:', error);
      return [];
    }
    return data || [];
  };

  const fetchMedicalRecords = async (clientId: string) => {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*, profiles:employee_id(name)')
      .eq('client_id', clientId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching medical records:', error);
      return [];
    }
    return data || [];
  };

  const fetchClientNotes = async (clientId: string) => {
    const { data, error } = await supabase
      .from('client_notes')
      .select('*, profiles:created_by(name)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client notes:', error);
      return [];
    }
    return data || [];
  };

  const fetchPrescriptions = async (clientId: string) => {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, profiles:employee_id(name)')
      .eq('client_id', clientId)
      .order('prescription_date', { ascending: false });

    if (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }
    return data || [];
  };

  const fetchScheduleHistory = async (clientId: string) => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, profiles:employee_id(name)')
      .eq('client_id', clientId)
      .in('status', ['completed', 'in_progress', 'confirmed'])
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }
    return data || [];
  };

  const fetchClientPayments = async (clientId: string) => {
    const { data, error } = await supabase
      .from('client_payments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
    return data || [];
  };

  const fetchEmployeeReports = async (clientId: string) => {
    const { data, error } = await supabase
      .from('employee_reports')
      .select('*, profiles:employee_id(name)')
      .eq('client_id', clientId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching employee reports:', error);
      return [];
    }
    return data || [];
  };

  const checkNewPage = (pdf: jsPDF, yPos: number, requiredSpace: number, margin: number): number => {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (yPos > pageHeight - requiredSpace) {
      pdf.addPage();
      return margin;
    }
    return yPos;
  };

  const addSectionHeader = (pdf: jsPDF, title: string, yPos: number, margin: number): number => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(33, 37, 41);
    pdf.text(title, margin, yPos);
    return yPos + 8;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        setCurrentPatient(client.name);
        setProgress(((i + 0.2) / clients.length) * 100);

        // Fetch all data in parallel
        const [
          attendanceReports,
          medicalRecords,
          clientNotes,
          prescriptions,
          scheduleHistory,
          clientPayments,
          employeeReports
        ] = await Promise.all([
          fetchAttendanceReports(client.id),
          fetchMedicalRecords(client.id),
          fetchClientNotes(client.id),
          fetchPrescriptions(client.id),
          fetchScheduleHistory(client.id),
          fetchClientPayments(client.id),
          fetchEmployeeReports(client.id)
        ]);

        setProgress(((i + 0.5) / clients.length) * 100);

        if (i > 0) {
          pdf.addPage();
        }

        let yPos = margin;

        // Header com logo
        try {
          const img = new Image();
          img.src = logoImage;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
          pdf.addImage(img, 'PNG', pageWidth / 2 - 25, yPos, 50, 20);
          yPos += 25;
        } catch {
          yPos += 10;
        }

        // Título
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(33, 37, 41);
        pdf.text('RELATÓRIO COMPLETO DO PACIENTE', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Subtítulo
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(108, 117, 125);
        pdf.text(`Paciente ${i + 1} de ${clients.length} - Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        // Linha separadora
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        // ============== DADOS PESSOAIS ==============
        yPos = addSectionHeader(pdf, 'DADOS PESSOAIS', yPos, margin);

        autoTable(pdf, {
          startY: yPos,
          head: [],
          body: [
            ['Nome Completo', client.name],
            ['CPF', client.cpf || 'Não informado'],
            ['Data de Nascimento', client.birth_date ? `${formatDate(client.birth_date)} (${calculateAge(client.birth_date)})` : 'Não informado'],
            ['Telefone', client.phone || 'Não informado'],
            ['Email', client.email || 'Não informado'],
            ['Unidade', getUnitLabel(client.unit)],
            ['Endereço', client.address || 'Não informado'],
            ['Status', client.is_active ? 'Ativo' : 'Inativo'],
            ['Cadastrado em', formatDate(client.created_at)],
          ],
          theme: 'striped',
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 'auto' },
          },
          margin: { left: margin, right: margin },
        });

        yPos = (pdf as any).lastAutoTable.finalY + 10;

        // ============== RESPONSÁVEL ==============
        if (client.responsible_name || client.responsible_phone) {
          yPos = checkNewPage(pdf, yPos, 40, margin);
          yPos = addSectionHeader(pdf, 'RESPONSÁVEL', yPos, margin);

          autoTable(pdf, {
            startY: yPos,
            head: [],
            body: [
              ['Nome do Responsável', client.responsible_name || 'Não informado'],
              ['Telefone do Responsável', client.responsible_phone || 'Não informado'],
            ],
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 50 },
              1: { cellWidth: 'auto' },
            },
            margin: { left: margin, right: margin },
          });

          yPos = (pdf as any).lastAutoTable.finalY + 10;
        }

        // ============== INFORMAÇÕES CLÍNICAS ==============
        const hasClinicalInfo = client.diagnosis || client.neuropsych_complaint || 
          client.clinical_observations || client.medical_history || 
          client.current_symptoms || client.treatment_progress;

        if (hasClinicalInfo) {
          yPos = checkNewPage(pdf, yPos, 60, margin);
          yPos = addSectionHeader(pdf, 'INFORMAÇÕES CLÍNICAS', yPos, margin);

          const clinicalData: string[][] = [];
          if (client.diagnosis) clinicalData.push(['Diagnóstico', client.diagnosis]);
          if (client.neuropsych_complaint) clinicalData.push(['Queixa Neuropsicológica', client.neuropsych_complaint]);
          if (client.clinical_observations) clinicalData.push(['Observações Clínicas', client.clinical_observations]);
          if (client.medical_history) clinicalData.push(['Histórico Médico', client.medical_history]);
          if (client.current_symptoms) clinicalData.push(['Sintomas Atuais', client.current_symptoms]);
          if (client.treatment_progress) clinicalData.push(['Progresso do Tratamento', client.treatment_progress]);
          if (client.treatment_expectations) clinicalData.push(['Expectativas de Tratamento', client.treatment_expectations]);

          if (clinicalData.length > 0) {
            autoTable(pdf, {
              startY: yPos,
              head: [],
              body: clinicalData,
              theme: 'striped',
              styles: { fontSize: 9, cellPadding: 3 },
              columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 'auto' },
              },
              margin: { left: margin, right: margin },
            });

            yPos = (pdf as any).lastAutoTable.finalY + 10;
          }
        }

        // ============== NOTAS CLÍNICAS E ANAMNESES ==============
        if (clientNotes.length > 0) {
          yPos = checkNewPage(pdf, yPos, 60, margin);
          yPos = addSectionHeader(pdf, `NOTAS CLÍNICAS E ANAMNESES (${clientNotes.length})`, yPos, margin);

          const notesTableData = clientNotes.map((note: any) => [
            formatDate(note.created_at),
            note.note_type || 'Geral',
            note.service_type || '-',
            (note.profiles as any)?.name || 'Sistema',
            (note.note_text || '').substring(0, 80) + (note.note_text?.length > 80 ? '...' : '')
          ]);

          autoTable(pdf, {
            startY: yPos,
            head: [['Data', 'Tipo', 'Serviço', 'Profissional', 'Nota']],
            body: notesTableData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
              0: { cellWidth: 22 },
              1: { cellWidth: 22 },
              2: { cellWidth: 22 },
              3: { cellWidth: 30 },
              4: { cellWidth: 'auto' },
            },
            margin: { left: margin, right: margin },
          });

          yPos = (pdf as any).lastAutoTable.finalY + 10;
        }

        // ============== PRESCRIÇÕES MÉDICAS ==============
        if (prescriptions.length > 0) {
          yPos = checkNewPage(pdf, yPos, 60, margin);
          yPos = addSectionHeader(pdf, `PRESCRIÇÕES MÉDICAS (${prescriptions.length})`, yPos, margin);

          for (const prescription of prescriptions) {
            yPos = checkNewPage(pdf, yPos, 50, margin);

            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(33, 37, 41);
            pdf.text(`${formatDate(prescription.prescription_date)} - ${(prescription.profiles as any)?.name || 'Profissional'}`, margin + 2, yPos);
            yPos += 10;

            const prescData: string[][] = [];
            if (prescription.diagnosis) prescData.push(['Diagnóstico', prescription.diagnosis]);
            if (prescription.general_instructions) prescData.push(['Instruções', prescription.general_instructions]);
            if (prescription.follow_up_notes) prescData.push(['Acompanhamento', prescription.follow_up_notes]);
            if (prescription.medications) {
              const meds = Array.isArray(prescription.medications) 
                ? prescription.medications.map((m: any) => `${m.name || m} ${m.dosage ? `- ${m.dosage}` : ''}`).join('; ')
                : JSON.stringify(prescription.medications);
              prescData.push(['Medicamentos', meds]);
            }

            if (prescData.length > 0) {
              autoTable(pdf, {
                startY: yPos,
                head: [],
                body: prescData,
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                  0: { fontStyle: 'bold', cellWidth: 35, textColor: [100, 100, 100] },
                  1: { cellWidth: 'auto' },
                },
                margin: { left: margin, right: margin },
              });
              yPos = (pdf as any).lastAutoTable.finalY + 8;
            }
          }
        }

        // ============== REGISTROS MÉDICOS / EVOLUÇÃO ==============
        if (medicalRecords.length > 0) {
          yPos = checkNewPage(pdf, yPos, 60, margin);
          yPos = addSectionHeader(pdf, `REGISTROS MÉDICOS / EVOLUÇÃO (${medicalRecords.length})`, yPos, margin);

          for (const record of medicalRecords) {
            yPos = checkNewPage(pdf, yPos, 50, margin);

            pdf.setFillColor(240, 248, 255);
            pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(33, 37, 41);
            pdf.text(`${formatDate(record.session_date)} - ${record.session_type} - ${(record.profiles as any)?.name || 'Profissional'}`, margin + 2, yPos);
            yPos += 10;

            const recordData: string[][] = [];
            if (record.progress_notes) recordData.push(['Evolução', record.progress_notes]);
            if (record.symptoms) recordData.push(['Sintomas', record.symptoms]);
            if (record.treatment_plan) recordData.push(['Plano de Tratamento', record.treatment_plan]);
            if (record.next_appointment_notes) recordData.push(['Próxima Consulta', record.next_appointment_notes]);
            if (record.session_duration) recordData.push(['Duração', `${record.session_duration} minutos`]);

            if (recordData.length > 0) {
              autoTable(pdf, {
                startY: yPos,
                head: [],
                body: recordData,
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                  0: { fontStyle: 'bold', cellWidth: 35, textColor: [100, 100, 100] },
                  1: { cellWidth: 'auto' },
                },
                margin: { left: margin, right: margin },
              });
              yPos = (pdf as any).lastAutoTable.finalY + 8;
            }
          }
        }

        // ============== RELATÓRIOS DE SESSÃO ==============
        if (employeeReports.length > 0) {
          yPos = checkNewPage(pdf, yPos, 60, margin);
          yPos = addSectionHeader(pdf, `RELATÓRIOS DE SESSÃO (${employeeReports.length})`, yPos, margin);

          const reportsTableData = employeeReports.map((report: any) => [
            formatDate(report.session_date),
            report.session_type || '-',
            (report.profiles as any)?.name || 'Profissional',
            report.session_duration ? `${report.session_duration} min` : '-',
            report.validation_status === 'validated' ? 'Validado' : 'Pendente'
          ]);

          autoTable(pdf, {
            startY: yPos,
            head: [['Data', 'Tipo', 'Profissional', 'Duração', 'Status']],
            body: reportsTableData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
            margin: { left: margin, right: margin },
          });

          yPos = (pdf as any).lastAutoTable.finalY + 10;
        }

        // ============== HISTÓRICO DE ATENDIMENTOS VALIDADOS ==============
        yPos = checkNewPage(pdf, yPos, 60, margin);
        yPos = addSectionHeader(pdf, `HISTÓRICO DE ATENDIMENTOS VALIDADOS (${attendanceReports.length})`, yPos, margin);

        if (attendanceReports.length === 0) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(108, 117, 125);
          pdf.text('Nenhum atendimento validado encontrado.', margin, yPos);
          yPos += 10;
        } else {
          const attendanceTableData = attendanceReports.map((att: any) => [
            formatDateTime(att.start_time),
            att.professional_name,
            getAttendanceTypeLabel(att.attendance_type),
            att.session_duration ? `${att.session_duration} min` : '-',
            att.amount_charged ? `R$ ${att.amount_charged.toFixed(2)}` : '-',
          ]);

          autoTable(pdf, {
            startY: yPos,
            head: [['Data/Hora', 'Profissional', 'Tipo', 'Duração', 'Valor']],
            body: attendanceTableData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            margin: { left: margin, right: margin },
          });

          yPos = (pdf as any).lastAutoTable.finalY + 10;

          // Detalhes de atendimentos
          for (let j = 0; j < Math.min(attendanceReports.length, 10); j++) {
            const att = attendanceReports[j];
            yPos = checkNewPage(pdf, yPos, 60, margin);

            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(33, 37, 41);
            pdf.text(`Atendimento ${j + 1}: ${formatDateTime(att.start_time)} - ${att.professional_name}`, margin + 2, yPos);
            yPos += 10;

            const detailsData: string[][] = [];
            if (att.techniques_used) detailsData.push(['Técnicas Utilizadas', att.techniques_used]);
            if (att.patient_response) detailsData.push(['Resposta do Paciente', att.patient_response]);
            if (att.session_notes) detailsData.push(['Observações da Sessão', att.session_notes]);
            if (att.observations) detailsData.push(['Observações', att.observations]);
            if (att.validated_by_name) detailsData.push(['Validado por', `${att.validated_by_name} em ${formatDateTime(att.validated_at)}`]);

            if (detailsData.length > 0) {
              autoTable(pdf, {
                startY: yPos,
                head: [],
                body: detailsData,
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                  0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 100, 100] },
                  1: { cellWidth: 'auto' },
                },
                margin: { left: margin, right: margin },
              });
              yPos = (pdf as any).lastAutoTable.finalY + 8;
            }
          }
        }

        // ============== HISTÓRICO DE AGENDAMENTOS ==============
        if (scheduleHistory.length > 0) {
          yPos = checkNewPage(pdf, yPos, 60, margin);
          yPos = addSectionHeader(pdf, `HISTÓRICO DE AGENDAMENTOS (${scheduleHistory.length})`, yPos, margin);

          const scheduleTableData = scheduleHistory.map((schedule: any) => [
            formatDateTime(schedule.start_time),
            schedule.title || '-',
            (schedule.profiles as any)?.name || 'Profissional',
            schedule.status === 'completed' ? 'Concluído' : 
            schedule.status === 'confirmed' ? 'Confirmado' : schedule.status
          ]);

          autoTable(pdf, {
            startY: yPos,
            head: [['Data/Hora', 'Título', 'Profissional', 'Status']],
            body: scheduleTableData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
            margin: { left: margin, right: margin },
          });

          yPos = (pdf as any).lastAutoTable.finalY + 10;
        }

        // ============== HISTÓRICO FINANCEIRO ==============
        if (clientPayments.length > 0) {
          yPos = checkNewPage(pdf, yPos, 60, margin);
          yPos = addSectionHeader(pdf, `HISTÓRICO FINANCEIRO (${clientPayments.length})`, yPos, margin);

          const paymentTableData = clientPayments.map((payment: any) => [
            formatDate(payment.created_at),
            payment.description || payment.payment_type || '-',
            `R$ ${payment.total_amount?.toFixed(2) || '0.00'}`,
            `R$ ${payment.amount_paid?.toFixed(2) || '0.00'}`,
            payment.status === 'paid' ? 'Pago' : 
            payment.status === 'pending' ? 'Pendente' : 
            payment.status === 'partial' ? 'Parcial' : payment.status
          ]);

          autoTable(pdf, {
            startY: yPos,
            head: [['Data', 'Descrição', 'Total', 'Pago', 'Status']],
            body: paymentTableData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
            margin: { left: margin, right: margin },
          });

          yPos = (pdf as any).lastAutoTable.finalY + 10;
        }

        setProgress(((i + 1) / clients.length) * 100);

        // Rodapé
        const currentPage = pdf.getNumberOfPages();
        pdf.setPage(currentPage);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Fundação Dom Bosco - Relatório Confidencial - Paciente ${i + 1}/${clients.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      // Salvar PDF
      const fileName = clients.length === 1 
        ? `Relatorio_Completo_${clients[0].name.replace(/\s+/g, '_')}.pdf`
        : `Relatorio_Completo_${clients.length}_Pacientes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      
      pdf.save(fileName);

      toast({
        title: "Relatório completo gerado!",
        description: `PDF com ${clients.length} paciente(s) incluindo todos os dados foi baixado.`,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Houve um problema ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setCurrentPatient('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório Completo em PDF
          </DialogTitle>
          <DialogDescription>
            {clients.length} paciente(s) selecionado(s) - Inclui TODOS os dados: notas, prescrições, evoluções, atendimentos, agendamentos e financeiro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de pacientes selecionados */}
          <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
            {clients.map((client, index) => (
              <div key={client.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium text-sm">{client.name}</span>
                </div>
                <Badge variant={client.unit === 'madre' ? 'default' : 'secondary'} className="text-xs">
                  {client.unit === 'madre' ? 'MADRE' : 
                   client.unit === 'floresta' ? 'Floresta' : 
                   client.unit === 'atendimento_floresta' ? 'Atend.' : 'N/A'}
                </Badge>
              </div>
            ))}
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Gerando relatório completo...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {currentPatient && (
                <p className="text-xs text-muted-foreground">Processando: {currentPatient}</p>
              )}
            </div>
          )}

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancelar
            </Button>
            <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
              <Download className="h-4 w-4" />
              {isGenerating ? 'Gerando...' : `Gerar PDF Completo (${clients.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
