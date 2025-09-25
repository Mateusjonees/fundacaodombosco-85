import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import logoImage from '@/assets/fundacao-dom-bosco-logo.png';

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
  treatment_expectations?: string;
  clinical_observations?: string;
  medical_history?: string;
  current_symptoms?: string;
  treatment_progress?: string;
  is_active: boolean;
  created_at: string;
}

interface PatientReportGeneratorProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientReportGenerator({ client, isOpen, onClose }: PatientReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatBirthDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return `${birthDate.toLocaleDateString('pt-BR')} (${age} anos)`;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const reportElement = document.getElementById('patient-report');
      if (!reportElement) return;

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Relatorio_${client.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
      
      toast({
        title: "Relatório gerado com sucesso!",
        description: "O arquivo PDF foi baixado.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Houve um problema ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const printReport = () => {
    const reportElement = document.getElementById('patient-report');
    if (!reportElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório - ${client.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .report-header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 200px; margin-bottom: 20px; }
            .report-section { margin-bottom: 20px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .field { display: flex; flex-direction: column; }
            .field-label { font-weight: bold; margin-bottom: 5px; }
            .field-value { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            .full-width { grid-column: span 2; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${reportElement.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório do Paciente - {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4 no-print">
          <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
            <Download className="h-4 w-4" />
            {isGenerating ? 'Gerando...' : 'Baixar PDF'}
          </Button>
          <Button onClick={printReport} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <div id="patient-report" className="bg-white p-8 space-y-6">
          {/* Cabeçalho */}
          <div className="report-header text-center">
            <img src={logoImage} alt="Fundação Dom Bosco" className="mx-auto max-w-[200px] mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">RELATÓRIO DO PACIENTE</h1>
            <p className="text-sm text-gray-600 mt-2">
              Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>

          <Separator />

          {/* Dados Pessoais */}
          <div className="report-section">
            <h2 className="section-title text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
              DADOS PESSOAIS
            </h2>
            <div className="field-grid grid grid-cols-2 gap-4">
              <div className="field">
                <div className="field-label font-medium text-gray-700">Nome Completo:</div>
                <div className="field-value p-2 border border-gray-200 rounded">{client.name}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">CPF:</div>
                <div className="field-value p-2 border border-gray-200 rounded">{client.cpf || 'Não informado'}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Data de Nascimento:</div>
                <div className="field-value p-2 border border-gray-200 rounded">{formatBirthDate(client.birth_date)}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Telefone:</div>
                <div className="field-value p-2 border border-gray-200 rounded">{client.phone || 'Não informado'}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Email:</div>
                <div className="field-value p-2 border border-gray-200 rounded">{client.email || 'Não informado'}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Unidade:</div>
                <div className="field-value p-2 border border-gray-200 rounded">
                  <Badge variant={client.unit === 'madre' ? 'default' : 'secondary'}>
                    {client.unit === 'madre' ? 'MADRE' : 'Floresta'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="field full-width mt-4">
              <div className="field-label font-medium text-gray-700">Endereço:</div>
              <div className="field-value p-2 border border-gray-200 rounded">{client.address || 'Não informado'}</div>
            </div>
          </div>

          {/* Responsável */}
          {(client.responsible_name || client.responsible_phone) && (
            <div className="report-section">
              <h2 className="section-title text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
                RESPONSÁVEL
              </h2>
              <div className="field-grid grid grid-cols-2 gap-4">
                <div className="field">
                  <div className="field-label font-medium text-gray-700">Nome do Responsável:</div>
                  <div className="field-value p-2 border border-gray-200 rounded">{client.responsible_name || 'Não informado'}</div>
                </div>
                <div className="field">
                  <div className="field-label font-medium text-gray-700">Telefone do Responsável:</div>
                  <div className="field-value p-2 border border-gray-200 rounded">{client.responsible_phone || 'Não informado'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Informações Clínicas */}
          <div className="report-section">
            <h2 className="section-title text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
              INFORMAÇÕES CLÍNICAS
            </h2>
            <div className="space-y-4">
              <div className="field">
                <div className="field-label font-medium text-gray-700">Diagnóstico:</div>
                <div className="field-value p-2 border border-gray-200 rounded min-h-[60px]">{client.diagnosis || 'Não informado'}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Queixa Neuropsicológica:</div>
                <div className="field-value p-2 border border-gray-200 rounded min-h-[60px]">{client.neuropsych_complaint || 'Não informado'}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Sintomas Atuais:</div>
                <div className="field-value p-2 border border-gray-200 rounded min-h-[60px]">{client.current_symptoms || 'Não informado'}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Histórico Médico:</div>
                <div className="field-value p-2 border border-gray-200 rounded min-h-[60px]">{client.medical_history || 'Não informado'}</div>
              </div>
            </div>
          </div>

          {/* Tratamento */}
          <div className="report-section">
            <h2 className="section-title text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
              TRATAMENTO
            </h2>
            <div className="space-y-4">
              <div className="field">
                <div className="field-label font-medium text-gray-700">Expectativas do Tratamento:</div>
                <div className="field-value p-2 border border-gray-200 rounded min-h-[60px]">{client.treatment_expectations || 'Não informado'}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Progresso do Tratamento:</div>
                <div className="field-value p-2 border border-gray-200 rounded min-h-[60px]">{client.treatment_progress || 'Não informado'}</div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Observações Clínicas:</div>
                <div className="field-value p-2 border border-gray-200 rounded min-h-[60px]">{client.clinical_observations || 'Não informado'}</div>
              </div>
            </div>
          </div>

          {/* Informações Administrativas */}
          <div className="report-section">
            <h2 className="section-title text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
              INFORMAÇÕES ADMINISTRATIVAS
            </h2>
            <div className="field-grid grid grid-cols-2 gap-4">
              <div className="field">
                <div className="field-label font-medium text-gray-700">Status:</div>
                <div className="field-value p-2 border border-gray-200 rounded">
                  <Badge variant={client.is_active ? 'default' : 'destructive'}>
                    {client.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <div className="field">
                <div className="field-label font-medium text-gray-700">Data de Cadastro:</div>
                <div className="field-value p-2 border border-gray-200 rounded">{formatDate(client.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="report-footer text-center pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Fundação Dom Bosco - Sistema de Gestão de Pacientes
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Este relatório foi gerado automaticamente pelo sistema em {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}