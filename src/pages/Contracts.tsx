import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Edit, Plus, Users, Search, Eye, Calendar } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  cpf?: string;
  address?: string;
  responsible_name?: string;
  responsible_phone?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  unit?: string;
}

interface ContractData {
  clientId: string;
  clientName: string;
  clientCpf: string;
  responsibleName: string;
  responsibleCpf: string;
  address: string;
  paymentMethod: string;
  value: string;
  contractDate: string;
  contractType: string;
}

export default function Contracts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractData, setContractData] = useState<ContractData>({
    clientId: '',
    clientName: '',
    clientCpf: '',
    responsibleName: '',
    responsibleCpf: '',
    address: '',
    paymentMethod: 'pix',
    value: '500,00',
    contractDate: new Date().toISOString().split('T')[0],
    contractType: 'neuropsychological_assessment'
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setContractData(prev => ({
        ...prev,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientCpf: selectedClient.cpf || '',
        responsibleName: selectedClient.responsible_name || selectedClient.name,
        responsibleCpf: selectedClient.cpf || '',
        address: selectedClient.address || ''
      }));
    }
  };

  const generateContract = () => {
    const contractContent = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS
${contractData.contractType === 'neuropsychological_assessment' ? 'AVALIAÇÃO NEUROPSICOLÓGICA' : 'SERVIÇOS TERAPÊUTICOS'}

1. Das partes

A pessoa jurídica Fundação Dom Bosco, registrada no CNPJ sob o nº 17.278.904/0001-86, com endereço comercial à Rua Urucuia, 18 – Bairro Floresta, Belo Horizonte – MG, denominada neste como CONTRATADA e a pessoa física ${contractData.responsibleName}, registrada no CPF sob o nº ${contractData.responsibleCpf}, denominada neste como CONTRATANTE, responsável legal ou financeiro por ${contractData.clientName}, inscrito no CPF sob o nº ${contractData.clientCpf}, denominado neste como beneficiário do serviço, residente à ${contractData.address}, firmam contrato de prestação de serviço de ${contractData.contractType === 'neuropsychological_assessment' ? 'avaliação neuropsicológica' : 'terapia'} que será realizado conforme as cláusulas abaixo.

2. Cláusulas

${contractData.contractType === 'neuropsychological_assessment' ? `
2.1.1. A avaliação neuropsicológica é um exame complementar realizado por profissional especializado em neuropsicologia e que neste contrato é denominada como CONTRATADA, e compreende três etapas, sendo: anamnese ou entrevista inicial, aplicação dos instrumentos de avaliação neuropsicológica e entrevista devolutiva para entrega do laudo.

2.1.2. Serão realizadas sessões para a coleta de dados, entrevistas, aplicações de escalas e testes e possíveis reuniões com outros informantes, sendo que ao final do processo o CONTRATANTE terá direito ao LAUDO NEUROPSICOLÓGICO, com a finalidade de atestar, aconselhar e encaminhar o paciente para o melhor tratamento adequado com suas necessidades.

2.1.3. O Laudo Neuropsicológico será entregue em data a ser definida pelo profissional em acordo com o contratante durante a Sessão de Devolutiva com duração de 1 (uma) hora, podendo ser no formato online ou presencial, a ser definido pelo neuropsicólogo.

2.3.1. O processo de aplicação dos instrumentos ocorre com a utilização de, no mínimo 4 sessões e no máximo 14 sessões, com duração 1 (uma) hora, a serem definidas pelo profissional a realizá-las, agendadas previamente com o contratante.
` : `
2.1.1. Os serviços terapêuticos serão prestados por profissionais especializados, conforme a necessidade específica do beneficiário do serviço.

2.1.2. As sessões terapêuticas serão realizadas em horário combinado, com duração e frequência a serem definidas pelo profissional responsável.

2.1.3. O acompanhamento será realizado de forma individualizada, respeitando as particularidades e necessidades específicas do beneficiário.
`}

2.2. Sigilo
2.2.1. Os profissionais respeitarão o sigilo profissional a fim de proteger, por meio da confiabilidade, a intimidade das pessoas, grupos ou organizações, a que tenham acesso no exercício profissional.

2.4. Valor e Forma de Pagamento
2.4.1. O valor total dos serviços é de R$ ${contractData.value}, a ser pago através de ${contractData.paymentMethod}.
2.4.2. O pagamento deverá ser efetuado de acordo com o cronograma estabelecido pela CONTRATADA.

2.5. Disposições Gerais
2.5.1. A vigência deste contrato ${contractData.contractType === 'neuropsychological_assessment' ? 'encerrar-se-á imediatamente após a entrega do laudo neuropsicológico' : 'será definida conforme acordo entre as partes'} e à quitação do valor correspondente à prestação de serviço acordada.

Data do Contrato: ${new Date(contractData.contractDate).toLocaleDateString('pt-BR')}

FUNDAÇÃO DOM BOSCO
Unid. 1: Rua Urucuia, 18 - Floresta - 30.150-060 - Tel.: 31 3226-2616
Unid. 2: Rua Jayme Sales, 280 - Md. Gertrudes - 30.518-320 - Tel.: 31 3386-1600
Belo Horizonte - MG - www.fundacaodombosco.org

Em cumprimento à Lei Geral de Proteção de dados n13.709/2020, o destinatário deste documento se responsabiliza por manter medidas de segurança, técnicas e administrativas suficientes a proteger os dados pessoais do Titular de acessos não autorizados e de situações acidentais ou inadequadas.

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
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              h1 { text-align: center; color: #333; margin-bottom: 30px; }
              .contract-content { white-space: pre-line; font-size: 14px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
              .signature-line { width: 200px; border-bottom: 1px solid #000; text-align: center; padding-top: 40px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 20px;">
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

  const resetForm = () => {
    setContractData({
      clientId: '',
      clientName: '',
      clientCpf: '',
      responsibleName: '',
      responsibleCpf: '',
      address: '',
      paymentMethod: 'pix',
      value: '500,00',
      contractDate: new Date().toISOString().split('T')[0],
      contractType: 'neuropsychological_assessment'
    });
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Geração de Contratos</h1>
          <p className="text-muted-foreground">
            Crie contratos personalizados para clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerar Novo Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Seleção de Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Selecionar Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientSearch">Buscar Cliente</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="clientSearch"
                        placeholder="Digite o nome ou CPF do cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {searchTerm && (
                    <div className="max-h-48 overflow-y-auto border rounded">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 cursor-pointer hover:bg-muted border-b last:border-b-0 ${
                            contractData.clientId === client.id ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => {
                            handleClientSelect(client.id);
                            setSearchTerm('');
                          }}
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            CPF: {client.cpf || 'Não informado'} | Unidade: {client.unit === 'madre' ? 'Clínica Social' : 'Neuro'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {contractData.clientId && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Cliente Selecionado:</span>
                      </div>
                      <div className="mt-1 text-green-700">{contractData.clientName}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dados do Contrato */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Dados do Contrato</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractType">Tipo de Contrato</Label>
                    <Select value={contractData.contractType} onValueChange={(value) => setContractData({ ...contractData, contractType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neuropsychological_assessment">Avaliação Neuropsicológica</SelectItem>
                        <SelectItem value="therapy">Terapia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Nome do Cliente</Label>
                    <Input
                      id="clientName"
                      value={contractData.clientName}
                      onChange={(e) => setContractData({ ...contractData, clientName: e.target.value })}
                      placeholder="Nome completo do cliente"
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
                  <div className="space-y-2">
                    <Label htmlFor="contractDate">Data do Contrato</Label>
                    <Input
                      id="contractDate"
                      type="date"
                      value={contractData.contractDate}
                      onChange={(e) => setContractData({ ...contractData, contractDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Textarea
                      id="address"
                      value={contractData.address}
                      onChange={(e) => setContractData({ ...contractData, address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade, estado, CEP"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreviewContract}
                disabled={!contractData.clientName || !contractData.responsibleName}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button 
                onClick={handleDownloadContract}
                disabled={!contractData.clientName || !contractData.responsibleName}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Contrato
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Clientes para Referência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.slice(0, 10).map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.cpf || 'Não informado'}</TableCell>
                      <TableCell>
                        {client.unit === 'madre' ? 'Clínica Social' : client.unit === 'floresta' ? 'Neuro' : 'Não informado'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleClientSelect(client.id);
                            setIsDialogOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Gerar Contrato
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredClients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}