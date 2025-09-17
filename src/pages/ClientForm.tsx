import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

type AgeType = 'adult' | 'minor';

export default function ClientForm() {
  const [ageType, setAgeType] = useState<AgeType>('adult');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Dados Pessoais
    name: '',
    birth_date: '',
    gender: '',
    cpf: '',
    rg: '',
    naturalidade: '',
    estado_civil: '',
    escolaridade: '',
    profissao: '',
    email: '',
    phone: '',
    emergency_contact: '',
    emergency_phone: '',
    unidade_atendimento: '',
    
    // Dados específicos para menor de idade
    nome_escola: '',
    tipo_escola: '',
    ano_escolar: '',
    
    // Dados dos Pais/Responsáveis
    nome_pai: '',
    idade_pai: '',
    profissao_pai: '',
    telefone_pai: '',
    nome_mae: '',
    idade_mae: '',
    profissao_mae: '',
    telefone_mae: '',
    responsavel_financeiro: '',
    outro_responsavel: '',
    
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    
    // Outras Informações
    observacoes: '',
    
    // Informações Clínicas
    diagnostico_principal: '',
    medical_history: '',
    queixa_neuropsicologica: '',
    expectativas_tratamento: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepChange = async (cep: string) => {
    setFormData(prev => ({ ...prev, cep }));
    
    if (cep.replace(/\D/g, '').length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build notes field based on age type
      let notesData = '';
      
      if (ageType === 'adult') {
        notesData = `Gênero: ${formData.gender}\nRG: ${formData.rg}\nNaturalidade: ${formData.naturalidade}\nEstado Civil: ${formData.estado_civil}\nEscolaridade: ${formData.escolaridade}\nProfissão: ${formData.profissao}\nUnidade: ${formData.unidade_atendimento}\nDiagnóstico: ${formData.diagnostico_principal}\nQueixa: ${formData.queixa_neuropsicologica}\nExpectativas: ${formData.expectativas_tratamento}\nObservações: ${formData.observacoes}`;
      } else {
        notesData = `Tipo: Menor de Idade\nGênero: ${formData.gender}\nEscola: ${formData.nome_escola}\nTipo de Escola: ${formData.tipo_escola}\nAno Escolar: ${formData.ano_escolar}\nUnidade: ${formData.unidade_atendimento}\nPai: ${formData.nome_pai} (${formData.idade_pai} anos) - ${formData.profissao_pai} - ${formData.telefone_pai}\nMãe: ${formData.nome_mae} (${formData.idade_mae} anos) - ${formData.profissao_mae} - ${formData.telefone_mae}\nResponsável Financeiro: ${formData.responsavel_financeiro}\nOutro Responsável: ${formData.outro_responsavel}\nDiagnóstico: ${formData.diagnostico_principal}\nQueixa: ${formData.queixa_neuropsicologica}\nExpectativas: ${formData.expectativas_tratamento}\nObservações: ${formData.observacoes}`;
      }

      const { error } = await supabase
        .from('clients')
        .insert([{
          name: formData.name,
          email: ageType === 'adult' ? formData.email : '', // Minors might not have email
          phone: ageType === 'adult' ? formData.phone : formData.telefone_pai || formData.telefone_mae, // Use parent phone for minors
          cpf: formData.cpf,
          birth_date: formData.birth_date,
          address: `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade}/${formData.estado}`,
          emergency_contact: ageType === 'adult' ? formData.emergency_contact : `${formData.nome_pai} / ${formData.nome_mae}`,
          emergency_phone: ageType === 'adult' ? formData.emergency_phone : `${formData.telefone_pai} / ${formData.telefone_mae}`,
          medical_history: formData.medical_history,
          notes: notesData,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });

      // Reset form
      setFormData({
        name: '', birth_date: '', gender: '', cpf: '', rg: '', naturalidade: '',
        estado_civil: '', escolaridade: '', profissao: '', email: '', phone: '',
        emergency_contact: '', emergency_phone: '', unidade_atendimento: '',
        nome_escola: '', tipo_escola: '', ano_escolar: '', nome_pai: '', idade_pai: '',
        profissao_pai: '', telefone_pai: '', nome_mae: '', idade_mae: '', profissao_mae: '',
        telefone_mae: '', responsavel_financeiro: '', outro_responsavel: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '',
        cidade: '', estado: '', observacoes: '', diagnostico_principal: '',
        medical_history: '', queixa_neuropsicologica: '', expectativas_tratamento: ''
      });

    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o cliente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Cadastrar Novo Cliente</h1>
      </div>

      {/* Age Selection */}
      <Card>
        <CardContent className="pt-6">
          <RadioGroup 
            value={ageType} 
            onValueChange={(value) => setAgeType(value as AgeType)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="adult" id="adult" />
              <Label htmlFor="adult">Maior de Idade (18+)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="minor" id="minor" />
              <Label htmlFor="minor">Menor de Idade</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>
              {ageType === 'adult' ? 'Dados Pessoais' : 'Dados Pessoais do Menor'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  placeholder="dd/mm/aaaa"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Gênero</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="nao-informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {ageType === 'minor' ? (
                <>
                  <div>
                    <Label htmlFor="nome_escola">Nome da Escola</Label>
                    <Input
                      id="nome_escola"
                      value={formData.nome_escola}
                      onChange={(e) => handleInputChange('nome_escola', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tipo_escola">Tipo de Escola</Label>
                    <Select value={formData.tipo_escola} onValueChange={(value) => handleInputChange('tipo_escola', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        <SelectItem value="publica">Pública</SelectItem>
                        <SelectItem value="particular">Particular</SelectItem>
                        <SelectItem value="filantrópica">Filantrópica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="ano_escolar">Ano Escolar</Label>
                    <Select value={formData.ano_escolar} onValueChange={(value) => handleInputChange('ano_escolar', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50 max-h-60 overflow-y-auto">
                        <SelectItem value="maternal">Maternal</SelectItem>
                        <SelectItem value="pre-escola">Pré-escola</SelectItem>
                        <SelectItem value="1ano">1º Ano</SelectItem>
                        <SelectItem value="2ano">2º Ano</SelectItem>
                        <SelectItem value="3ano">3º Ano</SelectItem>
                        <SelectItem value="4ano">4º Ano</SelectItem>
                        <SelectItem value="5ano">5º Ano</SelectItem>
                        <SelectItem value="6ano">6º Ano</SelectItem>
                        <SelectItem value="7ano">7º Ano</SelectItem>
                        <SelectItem value="8ano">8º Ano</SelectItem>
                        <SelectItem value="9ano">9º Ano</SelectItem>
                        <SelectItem value="1medio">1º Ano Médio</SelectItem>
                        <SelectItem value="2medio">2º Ano Médio</SelectItem>
                        <SelectItem value="3medio">3º Ano Médio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => handleInputChange('rg', e.target.value)}
                      placeholder="00.000.000-0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="naturalidade">Naturalidade</Label>
                    <Input
                      id="naturalidade"
                      value={formData.naturalidade}
                      onChange={(e) => handleInputChange('naturalidade', e.target.value)}
                      placeholder="Cidade/Estado"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estado_civil">Estado Civil</Label>
                    <Select value={formData.estado_civil} onValueChange={(value) => handleInputChange('estado_civil', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        <SelectItem value="uniao-estavel">União Estável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="escolaridade">Escolaridade</Label>
                    <Select value={formData.escolaridade} onValueChange={(value) => handleInputChange('escolaridade', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fundamental-incompleto">Ensino Fundamental Incompleto</SelectItem>
                        <SelectItem value="fundamental-completo">Ensino Fundamental Completo</SelectItem>
                        <SelectItem value="medio-incompleto">Ensino Médio Incompleto</SelectItem>
                        <SelectItem value="medio-completo">Ensino Médio Completo</SelectItem>
                        <SelectItem value="superior-incompleto">Ensino Superior Incompleto</SelectItem>
                        <SelectItem value="superior-completo">Ensino Superior Completo</SelectItem>
                        <SelectItem value="pos-graduacao">Pós-graduação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="profissao">Profissão</Label>
                    <Input
                      id="profissao"
                      value={formData.profissao}
                      onChange={(e) => handleInputChange('profissao', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(00) 90000-0000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                    <Input
                      id="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                      placeholder="Nome"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                    <Input
                      id="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                      placeholder="(00) 90000-0000"
                    />
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="unidade_atendimento">Unidade de Atendimento</Label>
                <Select value={formData.unidade_atendimento} onValueChange={(value) => handleInputChange('unidade_atendimento', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="madre">Clínica Social (Madre)</SelectItem>
                    <SelectItem value="floresta">Neuro (Floresta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados dos Pais/Responsáveis - Only for minors */}
        {ageType === 'minor' && (
          <Card>
            <CardHeader>
              <CardTitle>Dados dos Pais/Responsáveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Dados do Pai</h3>
                </div>
                
                <div>
                  <Label htmlFor="nome_pai">Nome do Pai</Label>
                  <Input
                    id="nome_pai"
                    value={formData.nome_pai}
                    onChange={(e) => handleInputChange('nome_pai', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="idade_pai">Idade do Pai</Label>
                  <Input
                    id="idade_pai"
                    type="number"
                    value={formData.idade_pai}
                    onChange={(e) => handleInputChange('idade_pai', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="profissao_pai">Profissão do Pai</Label>
                  <Input
                    id="profissao_pai"
                    value={formData.profissao_pai}
                    onChange={(e) => handleInputChange('profissao_pai', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone_pai">Telefone do Pai</Label>
                  <Input
                    id="telefone_pai"
                    value={formData.telefone_pai}
                    onChange={(e) => handleInputChange('telefone_pai', e.target.value)}
                    placeholder="(00) 90000-0000"
                  />
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 mt-6">Dados da Mãe</h3>
                </div>
                
                <div>
                  <Label htmlFor="nome_mae">Nome da Mãe</Label>
                  <Input
                    id="nome_mae"
                    value={formData.nome_mae}
                    onChange={(e) => handleInputChange('nome_mae', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="idade_mae">Idade da Mãe</Label>
                  <Input
                    id="idade_mae"
                    type="number"
                    value={formData.idade_mae}
                    onChange={(e) => handleInputChange('idade_mae', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="profissao_mae">Profissão da Mãe</Label>
                  <Input
                    id="profissao_mae"
                    value={formData.profissao_mae}
                    onChange={(e) => handleInputChange('profissao_mae', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone_mae">Telefone da Mãe</Label>
                  <Input
                    id="telefone_mae"
                    value={formData.telefone_mae}
                    onChange={(e) => handleInputChange('telefone_mae', e.target.value)}
                    placeholder="(00) 90000-0000"
                  />
                </div>

                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Responsabilidade</h3>
                </div>
                
                <div>
                  <Label htmlFor="responsavel_financeiro">Responsável Financeiro</Label>
                  <Select value={formData.responsavel_financeiro} onValueChange={(value) => handleInputChange('responsavel_financeiro', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="pai">Pai</SelectItem>
                      <SelectItem value="mae">Mãe</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="outro_responsavel">Outro Responsável (se aplicável)</Label>
                  <Input
                    id="outro_responsavel"
                    value={formData.outro_responsavel}
                    onChange={(e) => handleInputChange('outro_responsavel', e.target.value)}
                    placeholder="Nome e parentesco"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Digite o CEP para preenchimento automático.
                </p>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="logradouro">Logradouro (Rua, Av.)</Label>
                <Input
                  id="logradouro"
                  value={formData.logradouro}
                  onChange={(e) => handleInputChange('logradouro', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outras Informações */}
        <Card>
          <CardHeader>
            <CardTitle>Outras Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="observacoes">Observações Gerais</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações Clínicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Clínicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="diagnostico_principal">Diagnóstico Principal</Label>
              <Textarea
                id="diagnostico_principal"
                value={formData.diagnostico_principal}
                onChange={(e) => handleInputChange('diagnostico_principal', e.target.value)}
                placeholder="Diagnóstico médico ou neurológico"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="medical_history">Histórico Médico Relevante</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => handleInputChange('medical_history', e.target.value)}
                placeholder="Doenças pré-existentes, cirurgias, medicamentos"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="queixa_neuropsicologica">Queixa Principal Neuropsicológica</Label>
              <Textarea
                id="queixa_neuropsicologica"
                value={formData.queixa_neuropsicologica}
                onChange={(e) => handleInputChange('queixa_neuropsicologica', e.target.value)}
                placeholder="Relato do cliente/responsável sobre as dificuldades"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="expectativas_tratamento">Expectativas do Tratamento</Label>
              <Textarea
                id="expectativas_tratamento"
                value={formData.expectativas_tratamento}
                onChange={(e) => handleInputChange('expectativas_tratamento', e.target.value)}
                placeholder="O que o cliente/família espera do acompanhamento"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </form>
    </div>
  );
}