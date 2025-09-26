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
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { FileText, Edit, Plus, Users, Search, Calendar, UserPlus, Shield, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  contractType: string;
  clientId: string;
  clientName: string;
  clientCpf: string;
  responsibleName: string;
  responsibleCpf: string;
  address: string;
  paymentMethod: string;
  value: string;
  contractDate: string;
}

export default function Contracts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userRole, loading: roleLoading } = useRolePermissions();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractData, setContractData] = useState<ContractData>({
    contractType: 'Avaliação Neuropsicológica',
    clientId: '',
    clientName: '',
    clientCpf: '',
    responsibleName: '',
    responsibleCpf: '',
    address: '',
    paymentMethod: 'PIX',
    value: '1.600,00',
    contractDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (roleLoading) return;
    
    // Apenas diretores e coordenadores do Floresta podem acessar contratos
    if (userRole !== 'director' && userRole !== 'coordinator_floresta') {
      toast({
        variant: "destructive",
        title: "Acesso Restrito",
        description: "Apenas diretores e coordenadores do Floresta podem gerar contratos."
      });
      return;
    }
    
    loadClients();
  }, [roleLoading, userRole]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .eq('unit', 'floresta') // Apenas clientes da unidade Floresta
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
Contrato de Prestação de Serviços 
Avaliação Neuropsicológica 
 
1. Das partes 
A pessoa jurídica Fundação Dom Bosco, registrada no CNPJ sob o nº 17.278.904/0001 86, com endereço 
comercial à Rua Urucuia, 18 – Bairro Floresta, Belo Horizonte – MG, denominada neste como 
CONTRATADA e a pessoa física 
${contractData.responsibleName || '__________________________________________________________________'}, registrada no CPF 
sob o nº ${contractData.responsibleCpf || '____________________________________'}, denominada neste como CONTRATANTE, 
responsável legal ou financeiro por 
${contractData.clientName || '________________________________________________________________'}, inscrito no CPF sob o 
nº${contractData.clientCpf || '_________________________________________'}, denominado neste como beneficiário do serviço, 
residente à ${contractData.address || '__________________________________________________________________'} 
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
e no máximo 14 sessões, com duração 1 (uma) hora, a serem definidas pelo profissional a realizá
las, agendadas previamente com o contratante.  
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
será no total de R$ ${contractData.value || '______________________'} 
(${contractData.value || '______________________________________________'}) O pagamento dos honorários 
referentes ao serviço de Avaliação Neuropsicológica será efetuado:  
 
(  ) R$ _________________ à vista pagos na data da anamnese.  
(  ) R$ _________________ parcelado no Boleto  
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
`;

    return contractContent;
  };

  const createFinancialRecord = async () => {
    try {
      // Criar registro financeiro de avaliação neuropsicológica
      const { error } = await supabase
        .from('financial_records')
        .insert([{
          type: 'income',
          category: 'evaluation',
          description: `Avaliação Neuropsicológica - ${contractData.clientName}`,
          amount: 1600.00, // R$ 1.600,00 fixo para avaliação
          date: contractData.contractDate,
          payment_method: 'contract',
          client_id: contractData.clientId,
          created_by: user?.id,
          notes: `Contrato gerado automaticamente - Pagamento registrado como efetuado`
        }]);

      if (error) throw error;

      console.log('Registro financeiro criado automaticamente');
    } catch (error) {
      console.error('Erro ao criar registro financeiro:', error);
      // Não mostrar erro para o usuário, apenas log
    }
  };

  const handlePrintContract = async () => {
    setIsGenerating(true);
    try {
      // Buscar dados do usuário atual para registrar quem imprimiu
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user?.id)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
      }

      const userName = currentUser?.name || 'Usuário não identificado';
      
      // Criar registro no attendance_reports
      const { data: attendanceReport, error: attendanceError } = await supabase
        .from('attendance_reports')
        .insert([{
          client_id: contractData.clientId,
          employee_id: user?.id,
          patient_name: contractData.clientName,
          professional_name: userName,
          attendance_type: 'Avaliação Neuropsicológica',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora depois
          session_duration: 60,
          amount_charged: 1600.00,
          professional_amount: 0, // Pode ser definido depois
          institution_amount: 1600.00,
          status: 'completed',
          validation_status: 'validated',
          session_notes: `Contrato de Avaliação Neuropsicológica gerado e impresso por ${userName}`,
          created_by: user?.id,
          completed_by: user?.id,
          completed_by_name: userName,
          validated_by: user?.id,
          validated_by_name: userName,
          validated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (attendanceError) {
        console.error('Erro ao criar relatório de atendimento:', attendanceError);
      }

      // Criar registro de pagamento do cliente
      const { error: paymentError } = await supabase
        .from('client_payments')
        .insert([{
          client_id: contractData.clientId,
          payment_type: 'Avaliação Neuropsicológica',
          total_amount: 1600.00,
          amount_paid: 1600.00,
          amount_remaining: 0,
          status: 'completed',
          payment_method: 'Contrato',
          description: `Pagamento de Avaliação Neuropsicológica - Contrato impresso por ${userName}`,
          unit: 'floresta',
          created_by: user?.id,
          installments_total: 1,
          installments_paid: 1
        }]);

      if (paymentError) {
        console.error('Erro ao criar registro de pagamento:', paymentError);
      }

      // Criar registro financeiro automático
      const { error: autoFinancialError } = await supabase
        .from('automatic_financial_records')
        .insert([{
          patient_id: contractData.clientId,
          patient_name: contractData.clientName,
          professional_id: user?.id,
          professional_name: userName,
          amount: 1600.00,
          transaction_type: 'income',
          payment_method: 'Contrato',
          description: `Avaliação Neuropsicológica - Contrato impresso por ${userName}`,
          origin_type: 'contract',
          origin_id: attendanceReport?.id,
          attendance_report_id: attendanceReport?.id,
          created_by: user?.id,
          created_by_name: userName,
          metadata: {
            contract_data: JSON.parse(JSON.stringify(contractData)),
            printed_by: userName,
            printed_at: new Date().toISOString(),
            contract_type: 'Avaliação Neuropsicológica'
          } as any
        }]);

      if (autoFinancialError) {
        console.error('Erro ao criar registro financeiro automático:', autoFinancialError);
      }

      // Criar registro financeiro tradicional
      await createFinancialRecord();

      // Gerar contrato para impressão
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
                .print-info { margin-bottom: 20px; text-align: right; font-size: 10px; color: #666; }
                @media print { 
                  .no-print { display: none; } 
                  .print-info { font-size: 8px; }
                }
              </style>
            </head>
            <body>
              <div class="print-info">
                Impresso por: ${userName} em ${new Date().toLocaleString('pt-BR')}
              </div>
              <div class="no-print" style="margin-bottom: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Imprimir</button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
              </div>
              <div class="contract-content">${contractContent}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
      }

      toast({
        title: "Contrato processado com sucesso!",
        description: `Contrato impresso por ${userName}. Registros financeiros, de atendimento e de pagamento criados automaticamente.`,
      });
      
      // Resetar form e fechar dialog
      resetForm();
      setIsDialogOpen(false);
      
    } catch (error) {
      console.error('Erro ao processar contrato:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao processar o contrato. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setContractData({
      contractType: 'Avaliação Neuropsicológica',
      clientId: '',
      clientName: '',
      clientCpf: '',
      responsibleName: '',
      responsibleCpf: '',
      address: '',
      paymentMethod: 'PIX',
      value: '1.600,00',
      contractDate: new Date().toISOString().split('T')[0]
    });
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (roleLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (userRole !== 'director' && userRole !== 'coordinator_floresta') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Acesso restrito a diretores e coordenadores do Floresta</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Geração de Contratos - Unidade Floresta</h1>
          <p className="text-muted-foreground">
            Crie contratos de avaliação neuropsicológica (R$ 1.600,00 cada)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate('/client-form')}
          >
            <UserPlus className="h-4 w-4" />
            Novo Cliente
          </Button>
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
                            CPF: {client.cpf || 'Não informado'} | Unidade: Floresta
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {contractData.clientId && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 text-green-700">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Cliente Selecionado:</span>
                      </div>
                      <div className="mt-1 text-sm text-green-600">
                        {contractData.clientName} - {contractData.clientCpf || 'CPF não informado'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dados do Contrato */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Dados do Contrato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractType">Tipo de Contrato</Label>
                      <Select
                        value={contractData.contractType}
                        onValueChange={(value) => setContractData(prev => ({ ...prev, contractType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Avaliação Neuropsicológica">Avaliação Neuropsicológica</SelectItem>
                          <SelectItem value="Terapia">Terapia</SelectItem>
                          <SelectItem value="Consultoria">Consultoria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contractDate">Data do Contrato</Label>
                      <Input
                        id="contractDate"
                        type="date"
                        value={contractData.contractDate}
                        onChange={(e) => setContractData(prev => ({ ...prev, contractDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="responsibleName">Nome do Responsável</Label>
                      <Input
                        id="responsibleName"
                        value={contractData.responsibleName}
                        onChange={(e) => setContractData(prev => ({ ...prev, responsibleName: e.target.value }))}
                        placeholder="Nome completo do responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsibleCpf">CPF do Responsável</Label>
                      <Input
                        id="responsibleCpf"
                        value={contractData.responsibleCpf}
                        onChange={(e) => setContractData(prev => ({ ...prev, responsibleCpf: e.target.value }))}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Textarea
                      id="address"
                      value={contractData.address}
                      onChange={(e) => setContractData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Endereço completo do beneficiário"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="value">Valor do Serviço (R$)</Label>
                      <Input
                        id="value"
                        value={contractData.value}
                        onChange={(e) => setContractData(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="1.600,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                      <Select
                        value={contractData.paymentMethod}
                        onValueChange={(value) => setContractData(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                          <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                          <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de Ação */}
              <div className="flex gap-2 justify-end">
                  <Button
                    onClick={handlePrintContract}
                    className="gap-2"
                    disabled={!contractData.clientId || isGenerating}
                  >
                    <Printer className="h-4 w-4" />
                    {isGenerating ? 'Processando...' : 'Imprimir + Registrar R$ 1.600,00'}
                  </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes da Unidade Floresta
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

            {loading ? (
              <div className="text-center py-8">Carregando clientes...</div>
            ) : (
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
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.cpf || 'Não informado'}</TableCell>
                        <TableCell>Floresta</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleClientSelect(client.id);
                                setIsDialogOpen(true);
                              }}
                              className="gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Contrato
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}