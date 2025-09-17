import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Eye, Plus, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Client {
  id: string;
  name: string;
  cpf?: string;
  address?: string;
  responsible_name?: string;
  responsible_phone?: string;
  email?: string;
  phone?: string;
}

interface ContractData {
  clientName: string;
  clientCpf: string;
  responsibleName: string;
  responsibleCpf: string;
  address: string;
  paymentMethod: string;
  value: string;
  contractDate: string;
}

interface ContractGeneratorProps {
  client: Client;
}

export const ContractGenerator = ({ client }: ContractGeneratorProps) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const [contractData, setContractData] = useState<ContractData>({
    clientName: client.name || '',
    clientCpf: client.cpf || '',
    responsibleName: client.responsible_name || client.name || '',
    responsibleCpf: client.cpf || '',
    address: client.address || '',
    paymentMethod: 'pix',
    value: '500,00',
    contractDate: new Date().toISOString().split('T')[0]
  });

  const generateContractHTML = () => {
    return `
      <div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="/assets/fundacao-dom-bosco-logo.png" alt="Fundação Dom Bosco" style="max-width: 200px; margin-bottom: 20px;" />
          <h1 style="color: #2563eb; font-size: 24px; font-weight: bold; margin: 0;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
          <h2 style="color: #1e40af; font-size: 18px; margin: 10px 0;">AVALIAÇÃO NEUROPSICOLÓGICA</h2>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e40af; font-size: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 5px;">1. DAS PARTES</h3>
          <p style="text-align: justify; margin: 15px 0;">
            A pessoa jurídica <strong>Fundação Dom Bosco</strong>, registrada no CNPJ sob o nº <strong>17.278.904/0001-86</strong>, 
            com endereço comercial à Rua Urucuia, 18 – Bairro Floresta, Belo Horizonte – MG, denominada neste como 
            <strong>CONTRATADA</strong> e a pessoa física <strong>${contractData.responsibleName}</strong>, registrada no CPF 
            sob o nº <strong>${contractData.responsibleCpf}</strong>, denominada neste como <strong>CONTRATANTE</strong>, 
            responsável legal ou financeiro por <strong>${contractData.clientName}</strong>, inscrito no CPF sob o nº 
            <strong>${contractData.clientCpf}</strong>, denominado neste como beneficiário do serviço, residente à 
            <strong>${contractData.address}</strong>, firmam contrato de prestação de serviço de avaliação neuropsicológica 
            que será realizado conforme as cláusulas abaixo.
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e40af; font-size: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 5px;">2. CLÁUSULAS</h3>
          
          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 10px;">2.1. DO OBJETO</h4>
            <p style="text-align: justify; margin: 10px 0;">
              <strong>2.1.1.</strong> A avaliação neuropsicológica é um exame complementar realizado por profissional 
              especializado em neuropsicologia e que neste contrato é denominada como CONTRATADA, e compreende três etapas, 
              sendo: anamnese ou entrevista inicial, aplicação dos instrumentos de avaliação neuropsicológica e entrevista 
              devolutiva para entrega do laudo.
            </p>
            <p style="text-align: justify; margin: 10px 0;">
              <strong>2.1.2.</strong> Serão realizadas sessões para a coleta de dados, entrevistas, aplicações de escalas 
              e testes e possíveis reuniões com outros informantes, sendo que ao final do processo o CONTRATANTE terá direito 
              ao LAUDO NEUROPSICOLÓGICO, com a finalidade de atestar, aconselhar e encaminhar o paciente para o melhor 
              tratamento adequado com suas necessidades.
            </p>
            <p style="text-align: justify; margin: 10px 0;">
              <strong>2.1.3.</strong> O Laudo Neuropsicológico será entregue em data a ser definida pelo profissional em 
              acordo com o contratante durante a Sessão de Devolutiva com duração de 1 (uma) hora, podendo ser no formato 
              online ou presencial, a ser definido pelo neuropsicólogo.
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 10px;">2.2. DO SIGILO</h4>
            <p style="text-align: justify; margin: 10px 0;">
              <strong>2.2.1.</strong> A neuropsicóloga respeitará o sigilo profissional a fim de proteger, por meio da 
              confiabilidade, a intimidade das pessoas, grupos ou organizações, a que tenha acesso no exercício profissional 
              (Código de Ética do Psicólogo, artigo 9º).
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 10px;">2.3. ETAPAS E VIGÊNCIA</h4>
            <p style="text-align: justify; margin: 10px 0;">
              <strong>2.3.1.</strong> O processo de aplicação dos instrumentos ocorre com a utilização de, no mínimo 4 sessões 
              e no máximo 14 sessões, com duração 1 (uma) hora, a serem definidas pelo profissional a realizá-las, agendadas 
              previamente com o contratante.
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 10px;">2.4. VALOR E FORMA DE PAGAMENTO</h4>
            <p style="text-align: justify; margin: 10px 0;">
              <strong>2.4.1.</strong> O valor total dos serviços é de <strong>R$ ${contractData.value}</strong>, a ser pago 
              através de <strong>${contractData.paymentMethod}</strong>.
            </p>
            <p style="text-align: justify; margin: 10px 0;">
              <strong>2.4.2.</strong> O pagamento deverá ser efetuado de acordo com o cronograma estabelecido pela CONTRATADA.
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 10px;">2.5. DISPOSIÇÕES GERAIS</h4>
            <p style="text-align: justify; margin: 10px 0;">
              <strong>2.5.1.</strong> A vigência deste contrato encerrar-se-á imediatamente após a entrega do laudo 
              neuropsicológico e à quitação do valor correspondente à prestação de serviço acordada.
            </p>
          </div>
        </div>

        <div style="margin: 40px 0; text-align: center;">
          <p style="margin: 20px 0; font-weight: bold;">
            Data do Contrato: ${new Date(contractData.contractDate).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div style="margin: 40px 0; text-align: center; background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
          <h4 style="color: #1e40af; margin-bottom: 10px;">FUNDAÇÃO DOM BOSCO</h4>
          <p style="font-size: 12px; margin: 5px 0;">Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: (31) 3226-2616</p>
          <p style="font-size: 12px; margin: 5px 0;">Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: (31) 3386-1600</p>
          <p style="font-size: 12px; margin: 5px 0;">Belo Horizonte - MG - www.fundacaodombosco.org</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 60px; padding: 0 40px;">
          <div style="text-align: center; width: 250px;">
            <div style="border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px;"></div>
            <p style="font-weight: bold; margin: 0;">CONTRATADA</p>
            <p style="font-size: 12px; margin: 0;">Fundação Dom Bosco</p>
          </div>
          <div style="text-align: center; width: 250px;">
            <div style="border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px;"></div>
            <p style="font-weight: bold; margin: 0;">CONTRATANTE</p>
            <p style="font-size: 12px; margin: 0;">${contractData.responsibleName}</p>
          </div>
        </div>
      </div>
    `;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a temporary div for rendering
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateContractHTML();
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temp div
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm');
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add more pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      const fileName = `contrato-${contractData.clientName.replace(/\s+/g, '-').toLowerCase()}-${contractData.contractDate}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Contrato PDF gerado!",
        description: "O arquivo PDF foi baixado com sucesso.",
      });

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF do contrato.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewContract = () => {
    const contractHTML = generateContractHTML();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Contrato - ${contractData.clientName}</title>
            <meta charset="utf-8">
            <style>
              @media print {
                @page { margin: 2cm; }
                body { -webkit-print-color-adjust: exact; }
              }
              body { margin: 0; padding: 20px; }
            </style>
          </head>
          <body>
            ${contractHTML}
            <div style="text-align: center; margin: 20px 0; no-print;">
              <button onclick="window.print()" 
                      style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-right: 10px;">
                <span style="margin-right: 8px;">🖨️</span> Imprimir
              </button>
              <button onclick="window.close()" 
                      style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                Fechar
              </button>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Contratos</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contrato PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerar Contrato PDF de Avaliação Neuropsicológica</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  value={contractData.clientName}
                  onChange={(e) => setContractData({ ...contractData, clientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientCpf">CPF do Cliente</Label>
                <Input
                  id="clientCpf"
                  value={contractData.clientCpf}
                  onChange={(e) => setContractData({ ...contractData, clientCpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibleName">Responsável Financeiro</Label>
                <Input
                  id="responsibleName"
                  value={contractData.responsibleName}
                  onChange={(e) => setContractData({ ...contractData, responsibleName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibleCpf">CPF do Responsável</Label>
                <Input
                  id="responsibleCpf"
                  value={contractData.responsibleCpf}
                  onChange={(e) => setContractData({ ...contractData, responsibleCpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Textarea
                  id="address"
                  value={contractData.address}
                  onChange={(e) => setContractData({ ...contractData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select 
                  value={contractData.paymentMethod} 
                  onValueChange={(value) => setContractData({ ...contractData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Transferência Bancária">Transferência Bancária</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Boleto Bancário">Boleto Bancário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  value={contractData.value}
                  onChange={(e) => setContractData({ ...contractData, value: e.target.value })}
                  placeholder="500,00"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contractDate">Data do Contrato</Label>
                <Input
                  id="contractDate"
                  type="date"
                  value={contractData.contractDate}
                  onChange={(e) => setContractData({ ...contractData, contractDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handlePreviewContract}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button onClick={generatePDF} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contratos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">Nenhum contrato gerado ainda</p>
            <p className="text-sm mb-4">Clique em "Novo Contrato PDF" para gerar um contrato personalizado em PDF para este cliente.</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Primeiro Contrato PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
              <p className="text-sm">{client.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
              <p className="text-sm">{client.cpf || 'Não informado'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Responsável</Label>
              <p className="text-sm">{client.responsible_name || 'Não informado'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
              <p className="text-sm">{client.phone || 'Não informado'}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Endereço</Label>
              <p className="text-sm">{client.address || 'Não informado'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden contract template for PDF generation */}
      <div ref={contractRef} style={{ display: 'none' }}>
        <div dangerouslySetInnerHTML={{ __html: generateContractHTML() }} />
      </div>
    </div>
  );
};