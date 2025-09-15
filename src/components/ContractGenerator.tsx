import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  cpf?: string;
  address?: string;
  responsible_name?: string;
  email?: string;
  phone?: string;
}

interface ContractData {
  patientName: string;
  patientCpf: string;
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

const formatCpf = (cpf: string) => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatCurrency = (value: string) => {
  const number = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
  if (isNaN(number)) return value;
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function ContractGenerator({ client }: ContractGeneratorProps) {
  const [contractData, setContractData] = useState<ContractData>({
    patientName: client.name || '',
    patientCpf: client.cpf ? formatCpf(client.cpf) : '',
    responsibleName: client.responsible_name || client.name || '',
    responsibleCpf: client.cpf ? formatCpf(client.cpf) : '',
    address: client.address || '',
    paymentMethod: '',
    value: '',
    contractDate: format(new Date(), 'dd/MM/yyyy'),
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: keyof ContractData, value: string) => {
    let formattedValue = value;
    
    // Format CPF fields
    if (field === 'patientCpf' || field === 'responsibleCpf') {
      formattedValue = formatCpf(value);
    }
    
    // Format currency field
    if (field === 'value') {
      formattedValue = formatCurrency(value);
    }
    
    setContractData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contrato de Prestação de Serviços - ${contractData.patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .clause { margin-bottom: 15px; text-align: justify; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; }
            .signature-line { border-bottom: 1px solid #000; width: 300px; margin: 40px auto 10px; }
            .signature-text { text-align: center; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${generateContractHTML()}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateContractHTML = () => {
    return `
      <div class="header">
        <h1>FUNDAÇÃO DOM BOSCO</h1>
        <p>Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: 31 3226-2616</p>
        <p>Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: 31 3386-1600</p>
        <p>Belo Horizonte - MG - www.fundacaodombosco.org</p>
      </div>

      <div class="title">Contrato de Prestação de Serviços<br>Avaliação Neuropsicológica</div>

      <div class="section">
        <h3>1. Das partes</h3>
        <div class="clause">
          A pessoa jurídica <strong>Fundação Dom Bosco</strong>, registrada no CNPJ sob o nº 17.278.904/0001-86, 
          com endereço comercial à Rua Urucuia, 18 – Bairro Floresta, Belo Horizonte – MG, denominada neste como 
          <strong>CONTRATADA</strong> e a pessoa física <strong>${contractData.responsibleName}</strong>, 
          registrada no CPF sob o nº <strong>${contractData.responsibleCpf}</strong>, denominada neste como 
          <strong>CONTRATANTE</strong>, responsável legal ou financeiro por <strong>${contractData.patientName}</strong>, 
          inscrito no CPF sob o nº <strong>${contractData.patientCpf}</strong>, denominado neste como beneficiário 
          do serviço, residente à <strong>${contractData.address}</strong>, firmam contrato de prestação de 
          serviço de avaliação neuropsicológica que será realizado conforme as cláusulas abaixo.
        </div>
      </div>

      <div class="section">
        <h3>2. Cláusulas</h3>
        
        <div class="clause">
          <strong>2.1.1.</strong> A avaliação neuropsicológica é um exame complementar realizado por profissional 
          especializado em neuropsicologia e que neste contrato é denominada como CONTRATADA, e compreende três 
          etapas, sendo: anamnese ou entrevista inicial, aplicação dos instrumentos de avaliação neuropsicológica 
          e entrevista devolutiva para entrega do laudo.
        </div>

        <div class="clause">
          <strong>2.1.2.</strong> Serão realizadas sessões para a coleta de dados, entrevistas, aplicações de 
          escalas e testes e possíveis reuniões com outros informantes, sendo que ao final do processo o 
          CONTRATANTE terá direito ao LAUDO NEUROPSICOLÓGICO, com a finalidade de atestar, aconselhar e 
          encaminhar o paciente para o melhor tratamento adequado com suas necessidades.
        </div>

        <div class="clause">
          <strong>2.1.3.</strong> O Laudo Neuropsicológico será entregue em data a ser definida pelo profissional 
          em acordo com o contratante durante a Sessão de Devolutiva com duração de 1 (uma) hora, podendo ser 
          no formato online ou presencial, a ser definido pelo neuropsicólogo.
        </div>

        <div class="clause">
          <strong>2.2.</strong> <strong>Sigilo:</strong> A neuropsicóloga respeitará o sigilo profissional a fim 
          de proteger, por meio da confiabilidade, a intimidade das pessoas, grupos ou organizações, a que tenha 
          acesso no exercício profissional (Código de Ética do Psicólogo, artigo 9º).
        </div>

        <div class="clause">
          <strong>2.3.</strong> <strong>Etapas da Avaliação:</strong> O processo de aplicação dos instrumentos 
          ocorre com a utilização de, no mínimo 4 sessões e no máximo 14 sessões, com duração 1 (uma) hora, 
          a serem definidas pelo profissional a realizá-las, agendadas previamente com o contratante.
        </div>

        <div class="clause">
          <strong>2.4.</strong> <strong>Valor dos Serviços:</strong> O valor total dos serviços é de 
          <strong>R$ ${contractData.value}</strong>, a ser pago através de <strong>${contractData.paymentMethod}</strong>.
        </div>

        <div class="clause">
          <strong>2.5.</strong> <strong>Vigência:</strong> Este contrato entra em vigor na data de 
          <strong>${contractData.contractDate}</strong> e permanecerá válido até a conclusão dos serviços.
        </div>
      </div>

      <div class="section">
        <p>Belo Horizonte, ${contractData.contractDate}</p>
        
        <div style="display: flex; justify-content: space-between; margin-top: 60px;">
          <div style="text-align: center; width: 45%;">
            <div class="signature-line"></div>
            <div class="signature-text">CONTRATADA<br>Fundação Dom Bosco</div>
          </div>
          
          <div style="text-align: center; width: 45%;">
            <div class="signature-line"></div>
            <div class="signature-text">CONTRATANTE<br>${contractData.responsibleName}<br>CPF: ${contractData.responsibleCpf}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p><small>Em cumprimento à Lei Geral de Proteção de dados nº13.709/2020, o destinatário deste documento 
        se responsabiliza por manter medidas de segurança, técnicas e administrativas suficientes a proteger 
        os dados pessoais do Titular de acessos não autorizados e de situações acidentais ou inadequadas.</small></p>
      </div>
    `;
  };

  return (
    <div className="space-y-4">
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Gerar Contrato
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contrato de Avaliação Neuropsicológica</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário de Edição */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Contrato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nome do Paciente</Label>
                  <Input
                    id="patientName"
                    value={contractData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientCpf">CPF do Paciente</Label>
                  <Input
                    id="patientCpf"
                    value={contractData.patientCpf}
                    onChange={(e) => handleInputChange('patientCpf', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsibleName">Responsável Financeiro</Label>
                  <Input
                    id="responsibleName"
                    value={contractData.responsibleName}
                    onChange={(e) => handleInputChange('responsibleName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsibleCpf">CPF do Responsável</Label>
                  <Input
                    id="responsibleCpf"
                    value={contractData.responsibleCpf}
                    onChange={(e) => handleInputChange('responsibleCpf', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={contractData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select 
                    value={contractData.paymentMethod} 
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                      <SelectItem value="boleto">Boleto Bancário</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="parcelado">Pagamento Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="text"
                    value={contractData.value}
                    onChange={(e) => handleInputChange('value', e.target.value)}
                    placeholder="1.500,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractDate">Data do Contrato</Label>
                  <Input
                    id="contractDate"
                    type="date"
                    value={contractData.contractDate.split('/').reverse().join('-')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      handleInputChange('contractDate', format(date, 'dd/MM/yyyy'));
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prévia do Contrato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Prévia do Contrato
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="border border-gray-200 p-4 bg-white text-sm max-h-[600px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: generateContractHTML() }}
                />
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}