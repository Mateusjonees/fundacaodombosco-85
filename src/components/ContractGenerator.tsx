import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Printer, Eye, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

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
  contratante: string;
  contratanteCpf: string;
  beneficiario: string;
  beneficiarioCpf: string;
  endereco: string;
  valorTotal: string;
  valorExtenso: string;
  formaPagamento: string;
  valorVista?: string;
  valorParcela?: string;
  numeroParcelas?: string;
  datasPagamento?: string;
  cartaoCredito?: {
    valor: string;
    parcelas: string;
  };
  data: string;
  mes: string;
  ano: string;
}

interface ContractGeneratorProps {
  client: Client;
}

export const ContractGenerator = ({ client }: ContractGeneratorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [contractData, setContractData] = useState<ContractData>({
    contratante: client.responsible_name || client.name || '',
    contratanteCpf: client.cpf || '',
    beneficiario: client.name || '',
    beneficiarioCpf: client.cpf || '',
    endereco: client.address || '',
    valorTotal: '1.600,00',
    valorExtenso: 'mil e seiscentos reais',
    formaPagamento: 'vista',
    data: new Date().getDate().toString(),
    mes: new Date().toLocaleString('pt-BR', { month: 'long' }),
    ano: new Date().getFullYear().toString()
  });

  const contractRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof ContractData, value: string) => {
    setContractData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDF = async () => {
    if (!contractRef.current) return;

    try {
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
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
      
      pdf.save(`Contrato_${contractData.beneficiario || 'Neuropsicologia'}.pdf`);
      
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
    }
  };

  const printContract = () => {
    if (!contractRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato de Avaliação Neuropsicológica</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 14px; line-height: 1.6; }
            .contract { max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; margin-bottom: 30px; }
            h2 { margin-top: 25px; margin-bottom: 10px; }
            h3 { margin-top: 20px; margin-bottom: 8px; }
            p { margin-bottom: 12px; text-align: justify; }
            .underline { border-bottom: 1px solid black; display: inline-block; min-width: 200px; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature { text-align: center; }
            .signature-line { border-bottom: 1px solid black; width: 300px; padding-top: 50px; margin-bottom: 5px; }
            @media print { 
              body { margin: 0; padding: 15px; font-size: 12px; }
            }
          </style>
        </head>
        <body>
          ${contractRef.current.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handlePreviewContract = () => {
    const newWindow = window.open('', '_blank');
    if (!newWindow || !contractRef.current) return;
    
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato - ${contractData.beneficiario}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 14px; line-height: 1.6; }
            .no-print { margin-bottom: 20px; }
            .contract { max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; margin-bottom: 30px; }
            h2 { margin-top: 25px; margin-bottom: 10px; }
            h3 { margin-top: 20px; margin-bottom: 8px; }
            p { margin-bottom: 12px; text-align: justify; }
            .underline { border-bottom: 1px solid black; display: inline-block; min-width: 200px; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature { text-align: center; }
            .signature-line { border-bottom: 1px solid black; width: 300px; padding-top: 50px; margin-bottom: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Imprimir</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
          </div>
          ${contractRef.current.innerHTML}
        </body>
      </html>
    `);
    
    newWindow.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerar Contrato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contrato de Avaliação Neuropsicológica - {client.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Formulário de dados */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contratante">Nome do Contratante</Label>
                      <Input
                        id="contratante"
                        value={contractData.contratante}
                        onChange={(e) => handleInputChange('contratante', e.target.value)}
                        placeholder="Nome completo do responsável"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contratanteCpf">CPF do Contratante</Label>
                      <Input
                        id="contratanteCpf"
                        value={contractData.contratanteCpf}
                        onChange={(e) => handleInputChange('contratanteCpf', e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="beneficiario">Nome do Beneficiário</Label>
                      <Input
                        id="beneficiario"
                        value={contractData.beneficiario}
                        onChange={(e) => handleInputChange('beneficiario', e.target.value)}
                        placeholder="Nome do paciente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="beneficiarioCpf">CPF do Beneficiário</Label>
                      <Input
                        id="beneficiarioCpf"
                        value={contractData.beneficiarioCpf}
                        onChange={(e) => handleInputChange('beneficiarioCpf', e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Textarea
                      id="endereco"
                      value={contractData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      placeholder="Endereço completo do beneficiário"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valorTotal">Valor Total (R$)</Label>
                      <Input
                        id="valorTotal"
                        value={contractData.valorTotal}
                        onChange={(e) => handleInputChange('valorTotal', e.target.value)}
                        placeholder="1.600,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="valorExtenso">Valor por Extenso</Label>
                      <Input
                        id="valorExtenso"
                        value={contractData.valorExtenso}
                        onChange={(e) => handleInputChange('valorExtenso', e.target.value)}
                        placeholder="mil e seiscentos reais"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de ação */}
              <div className="flex gap-2 justify-end">
                <Button onClick={handlePreviewContract} variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Visualizar
                </Button>
                <Button onClick={printContract} variant="outline" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                <Button onClick={generatePDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>

              {/* Contrato gerado */}
              <div ref={contractRef} className="contract bg-white p-8 shadow-lg border font-serif">
                <h1 className="text-center text-xl font-bold mb-6">Contrato de Prestação de Serviços<br/>Avaliação Neuropsicológica</h1>
                
                <h2 className="text-lg font-bold mb-4">1. Das partes</h2>
                <p className="text-justify mb-4">
                  A pessoa jurídica Fundação Dom Bosco, registrada no CNPJ sob o nº 17.278.904/0001 86, com endereço 
                  comercial à Rua Urucuia, 18 – Bairro Floresta, Belo Horizonte – MG, denominada neste como 
                  CONTRATADA e a pessoa física <span className="underline">{contractData.contratante || '__________________________________________________________________'}</span>, registrada no CPF 
                  sob o nº <span className="underline">{contractData.contratanteCpf || '____________________________________'}</span>, denominada neste como CONTRATANTE, 
                  responsável legal ou financeiro por <span className="underline">{contractData.beneficiario || '________________________________________________________________'}</span>, inscrito no CPF sob o 
                  nº<span className="underline">{contractData.beneficiarioCpf || '_________________________________________'}</span>, denominado neste como beneficiário do serviço, 
                  residente à <span className="underline">{contractData.endereco || '__________________________________________________________________'}</span> 
                  firmam contrato de prestação de serviço de avaliação neuropsicológica que será realizado conforme as 
                  cláusulas abaixo.
                </p>

                <h2 className="text-lg font-bold mb-4">2. Cláusulas</h2>

                <h3 className="font-bold mb-2">2.1.1.</h3>
                <p className="text-justify mb-4">
                  A avaliação neuropsicológica é um exame complementar realizado por profissional 
                  especializado em neuropsicologia e que neste contrato é denominada como CONTRATADA, e 
                  compreende três etapas, sendo: anamnese ou entrevista inicial, aplicação dos instrumentos de avaliação 
                  neuropsicológica e entrevista devolutiva para entrega do laudo.
                </p>

                <h3 className="font-bold mb-2">2.1.2.</h3>
                <p className="text-justify mb-4">
                  Serão realizadas sessões para a coleta de dados, entrevistas, aplicações de escalas e testes e 
                  possíveis reuniões com outros informantes, sendo que ao final do processo o CONTRATANTE terá 
                  direito ao LAUDO NEUROPSICOLÓGICO, com a finalidade de atestar, aconselhar e encaminhar o 
                  paciente para o melhor tratamento adequado com suas necessidades.
                </p>

                <h3 className="font-bold mb-2">2.1.3.</h3>
                <p className="text-justify mb-4">
                  O Laudo Neuropsicológico será entregue em data a ser definida pelo profissional em acordo 
                  com o contratante durante a Sessão de Devolutiva com duração de 1 (uma) hora, podendo ser no 
                  formato online ou presencial, a ser definido pelo neuropsicólogo.
                </p>

                <h3 className="font-bold mb-2">2.1.4.</h3>
                <p className="text-justify mb-4">
                  Os instrumentos de avaliação neuropsicológicos serão compostos de questionários, escalas, 
                  inventários, tarefas e testes neuropsicológicos aprovados e validados para aplicação na população 
                  brasileira obedecendo aos critérios de aprovação para uso do Conselho Federal de Psicologia.
                </p>

                <h3 className="font-bold mb-2">2.1.5.</h3>
                <p className="text-justify mb-4">
                  As sessões de avaliação serão realizadas em horário combinado, estando a neuropsicóloga à 
                  disposição do beneficiário do serviço naquele período.
                </p>

                <h2 className="text-lg font-bold mb-4">2.2. Sigilo</h2>

                <h3 className="font-bold mb-2">2.2.1.</h3>
                <p className="text-justify mb-4">
                  A neuropsicóloga respeitará o sigilo profissional a fim de proteger, por meio da 
                  confiabilidade, a intimidade das pessoas, grupos ou organizações, a que tenha acesso no exercício 
                  profissional (Código de Ética do Psicólogo, artigo 9º).
                </p>

                <h2 className="text-lg font-bold mb-4">2.3. Etapas da Avaliação Neuropsicológica e Vigência do Contrato</h2>

                <h3 className="font-bold mb-2">2.3.1.</h3>
                <p className="text-justify mb-4">
                  O processo de aplicação dos instrumentos ocorre com a utilização de, no mínimo 4 sessões 
                  e no máximo 14 sessões, com duração 1 (uma) hora, a serem definidas pelo profissional a realizá-
                  las, agendadas previamente com o contratante.
                </p>

                <h3 className="font-bold mb-2">2.3.2.</h3>
                <p className="text-justify mb-4">
                  O número de sessões, bem como a duração delas, será definido pela neuropsicóloga, de 
                  acordo com a direcionamento e conhecimento da profissional, de maneira a obter-se sempre a 
                  melhor qualidade de resultados.
                </p>

                <h3 className="font-bold mb-2">2.3.3.</h3>
                <p className="text-justify mb-4">
                  Caso o paciente a ser avaliado ser estudante e/ou estar em acompanhamento terapêutico será 
                  realizada entrevista com a equipe escolar e multidisciplinar como parte integrante da avaliação, 
                  conforme for possível e necessário, através de questionários e/ou vídeo conferência.
                </p>

                <h3 className="font-bold mb-2">2.3.4.</h3>
                <p className="text-justify mb-4">
                  A vigência deste contrato encerrar-se-á imediatamente após a entrega do laudo 
                  neuropsicológico e à quitação do valor correspondente à prestação de serviço acordada.
                </p>

                <h3 className="font-bold mb-2">2.3.5.</h3>
                <p className="text-justify mb-4">
                  As datas das sessões de avaliação serão definidas em comum acordo entre as partes e 
                  registradas neste contrato.
                </p>

                <h2 className="text-lg font-bold mb-4">2.4. Cancelamento e reagendamento de sessões</h2>

                <h3 className="font-bold mb-2">2.4.1.</h3>
                <p className="text-justify mb-4">
                  O Contratante concorda em notificar o Contratado com antecedência de 12 horas em caso 
                  de cancelamento ou reagendamento de sessões.
                </p>

                <h2 className="text-lg font-bold mb-4">2.5. Avaliação de menores de 18 anos</h2>

                <h3 className="font-bold mb-2">2.5.1.</h3>
                <p className="text-justify mb-4">
                  A avaliação neuropsicológica de menores de 18 anos será realizada somente com a ciência e 
                  concordância de um responsável pela criança ou adolescente.
                </p>

                <h3 className="font-bold mb-2">2.5.2.</h3>
                <p className="text-justify mb-4">
                  A criança/adolescente deverá comparecer ao consultório para avaliação acompanhado de um 
                  responsável, o qual deverá estar presente no consultório ao final de cada sessão a fim de 
                  acompanhar o menor até sua casa.
                </p>

                <h2 className="text-lg font-bold mb-4">2.6. Honorários e formas de pagamento</h2>

                <h3 className="font-bold mb-2">2.6.1.</h3>
                <p className="text-justify mb-4">
                  A forma de pagamento deverá ser definida e devidamente registrada neste contrato durante 
                  a primeira sessão de avaliação (anamnese).
                </p>

                <h3 className="font-bold mb-2">2.6.2.</h3>
                <p className="text-justify mb-4">
                  O valor referente à prestação de serviço de Avaliação Neuropsicológica à vista ou parcelado 
                  será no total de R$ <span className="underline">{contractData.valorTotal || '______________________'}</span> 
                  (<span className="underline">{contractData.valorExtenso || '______________________________________________'}</span>) O pagamento dos honorários 
                  referentes ao serviço de Avaliação Neuropsicológica será efetuado:
                </p>

                <div className="ml-4 mb-4">
                  <p>(  ) R$ _________________ à vista pagos na data da anamnese.</p>
                  <p>(  ) R$ _________________ parcelado no Boleto</p>
                  <p>Uma parcela no dia da anamnese no valor de R$ _____________ e outra(s) _________ parcela(s)</p>
                  <p>no valor R$ _________________ nas datas: ___________________________________.</p>
                  <p>( ) R$ _________________ no Cartão de crédito, parcelado de ___________ vezes.</p>
                </div>

                <h3 className="font-bold mb-2">2.6.3.</h3>
                <p className="text-justify mb-4">
                  O laudo será entregue SOMENTE após a quitação do valor total da avaliação.
                </p>

                <h3 className="font-bold mb-2">2.6.4.</h3>
                <p className="text-justify mb-4">
                  As sessões de avaliação SOMENTE terão início após o pagamento da primeira parcela.
                </p>

                <h3 className="font-bold mb-2">2.6.5.</h3>
                <p className="text-justify mb-4">
                  Os pagamentos por transferência, deposito bancário ou pix deverão ser realizados conforme 
                  os dados informados e posteriormente com o envio do respectivo comprovante para o e-mail: 
                  financeiro@fundacaodombosco.org com os dados referentes ao paciente e o responsável financeiro 
                  descriminados no corpo do e-mail.
                </p>

                <h3 className="font-bold mb-2">2.6.6.</h3>
                <p className="text-justify mb-4">
                  Caso o contratante opte pelo parcelamento do pagamento em 2 (duas) ou mais parcelas, fica 
                  vedada a condição de vincular o pagamento do serviço à entrega do Laudo Neuropsicológico. O 
                  contratante deve, de forma imperativa, cumprir rigorosamente as datas estipuladas nas cláusulas 
                  anteriores. sob pena de rescisão contratual, nos termos contantes no item 2.7 deste contrato.
                </p>

                <h2 className="text-lg font-bold mb-4">2.7. Da Rescisão</h2>

                <h3 className="font-bold mb-2">2.7.1.</h3>
                <p className="text-justify mb-4">
                  O presente instrumento poderá ser rescindido caso qualquer das partes descumpra o disposto 
                  neste contrato.
                </p>

                <h3 className="font-bold mb-2">2.7.2.</h3>
                <p className="text-justify mb-4">
                  Na hipótese de a CONTRANTE solicitar a rescisão antecipada deste contrato sem justa 
                  causa, será obrigada a pagar a CONTRATADA por inteiro qualquer retribuição vencida e não paga 
                  e 50% (cinquenta por cento) do que ela receberia até o final do contrato.
                </p>

                <h3 className="font-bold mb-2">2.7.3.</h3>
                <p className="text-justify mb-4">
                  Na hipótese de a CONTRATADA solicitar a rescisão antecipada deste contrato sem justa 
                  causa terá direito a retribuição vencida.
                </p>

                <h3 className="font-bold mb-2">2.7.4.</h3>
                <p className="text-justify mb-4">
                  Caso a CONTRATANTE não compareça a 4 sessões seguidas sem informar a 
                  CONTRATADA e não houver possibilidade de contato após esse período, este contrato fica 
                  rescindido automaticamente e fica obrigada a pagar 100% do valor do contrato.
                </p>

                <h3 className="font-bold mb-2">2.7.5.</h3>
                <p className="text-justify mb-4">
                  Com a assinatura, ambas as partes atestam que tiveram oportunidade de ler, discutir, definir 
                  e concordar com todas as cláusulas deste contrato.
                </p>

                <p className="text-center mt-8 mb-8">
                  Belo Horizonte, ________ de _______________ de ______________.
                </p>

                <div className="signatures">
                  <div className="signature">
                    <div className="signature-line"></div>
                    <p>Contratada</p>
                  </div>
                  <div className="signature">
                    <div className="signature-line"></div>
                    <p>Contratante</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};