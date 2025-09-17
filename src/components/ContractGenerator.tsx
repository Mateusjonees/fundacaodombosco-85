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
  contractType: string;
  clientName: string;
  clientCpf: string;
  responsibleName: string;
  responsibleCpf: string;
  paymentMethod: string;
  value: string;
  contractDate: string;
  address: string;
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
    contractType: 'Avaliação Neuropsicológica',
    clientName: client.name || '',
    clientCpf: client.cpf || '',
    responsibleName: client.responsible_name || client.name || '',
    responsibleCpf: client.cpf || '',
    paymentMethod: 'PIX',
    value: '1.600,00',
    contractDate: new Date().toISOString().split('T')[0],
    address: client.address || ''
  });

  const generateContractHTML = () => {
    return `
      <div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; font-size: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; font-size: 20px; font-weight: bold; margin: 0;">Contrato de Prestação de Serviços</h1>
          <h2 style="color: #1e40af; font-size: 16px; margin: 10px 0;">Avaliação Neuropsicológica</h2>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1e40af; font-size: 14px; font-weight: bold; margin-bottom: 10px;">1. Das partes</h3>
          <p style="text-align: justify; margin: 10px 0; line-height: 1.5;">
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

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1e40af; font-size: 14px; font-weight: bold; margin-bottom: 10px;">2. Cláusulas</h3>
          
          <div style="margin: 15px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.1.1.</h4>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              A avaliação neuropsicológica é um exame complementar realizado por profissional especializado em neuropsicologia 
              e que neste contrato é denominada como CONTRATADA, e compreende três etapas, sendo: anamnese ou entrevista inicial, 
              aplicação dos instrumentos de avaliação neuropsicológica e entrevista devolutiva para entrega do laudo.
            </p>
          </div>

          <div style="margin: 15px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.1.2.</h4>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Serão realizadas sessões para a coleta de dados, entrevistas, aplicações de escalas e testes e possíveis reuniões 
              com outros informantes, sendo que ao final do processo o CONTRATANTE terá direito ao LAUDO NEUROPSICOLÓGICO, 
              com a finalidade de atestar, aconselhar e encaminhar o paciente para o melhor tratamento adequado com suas necessidades.
            </p>
          </div>

          <div style="margin: 15px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.1.3.</h4>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              O Laudo Neuropsicológico será entregue em data a ser definida pelo profissional em acordo com o contratante 
              durante a Sessão de Devolutiva com duração de 1 (uma) hora, podendo ser no formato online ou presencial, 
              a ser definido pelo neuropsicólogo.
            </p>
          </div>

          <div style="margin: 15px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.1.4.</h4>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Os instrumentos de avaliação neuropsicológicos serão compostos de questionários, escalas, inventários, tarefas 
              e testes neuropsicológicos aprovados e validados para aplicação na população brasileira obedecendo aos critérios 
              de aprovação para uso do Conselho Federal de Psicologia.
            </p>
          </div>

          <div style="margin: 15px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.1.5.</h4>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              As sessões de avaliação serão realizadas em horário combinado, estando a neuropsicóloga à disposição do 
              beneficiário do serviço naquele período.
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.2. Sigilo</h4>
            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.2.1.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              A neuropsicóloga respeitará o sigilo profissional a fim de proteger, por meio da confiabilidade, a intimidade 
              das pessoas, grupos ou organizações, a que tenha acesso no exercício profissional (Código de Ética do Psicólogo, artigo 9º).
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.3. Etapas da Avaliação Neuropsicológica e Vigência do Contrato</h4>
            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.3.1.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              O processo de aplicação dos instrumentos ocorre com a utilização de, no mínimo 4 sessões e no máximo 14 sessões, 
              com duração 1 (uma) hora, a serem definidas pelo profissional a realizá-las, agendadas previamente com o contratante.
            </p>
            
            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.3.2.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              O número de sessões, bem como a duração delas, será definido pela neuropsicóloga, de acordo com a direcionamento 
              e conhecimento da profissional, de maneira a obter-se sempre a melhor qualidade de resultados.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.3.3.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Caso o paciente a ser avaliado ser estudante e/ou estar em acompanhamento terapêutico será realizada entrevista 
              com a equipe escolar e multidisciplinar como parte integrante da avaliação, conforme for possível e necessário, 
              através de questionários e/ou vídeo conferência.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.3.4.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              A vigência deste contrato encerrar-se-á imediatamente após a entrega do laudo neuropsicológico e à quitação 
              do valor correspondente à prestação de serviço acordada.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.3.5.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              As datas das sessões de avaliação serão definidas em comum acordo entre as partes e registradas neste contrato.
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.4. Cancelamento e reagendamento de sessões</h4>
            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.4.1.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              O Contratante concorda em notificar o Contratado com antecedência de 12 horas em caso de cancelamento ou reagendamento de sessões.
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.5. Avaliação de menores de 18 anos</h4>
            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.5.1.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              A avaliação neuropsicológica de menores de 18 anos será realizada somente com a ciência e concordância de um responsável pela criança ou adolescente.
            </p>
            
            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.5.2.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              A criança/adolescente deverá comparecer ao consultório para avaliação acompanhado de um responsável, o qual deverá 
              estar presente no consultório ao final de cada sessão a fim de acompanhar o menor até sua casa.
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.6. Honorários e formas de pagamento</h4>
            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.6.1.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              A forma de pagamento deverá ser definida e devidamente registrada neste contrato durante a primeira sessão de avaliação (anamnese).
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.6.2.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              O valor referente à prestação de serviço de Avaliação Neuropsicológica à vista ou parcelado será no total de 
              <strong>R$ ${contractData.value}</strong>. O pagamento dos honorários 
              referentes ao serviço de Avaliação Neuropsicológica será efetuado através de <strong>${contractData.paymentMethod}</strong>.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.6.3.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              O laudo será entregue SOMENTE após a quitação do valor total da avaliação.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.6.4.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              As sessões de avaliação SOMENTE terão início após o pagamento da primeira parcela.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.6.5.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Os pagamentos por transferência, deposito bancário ou pix deverão ser realizados conforme os dados informados 
              e posteriormente com o envio do respectivo comprovante para o e-mail: financeiro@fundacaodombosco.org com os 
              dados referentes ao paciente e o responsável financeiro descriminados no corpo do e-mail.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.6.6.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Caso o contratante opte pelo parcelamento do pagamento em 2 (duas) ou mais parcelas, fica vedada a condição 
              de vincular o pagamento do serviço à entrega do Laudo Neuropsicológico. O contratante deve, de forma imperativa, 
              cumprir rigorosamente as datas estipuladas nas cláusulas anteriores, sob pena de rescisão contratual, nos termos 
              contantes no item 2.7 deste contrato.
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1e40af; font-size: 13px; font-weight: bold; margin-bottom: 8px;">2.7. Da Rescisão</h4>
            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.7.1.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              O presente instrumento poderá ser rescindido caso qualquer das partes descumpra o disposto neste contrato.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.7.2.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Na hipótese de a CONTRATANTE solicitar a rescisão antecipada deste contrato sem justa causa, será obrigada a 
              pagar a CONTRATADA por inteiro qualquer retribuição vencida e não paga e 50% (cinquenta por cento) do que ela 
              receberia até o final do contrato.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.7.3.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Na hipótese de a CONTRATADA solicitar a rescisão antecipada deste contrato sem justa causa terá direito a retribuição vencida.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.7.4.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Caso a CONTRATANTE não compareça a 4 sessões seguidas sem informar a CONTRATADA e não houver possibilidade 
              de contato após esse período, este contrato fica rescindido automaticamente e fica obrigada a pagar 100% do valor do contrato.
            </p>

            <h5 style="color: #1e40af; font-size: 12px; font-weight: bold; margin-bottom: 5px;">2.7.5.</h5>
            <p style="text-align: justify; margin: 8px 0; line-height: 1.5;">
              Com a assinatura, ambas as partes atestam que tiveram oportunidade de ler, discutir, definir e concordar com todas as cláusulas deste contrato.
            </p>
          </div>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <p style="margin: 15px 0; font-weight: bold;">
            Belo Horizonte, ${new Date(contractData.contractDate).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div style="display: flex; justify-content: space-between; margin: 40px 0; padding: 0 20px;">
          <div style="text-align: center; width: 250px;">
            <div style="border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px;"></div>
            <p style="font-weight: bold; margin: 0; font-size: 12px;">Contratada</p>
          </div>
          <div style="text-align: center; width: 250px;">
            <div style="border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px;"></div>
            <p style="font-weight: bold; margin: 0; font-size: 12px;">Contratante</p>
          </div>
        </div>

        <div style="margin: 30px 0; text-align: center; background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; page-break-inside: avoid;">
          <h4 style="color: #1e40af; margin-bottom: 8px; font-size: 14px;">FUNDAÇÃO DOM BOSCO</h4>
          <p style="font-size: 11px; margin: 3px 0;">Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: (31) 3226-2616</p>
          <p style="font-size: 11px; margin: 3px 0;">Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: (31) 3386-1600</p>
          <p style="font-size: 11px; margin: 3px 0;">Belo Horizonte - MG - www.fundacaodombosco.org</p>
          <p style="font-size: 10px; margin: 8px 0; text-align: justify;">
            Em cumprimento à Lei Geral de Proteção de dados n° 13.709/2020, o destinatário deste documento se responsabiliza 
            por manter medidas de segurança, técnicas e administrativas suficientes a proteger os dados pessoais do Titular 
            de acessos não autorizados e de situações acidentais ou inadequadas, comunicando ao Titular, caso ocorra algum 
            incidente de segurança que possa.
          </p>
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contractType">Tipo de Contrato</Label>
                <Select 
                  value={contractData.contractType} 
                  onValueChange={(value) => setContractData({ ...contractData, contractType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Avaliação Neuropsicológica">Avaliação Neuropsicológica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Paciente</Label>
                  <Input
                    id="clientName"
                    value={contractData.clientName}
                    onChange={(e) => setContractData({ ...contractData, clientName: e.target.value })}
                    placeholder="Nome completo do paciente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientCpf">CPF do Paciente</Label>
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
                    placeholder="Nome do responsável"
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
                    placeholder="1.600,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractDate">Data do Contrato</Label>
                  <Input
                    id="contractDate"
                    type="date"
                    value={contractData.contractDate}
                    onChange={(e) => setContractData({ ...contractData, contractDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={contractData.address}
                    onChange={(e) => setContractData({ ...contractData, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade, estado, CEP"
                  />
                </div>
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
            <p className="text-sm mb-4">Clique em "Novo Contrato PDF" para gerar um contrato personalizado em PDF para este paciente.</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Primeiro Contrato PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
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