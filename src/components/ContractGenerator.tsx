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

import contractLogo1 from '@/assets/contract-logo-1.png';
import contractLogo2 from '@/assets/contract-logo-2.png';
import contractLogo3 from '@/assets/contract-logo-3.png';
import contractLogo4 from '@/assets/contract-logo-4.png';
import contractPage2Logo from '@/assets/contract-page2-logo.png';
import contractPage3Logo from '@/assets/contract-page3-logo.png';
import contractPage4Logo from '@/assets/contract-page4-logo.png';
import contractPage5Logo from '@/assets/contract-page5-logo.png';

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
      const pdf = new jsPDF('p', 'mm', 'a4');
      const elements = contractRef.current.children;
      
      for (let i = 0; i < elements.length; i++) {
        if (i > 0) pdf.addPage();
        
        const element = elements[i] as HTMLElement;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
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
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .page { page-break-after: always; margin-bottom: 20px; }
            .page:last-child { page-break-after: avoid; }
            @media print { 
              .page { page-break-after: always; margin: 0; }
              body { margin: 0; padding: 0; }
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
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .no-print { margin-bottom: 20px; }
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
              <div ref={contractRef} className="space-y-8">
                {/* Página 1 */}
                <div className="page bg-white p-8 shadow-lg border" style={{ minHeight: '297mm', width: '210mm' }}>
                  <div className="flex justify-between items-start mb-8">
                    <img src={contractLogo1} alt="Logo 1" className="h-20" />
                    <img src={contractLogo2} alt="Logo 2" className="h-20" />
                    <img src={contractLogo3} alt="Logo 3" className="h-20" />
                    <img src={contractLogo4} alt="Logo 4" className="h-20" />
                  </div>

                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Contrato de Prestação de Serviços</h1>
                    <h2 className="text-xl font-semibold">Avaliação Neuropsicológica</h2>
                  </div>

                  <div className="space-y-6 text-sm leading-relaxed">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">1. Das partes</h3>
                      <p className="text-justify">
                        A pessoa jurídica <strong>Fundação Dom Bosco</strong>, registrada no CNPJ sob o nº <strong>17.278.904/0001-86</strong>, com endereço comercial à Rua Urucuia, 18 – Bairro Floresta, Belo Horizonte – MG, denominada neste como <strong>CONTRATADA</strong> e a pessoa física <span className="border-b border-black inline-block min-w-[300px]">{contractData.contratante || '____________________________________'}</span>, registrada no CPF sob o nº <span className="border-b border-black inline-block min-w-[150px]">{contractData.contratanteCpf || '____________________'}</span>, denominada neste como <strong>CONTRATANTE</strong>, responsável legal ou financeiro por <span className="border-b border-black inline-block min-w-[300px]">{contractData.beneficiario || '____________________________________'}</span>, inscrito no CPF sob o nº <span className="border-b border-black inline-block min-w-[200px]">{contractData.beneficiarioCpf || '________________________'}</span>, denominado neste como beneficiário do serviço, residente à <span className="border-b border-black inline-block min-w-[300px]">{contractData.endereco || '____________________________________'}</span> firmam contrato de prestação de serviço de avaliação neuropsicológica que será realizado conforme as cláusulas abaixo.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">2. Cláusulas</h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.1.1.</h4>
                        <p className="text-justify">
                          A avaliação neuropsicológica é um exame complementar realizado por profissional especializado em neuropsicologia e que neste contrato é denominada como CONTRATADA, e compreende três etapas, sendo: anamnese ou entrevista inicial, aplicação dos instrumentos de avaliação neuropsicológica e entrevista devolutiva para entrega do laudo.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">2.1.2.</h4>
                        <p className="text-justify">
                          Serão realizadas sessões para a coleta de dados, entrevistas, aplicações de escalas e testes e possíveis reuniões com outros informantes, sendo que ao final do processo o CONTRATANTE terá direito ao LAUDO NEUROPSICOLÓGICO, com a finalidade de atestar, aconselhar e encaminhar o paciente para o melhor tratamento adequado com suas necessidades.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="text-center text-xs mb-2">
                      <strong>FUNDAÇÃO DOM BOSCO</strong>
                    </div>
                    <div className="text-xs text-center space-y-1">
                      <p>Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: 31 3226-2616</p>
                      <p>Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: 31 3386-1600</p>
                      <p>Belo Horizonte - MG - www.fundacaodombosco.org</p>
                    </div>
                    <p className="text-xs mt-4 text-justify">
                      Em cumprimento à Lei Geral de Proteção de dados nº13.709/2020, o destinatário deste documento proteger os dados pessoais do Titular de acessos não autorizados e de situações acidentais ou inadequadas, comunicando ao Titular, caso ocorra algum incidente de segurança que possa acarretar risco ou dano relevante, conforme artigo 48 da Lei e assumindo as sanções cabíveis.
                    </p>
                  </div>
                </div>

                {/* Página 2 */}
                <div className="page bg-white p-8 shadow-lg border" style={{ minHeight: '297mm', width: '210mm' }}>
                  <div className="space-y-6 text-sm leading-relaxed">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">2.1.3.</h4>
                      <p className="text-justify">
                        O Laudo Neuropsicológico será entregue em data a ser definida pelo profissional em acordo com o contratante durante a Sessão de Devolutiva com duração de 1 (uma) hora, podendo ser no formato online ou presencial, a ser definido pelo neuropsicólogo.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-2">2.1.4.</h4>
                      <p className="text-justify">
                        Os instrumentos de avaliação neuropsicológicos serão compostos de questionários, escalas, inventários, tarefas e testes neuropsicológicos aprovados e validados para aplicação na população brasileira obedecendo aos critérios de aprovação para uso do Conselho Federal de Psicologia.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-2">2.1.5.</h4>
                      <p className="text-justify">
                        As sessões de avaliação serão realizadas em horário combinado, estando a neuropsicóloga à disposição do beneficiário do serviço naquele período.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">2.2. Sigilo</h3>
                      <div>
                        <h4 className="font-semibold mb-2">2.2.1.</h4>
                        <p className="text-justify">
                          A neuropsicóloga respeitará o sigilo profissional a fim de proteger, por meio da confiabilidade, a intimidade das pessoas, grupos ou organizações, a que tenha acesso no exercício profissional (Código de Ética do Psicólogo, artigo 9º).
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">2.3. Etapas da Avaliação Neuropsicológica e Vigência do Contrato</h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.3.1.</h4>
                        <p className="text-justify">
                          O processo de aplicação dos instrumentos ocorre com a utilização de, no mínimo 4 sessões e no máximo 14 sessões, com duração 1 (uma) hora, a serem definidas pelo profissional a realizá-las, agendadas previamente com o contratante.
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.3.2.</h4>
                        <p className="text-justify">
                          O número de sessões, bem como a duração delas, será definido pela neuropsicóloga, de acordo com a direcionamento e conhecimento da profissional, de maneira a obter-se sempre a melhor qualidade de resultados.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">2.3.3.</h4>
                        <p className="text-justify">
                          Caso o paciente a ser avaliado ser estudante e/ou estar em acompanhamento terapêutico será realizada entrevista com a equipe escolar e multidisciplinar como parte integrante da avaliação, conforme for possível e necessário, através de questionários e/ou vídeo conferência.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                    <img src={contractPage2Logo} alt="Logo Página 2" className="h-16 mx-auto mb-2" />
                    <div className="text-center text-xs mb-2">
                      <strong>FUNDAÇÃO DOM BOSCO</strong>
                    </div>
                    <div className="text-xs text-center space-y-1">
                      <p>Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: 31 3226-2616</p>
                      <p>Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: 31 3386-1600</p>
                      <p>Belo Horizonte - MG - www.fundacaodombosco.org</p>
                    </div>
                    <p className="text-xs mt-4 text-justify">
                      Em cumprimento à Lei Geral de Proteção de dados nº13.709/2020, o destinatário deste documento proteger os dados pessoais do Titular de acessos não autorizados e de situações acidentais ou inadequadas, comunicando ao Titular, caso ocorra algum incidente de segurança que possa acarretar risco ou dano relevante, conforme artigo 48 da Lei e assumindo as sanções cabíveis.
                    </p>
                  </div>
                </div>

                {/* Página 3 */}
                <div className="page bg-white p-8 shadow-lg border" style={{ minHeight: '297mm', width: '210mm' }}>
                  <div className="space-y-6 text-sm leading-relaxed">
                    <div>
                      <h4 className="font-semibold mb-2">2.3.4.</h4>
                      <p className="text-justify">
                        A vigência deste contrato encerrar-se-á imediatamente após a entrega do laudo neuropsicológico e à quitação do valor correspondente à prestação de serviço acordada.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2.3.5.</h4>
                      <p className="text-justify">
                        As datas das sessões de avaliação serão definidas em comum acordo entre as partes e registradas neste contrato.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">2.4. Cancelamento e reagendamento de sessões</h3>
                      <div>
                        <h4 className="font-semibold mb-2">2.4.1.</h4>
                        <p className="text-justify">
                          O Contratante concorda em notificar o Contratado com antecedência de 12 horas em caso de cancelamento ou reagendamento de sessões.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">2.5. Avaliação de menores de 18 anos</h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.5.1.</h4>
                        <p className="text-justify">
                          A avaliação neuropsicológica de menores de 18 anos será realizada somente com a ciência e concordância de um responsável pela criança ou adolescente.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">2.5.2.</h4>
                        <p className="text-justify">
                          A criança/adolescente deverá comparecer ao consultório para avaliação acompanhado de um responsável, o qual deverá estar presente no consultório ao final de cada sessão a fim de acompanhar o menor até sua casa.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">2.6. Honorários e formas de pagamento</h3>
                      <div>
                        <h4 className="font-semibold mb-2">2.6.1.</h4>
                        <p className="text-justify">
                          A forma de pagamento deverá ser definida e devidamente registrada neste contrato durante a primeira sessão de avaliação (anamnese).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                    <img src={contractPage3Logo} alt="Logo Página 3" className="h-16 mx-auto mb-2" />
                    <div className="text-center text-xs mb-2">
                      <strong>FUNDAÇÃO DOM BOSCO</strong>
                    </div>
                    <div className="text-xs text-center space-y-1">
                      <p>Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: 31 3226-2616</p>
                      <p>Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: 31 3386-1600</p>
                      <p>Belo Horizonte - MG - www.fundacaodombosco.org</p>
                    </div>
                    <p className="text-xs mt-4 text-justify">
                      Em cumprimento à Lei Geral de Proteção de dados nº13.709/2020, o destinatário deste documento proteger os dados pessoais do Titular de acessos não autorizados e de situações acidentais ou inadequadas, comunicando ao Titular, caso ocorra algum incidente de segurança que possa acarretar risco ou dano relevante, conforme artigo 48 da Lei e assumindo as sanções cabíveis.
                    </p>
                  </div>
                </div>

                {/* Página 4 */}
                <div className="page bg-white p-8 shadow-lg border" style={{ minHeight: '297mm', width: '210mm' }}>
                  <div className="space-y-6 text-sm leading-relaxed">
                    <div>
                      <h4 className="font-semibold mb-2">2.6.2.</h4>
                      <p className="text-justify mb-4">
                        O valor referente à prestação de serviço de Avaliação Neuropsicológica à vista ou parcelado será no total de R$ <span className="border-b border-black inline-block min-w-[120px]">{contractData.valorTotal || '_____________'}</span> (<span className="border-b border-black inline-block min-w-[300px]">{contractData.valorExtenso || '_____________________________'}</span>)
                      </p>
                      
                      <p className="mb-4">O pagamento dos honorários referentes ao serviço de Avaliação Neuropsicológica será efetuado:</p>
                      
                      <div className="space-y-2 ml-4">
                        <p>• ( ) R$ <span className="border-b border-black inline-block min-w-[100px]">___________</span> à vista pagos na data da anamnese.</p>
                        <p>• ( ) R$ <span className="border-b border-black inline-block min-w-[100px]">___________</span> parcelado no Boleto</p>
                        <p className="ml-4">
                          Uma parcela no dia da anamnese no valor de R$ <span className="border-b border-black inline-block min-w-[80px]">________</span> e outra(s) <span className="border-b border-black inline-block min-w-[40px]">____</span> parcela(s) no valor R$ <span className="border-b border-black inline-block min-w-[100px]">___________</span> nas datas: <span className="border-b border-black inline-block min-w-[200px]">______________________</span>.
                        </p>
                        <p>( ) R$ <span className="border-b border-black inline-block min-w-[100px]">___________</span> no Cartão de crédito, parcelado de <span className="border-b border-black inline-block min-w-[60px]">_______</span> vezes.</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2.6.3.</h4>
                      <p className="text-justify">
                        O laudo será entregue SOMENTE após a quitação do valor total da avaliação.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2.6.4.</h4>
                      <p className="text-justify">
                        As sessões de avaliação SOMENTE terão início após o pagamento da primeira parcela.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2.6.5.</h4>
                      <p className="text-justify">
                        Os pagamentos por transferência, deposito bancário ou pix deverão ser realizados conforme os dados informados e posteriormente com o envio do respectivo comprovante para o e-mail: <strong>financeiro@fundacaodombosco.org</strong> com os dados referentes ao paciente e o responsável financeiro descriminados no corpo do e-mail.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2.6.6.</h4>
                      <p className="text-justify">
                        Caso o contratante opte pelo parcelamento do pagamento em 2 (duas) ou mais parcelas, fica vedada a condição de vincular o pagamento do serviço à entrega do Laudo Neuropsicológico. O contratante deve, de forma imperativa, cumprir rigorosamente as datas estipuladas nas cláusulas anteriores, sob pena de rescisão contratual, nos termos contantes no item 2.7 deste contrato.
                      </p>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                    <img src={contractPage4Logo} alt="Logo Página 4" className="h-16 mx-auto mb-2" />
                    <div className="text-center text-xs mb-2">
                      <strong>FUNDAÇÃO DOM BOSCO</strong>
                    </div>
                    <div className="text-xs text-center space-y-1">
                      <p>Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: 31 3226-2616</p>
                      <p>Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: 31 3386-1600</p>
                      <p>Belo Horizonte - MG - www.fundacaodombosco.org</p>
                    </div>
                    <p className="text-xs mt-4 text-justify">
                      Em cumprimento à Lei Geral de Proteção de dados nº13.709/2020, o destinatário deste documento proteger os dados pessoais do Titular de acessos não autorizados e de situações acidentais ou inadequadas, comunicando ao Titular, caso ocorra algum incidente de segurança que possa acarretar risco ou dano relevante, conforme artigo 48 da Lei e assumindo as sanções cabíveis.
                    </p>
                  </div>
                </div>

                {/* Página 5 */}
                <div className="page bg-white p-8 shadow-lg border" style={{ minHeight: '297mm', width: '210mm' }}>
                  <div className="space-y-6 text-sm leading-relaxed">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">2.7. Da Rescisão</h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.7.1.</h4>
                        <p className="text-justify">
                          O presente instrumento poderá ser rescindido caso qualquer das partes descumpra o disposto neste contrato.
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.7.2.</h4>
                        <p className="text-justify">
                          Na hipótese de a CONTRATANTE solicitar a rescisão antecipada deste contrato sem justa causa, será obrigada a pagar a CONTRATADA por inteiro qualquer retribuição vencida e não paga e 50% (cinquenta por cento) do que ela receberia até o final do contrato.
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.7.3.</h4>
                        <p className="text-justify">
                          Na hipótese de a CONTRATADA solicitar a rescisão antecipada deste contrato sem justa causa terá direito a retribuição vencida.
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">2.7.4.</h4>
                        <p className="text-justify">
                          Caso a CONTRATANTE não compareça a 4 sessões seguidas sem informar a CONTRATADA e não houver possibilidade de contato após esse período, este contrato fica rescindido automaticamente e fica obrigada a pagar 100% do valor do contrato.
                        </p>
                      </div>

                      <div className="mb-8">
                        <h4 className="font-semibold mb-2">2.7.5.</h4>
                        <p className="text-justify">
                          Com a assinatura, ambas as partes atestam que tiveram oportunidade de ler, discutir, definir e concordar com todas as cláusulas deste contrato.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-8 mt-16">
                      <p className="text-center">
                        Belo Horizonte, <span className="border-b border-black inline-block min-w-[40px]">{contractData.data}</span> de <span className="border-b border-black inline-w-[100px]">{contractData.mes}</span> de <span className="border-b border-black inline-block min-w-[60px]">{contractData.ano}</span>.
                      </p>

                      <div className="grid grid-cols-1 gap-8 mt-16">
                        <div className="text-center">
                          <div className="border-b border-black w-80 mx-auto mb-2"></div>
                          <p><strong>Contratada</strong></p>
                        </div>

                        <div className="text-center">
                          <div className="border-b border-black w-80 mx-auto mb-2"></div>
                          <p><strong>Contratante</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                    <img src={contractPage5Logo} alt="Logo Página 5" className="h-16 mx-auto mb-2" />
                    <div className="text-center text-xs mb-2">
                      <strong>FUNDAÇÃO DOM BOSCO</strong>
                    </div>
                    <div className="text-xs text-center space-y-1">
                      <p>Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: 31 3226-2616</p>
                      <p>Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: 31 3386-1600</p>
                      <p>Belo Horizonte - MG - www.fundacaodombosco.org</p>
                    </div>
                    <p className="text-xs mt-4 text-justify">
                      Em cumprimento à Lei Geral de Proteção de dados nº13.709/2020, o destinatário deste documento proteger os dados pessoais do Titular de acessos não autorizados e de situações acidentais ou inadequadas, comunicando ao Titular, caso ocorra algum incidente de segurança que possa acarretar risco ou dano relevante, conforme artigo 48 da Lei e assumindo as sanções cabíveis.
                    </p>
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