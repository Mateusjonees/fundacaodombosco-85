import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Edit, Plus } from 'lucide-react';

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

  const generateContract = () => {
    const contractContent = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS
AVALIAÇÃO NEUROPSICOLÓGICA

1. Das partes

A pessoa jurídica Fundação Dom Bosco, registrada no CNPJ sob o nº 17.278.904/0001-86, com endereço comercial à Rua Urucuia, 18 – Bairro Floresta, Belo Horizonte – MG, denominada neste como CONTRATADA e a pessoa física ${contractData.responsibleName}, registrada no CPF sob o nº ${contractData.responsibleCpf}, denominada neste como CONTRATANTE, responsável legal ou financeiro por ${contractData.clientName}, inscrito no CPF sob o nº ${contractData.clientCpf}, denominado neste como beneficiário do serviço, residente à ${contractData.address}, firmam contrato de prestação de serviço de avaliação neuropsicológica que será realizado conforme as cláusulas abaixo.

2. Cláusulas

2.1.1. A avaliação neuropsicológica é um exame complementar realizado por profissional especializado em neuropsicologia e que neste contrato é denominada como CONTRATADA, e compreende três etapas, sendo: anamnese ou entrevista inicial, aplicação dos instrumentos de avaliação neuropsicológica e entrevista devolutiva para entrega do laudo.

2.1.2. Serão realizadas sessões para a coleta de dados, entrevistas, aplicações de escalas e testes e possíveis reuniões com outros informantes, sendo que ao final do processo o CONTRATANTE terá direito ao LAUDO NEUROPSICOLÓGICO, com a finalidade de atestar, aconselhar e encaminhar o paciente para o melhor tratamento adequado com suas necessidades.

2.1.3. O Laudo Neuropsicológico será entregue em data a ser definida pelo profissional em acordo com o contratante durante a Sessão de Devolutiva com duração de 1 (uma) hora, podendo ser no formato online ou presencial, a ser definido pelo neuropsicólogo.

2.2. Sigilo
2.2.1. A neuropsicóloga respeitará o sigilo profissional a fim de proteger, por meio da confiabilidade, a intimidade das pessoas, grupos ou organizações, a que tenha acesso no exercício profissional (Código de Ética do Psicólogo, artigo 9º).

2.3. Etapas da Avaliação Neuropsicológica e Vigência do Contrato
2.3.1. O processo de aplicação dos instrumentos ocorre com a utilização de, no mínimo 4 sessões e no máximo 14 sessões, com duração 1 (uma) hora, a serem definidas pelo profissional a realizá-las, agendadas previamente com o contratante.

2.4. Valor e Forma de Pagamento
2.4.1. O valor total dos serviços é de R$ ${contractData.value}, a ser pago através de ${contractData.paymentMethod}.
2.4.2. O pagamento deverá ser efetuado de acordo com o cronograma estabelecido pela CONTRATADA.

2.5. Disposições Gerais
2.5.1. A vigência deste contrato encerrar-se-á imediatamente após a entrega do laudo neuropsicológico e à quitação do valor correspondente à prestação de serviço acordada.

Data do Contrato: ${new Date(contractData.contractDate).toLocaleDateString('pt-BR')}

FUNDAÇÃO DOM BOSCO
Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: 31 3226-2616
Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: 31 3386-1600
Belo Horizonte - MG - www.fundacaodombosco.org

_________________________              _________________________
CONTRATADA                             CONTRATANTE
Fundação Dom Bosco                     ${contractData.responsibleName}
`;

    return contractContent;
  };

  const handleDownloadContract = () => {
    const contractContent = generateContract();
    const blob = new Blob([contractContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrato-${contractData.clientName.replace(/\s+/g, '-').toLowerCase()}-${contractData.contractDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Contrato gerado!",
      description: "O arquivo foi baixado com sucesso.",
    });
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
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              h1 { text-align: center; color: #333; }
              .contract-content { white-space: pre-line; }
            </style>
          </head>
          <body>
            <div class="contract-content">${contractContent}</div>
            <br><br>
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir</button>
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
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerar Contrato de Avaliação Neuropsicológica</DialogTitle>
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
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="boleto">Boleto Bancário</SelectItem>
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
                <FileText className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button onClick={handleDownloadContract}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Contrato
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
            <p className="text-sm mb-4">Clique em "Novo Contrato" para gerar um contrato personalizado para este cliente.</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Primeiro Contrato
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
    </div>
  );
};