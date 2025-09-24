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

  const generateContract = () => {
    return `
Contrato de Prestação de Serviços
Avaliação Neuropsicológica

1. Das partes
A pessoa jurídica Fundação Dom Bosco, registrada no CNPJ sob o nº 17.278.904/0001 86, com endereço
comercial à Rua Urucuia, 18 – Bairro Floresta, Belo Horizonte – MG, denominada neste como
CONTRATADA e a pessoa física
${contractData.responsibleName}, registrada no CPF
sob o nº ${contractData.responsibleCpf}, denominada neste como CONTRATANTE,
responsável legal ou financeiro por
${contractData.clientName}, inscrito no CPF sob o
nº ${contractData.clientCpf}, denominado neste como beneficiário do serviço,
residente à ${contractData.address}
firmam contrato de prestação de serviço de avaliação neuropsicológica que será realizado conforme as
cláusulas abaixo.

2. Cláusulas
2.1.1. A avaliação neuropsicológica é um exame complementar realizado por profissional
especializado em neuropsicologia e que neste contrato é denominada como CONTRATADA, e
compreende três etapas, sendo: anamnese ou entrevista inicial, aplicação dos instrumentos de avaliação
neuropsicológica e entrevista devolutiva para entrega do laudo.

2.1.2. Serão realizadas sessões para a coleta de dados, entrevistas, aplicações de escalas e testes e
possíveis reuniões com outros informantes, sendo que ao final do processo o CONTRATANTE terá
direito ao LAUDO NEUROPSICOLÓGICO, com a finalidade de atestar, aconselhar e encaminhar o
paciente para o melhor tratamento adequado com suas necessidades.

2.1.3. O Laudo Neuropsicológico será entregue em data a ser definida pelo profissional em acordo
com o contratante durante a Sessão de Devolutiva com duração de 1 (uma) hora, podendo ser no
formato online ou presencial, a ser definido pelo neuropsicólogo.

2.1.4. Os instrumentos de avaliação neuropsicológicos serão compostos de questionários, escalas,
inventários, tarefas e testes neuropsicológicos aprovados e validados para aplicação na população
brasileira obedecendo aos critérios de aprovação para uso do Conselho Federal de Psicologia.

2.1.5. As sessões de avaliação serão realizadas em horário combinado, estando a neuropsicóloga à
disposição do beneficiário do serviço naquele período.

2.2. Sigilo
2.2.1. A neuropsicóloga respeitará o sigilo profissional a fim de proteger, por meio da
confiabilidade, a intimidade das pessoas, grupos ou organizações, a que tenha acesso no exercício
profissional (Código de Ética do Psicólogo, artigo 9º).

2.3. Etapas da Avaliação Neuropsicológica e Vigência do Contrato
2.3.1. O processo de aplicação dos instrumentos ocorre com a utilização de, no mínimo 4 sessões
e no máximo 14 sessões, com duração 1 (uma) hora, a serem definidas pelo profissional a realizálas, agendadas previamente com o contratante.

2.3.2. O número de sessões, bem como a duração delas, será definido pela neuropsicóloga, de
acordo com a direcionamento e conhecimento da profissional, de maneira a obter-se sempre a
melhor qualidade de resultados.

2.3.3. Caso o paciente a ser avaliado ser estudante e/ou estar em acompanhamento terapêutico será
realizada entrevista com a equipe escolar e multidisciplinar como parte integrante da avaliação,
conforme for possível e necessário, através de questionários e/ou vídeo conferência.

2.3.4. A vigência deste contrato encerrar-se-á imediatamente após a entrega do laudo
neuropsicológico e à quitação do valor correspondente à prestação de serviço acordada.

2.3.5. As datas das sessões de avaliação serão definidas em comum acordo entre as partes e
registradas neste contrato.

2.4. Cancelamento e reagendamento de sessões
2.4.1. O Contratante concorda em notificar o Contratado com antecedência de 12 horas em caso
de cancelamento ou reagendamento de sessões.

2.5. Avaliação de menores de 18 anos
2.5.1. A avaliação neuropsicológica de menores de 18 anos será realizada somente com a ciência e
concordância de um responsável pela criança ou adolescente.

2.5.2. A criança/adolescente deverá comparecer ao consultório para avaliação acompanhado de um
responsável, o qual deverá estar presente no consultório ao final de cada sessão a fim de
acompanhar o menor até sua casa.

2.6. Honorários e formas de pagamento
2.6.1. A forma de pagamento deverá ser definida e devidamente registrada neste contrato durante
a primeira sessão de avaliação (anamnese).

2.6.2. O valor referente à prestação de serviço de Avaliação Neuropsicológica à vista ou parcelado
será no total de R$ ${contractData.value}
(${contractData.value}) O pagamento dos honorários
referentes ao serviço de Avaliação Neuropsicológica será efetuado:
( ) R$ _________________ à vista pagos na data da anamnese.
( ) R$ _________________ parcelado no Boleto
Uma parcela no dia da anamnese no valor de R$ _____________ e outra(s) _________ parcela(s)
no valor R$ _________________ nas datas: ___________________________________ .
( ) R$ _________________ no Cartão de crédito, parcelado de ___________ vezes.

2.6.3. O laudo será entregue SOMENTE após a quitação do valor total da avaliação.

2.6.4. As sessões de avaliação SOMENTE terão início após o pagamento da primeira parcela.

2.6.5. Os pagamentos por transferência, deposito bancário ou pix deverão ser realizados conforme
os dados informados e posteriormente com o envio do respectivo comprovante para o e-mail:
financeiro@fundacaodombosco.org com os dados referentes ao paciente e o responsável financeiro
descriminados no corpo do e-mail.

2.6.6. Caso o contratante opte pelo parcelamento do pagamento em 2 (duas) ou mais parcelas, fica
vedada a condição de vincular o pagamento do serviço à entrega do Laudo Neuropsicológico. O
contratante deve, de forma imperativa, cumprir rigorosamente as datas estipuladas nas cláusulas
anteriores. sob pena de rescisão contratual, nos termos contantes no item 2.7 deste contrato.

2.7. Da Rescisão
2.7.1. O presente instrumento poderá ser rescindido caso qualquer das partes descumpra o disposto
neste contrato.

2.7.2. Na hipótese de a CONTRANTE solicitar a rescisão antecipada deste contrato sem justa
causa, será obrigada a pagar a CONTRATADA por inteiro qualquer retribuição vencida e não paga
e 50% (cinquenta por cento) do que ela receberia até o final do contrato.

2.7.3. Na hipótese de a CONTRATADA solicitar a rescisão antecipada deste contrato sem justa
causa terá direito a retribuição vencida.

2.7.4. Caso a CONTRATANTE não compareça a 4 sessões seguidas sem informar a
CONTRATADA e não houver possibilidade de contato após esse período, este contrato fica
rescindido automaticamente e fica obrigada a pagar 100% do valor do contrato.

2.7.5. Com a assinatura, ambas as partes atestam que tiveram oportunidade de ler, discutir, definir
e concordar com todas as cláusulas deste contrato.

Belo Horizonte, ________ de _______________ de ______________.

__________________________________________________
Contratada

___________________________________________________
Contratante
    `.trim();
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      if (!contractRef.current) return;

      const contractContent = generateContract();
      const doc = new jsPDF();
      
      // Adicionar conteúdo do contrato ao canvas temporário
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `<pre style="font-family: Arial, sans-serif; font-size: 12px; white-space: pre-wrap; line-height: 1.4; margin: 20px;">${contractContent}</pre>`;
      tempDiv.style.width = '210mm';
      tempDiv.style.background = 'white';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `contrato-${contractData.clientName.replace(/\s+/g, '-').toLowerCase()}-${contractData.contractDate}.pdf`;
      doc.save(fileName);

      toast({
        title: "Contrato gerado!",
        description: "O PDF foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o PDF.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewContract = () => {
    const contractContent = generateContract();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Contrato - ${contractData.clientName}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                line-height: 1.4; 
                max-width: 800px; 
                margin: 0 auto; 
                font-size: 12px;
              }
              .contract-content { 
                white-space: pre-line; 
                margin-top: 20px;
              }
              .no-print { margin-bottom: 20px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Imprimir</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
            </div>
            <div class="contract-content">${contractContent}</div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerar Contrato para {client.name}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractType">Tipo de Contrato</Label>
                  <Input
                    id="contractType"
                    value={contractData.contractType}
                    onChange={(e) => setContractData(prev => ({ ...prev, contractType: e.target.value }))}
                    placeholder="Avaliação Neuropsicológica"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    value={contractData.clientName}
                    onChange={(e) => setContractData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Nome completo do cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="clientCpf">CPF do Cliente</Label>
                  <Input
                    id="clientCpf"
                    value={contractData.clientCpf}
                    onChange={(e) => setContractData(prev => ({ ...prev, clientCpf: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="responsibleName">Responsável Financeiro</Label>
                  <Input
                    id="responsibleName"
                    value={contractData.responsibleName}
                    onChange={(e) => setContractData(prev => ({ ...prev, responsibleName: e.target.value }))}
                    placeholder="Nome completo do responsável"
                  />
                </div>
                <div>
                  <Label htmlFor="responsibleCpf">CPF do Responsável</Label>
                  <Input
                    id="responsibleCpf"
                    value={contractData.responsibleCpf}
                    onChange={(e) => setContractData(prev => ({ ...prev, responsibleCpf: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select
                    value={contractData.paymentMethod}
                    onValueChange={(value) => setContractData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="à vista">À vista</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartão">Cartão de Crédito</SelectItem>
                      <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    value={contractData.value}
                    onChange={(e) => setContractData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="1.600,00"
                  />
                </div>
                <div>
                  <Label htmlFor="contractDate">Data do Contrato</Label>
                  <Input
                    id="contractDate"
                    type="date"
                    value={contractData.contractDate}
                    onChange={(e) => setContractData(prev => ({ ...prev, contractDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="address">Endereço Completo</Label>
                <Textarea
                  id="address"
                  value={contractData.address}
                  onChange={(e) => setContractData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo do cliente"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handlePreviewContract}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Visualizar
                </Button>
                <Button
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? "Gerando..." : "Baixar PDF"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contratos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum contrato disponível no momento
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Nome:</strong> {client.name}</p>
              <p><strong>CPF:</strong> {client.cpf || 'Não informado'}</p>
            </div>
            <div>
              <p><strong>Telefone:</strong> {client.phone || 'Não informado'}</p>
              <p><strong>Email:</strong> {client.email || 'Não informado'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Hidden contract preview for PDF generation */}
      <div 
        ref={contractRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          backgroundColor: 'white',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          lineHeight: '1.4'
        }}
      />
    </div>
  );
};