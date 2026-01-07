import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, User, Heart, MapPin, Stethoscope, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  cpf?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  responsible_name?: string;
  responsible_phone?: string;
  responsible_cpf?: string;
  unit?: string;
  address?: string;
  diagnosis?: string;
  medical_history?: string;
  neuropsych_complaint?: string;
  treatment_expectations?: string;
  clinical_observations?: string;
  is_active: boolean;
  created_at: string;
}

interface ClientEditTabProps {
  client: Client;
  onSuccess: () => void;
}

export const ClientEditTab = ({ client, onSuccess }: ClientEditTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birth_date: '',
    email: '',
    phone: '',
    responsible_name: '',
    responsible_phone: '',
    responsible_cpf: '',
    unit: '',
    address: '',
    diagnosis: '',
    medical_history: '',
    neuropsych_complaint: '',
    treatment_expectations: '',
    clinical_observations: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        cpf: client.cpf || '',
        birth_date: client.birth_date || '',
        email: client.email || '',
        phone: client.phone || '',
        responsible_name: client.responsible_name || '',
        responsible_phone: client.responsible_phone || '',
        responsible_cpf: client.responsible_cpf || '',
        unit: client.unit || '',
        address: client.address || '',
        diagnosis: client.diagnosis || '',
        medical_history: client.medical_history || '',
        neuropsych_complaint: client.neuropsych_complaint || '',
        treatment_expectations: client.treatment_expectations || '',
        clinical_observations: client.clinical_observations || '',
      });
    }
  }, [client]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "O nome do paciente é obrigatório.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name.trim(),
          cpf: formData.cpf || null,
          birth_date: formData.birth_date || null,
          email: formData.email || null,
          phone: formData.phone || null,
          responsible_name: formData.responsible_name || null,
          responsible_phone: formData.responsible_phone || null,
          responsible_cpf: formData.responsible_cpf || null,
          unit: formData.unit || null,
          address: formData.address || null,
          diagnosis: formData.diagnosis || null,
          medical_history: formData.medical_history || null,
          neuropsych_complaint: formData.neuropsych_complaint || null,
          treatment_expectations: formData.treatment_expectations || null,
          clinical_observations: formData.clinical_observations || null,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados do paciente atualizados com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar os dados do paciente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome do paciente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select value={formData.unit} onValueChange={(value) => handleChange('unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="madre">MADRE (Clínica Social)</SelectItem>
                  <SelectItem value="floresta">Floresta (Neuroavaliação)</SelectItem>
                  <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsável */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-5 w-5 text-primary" />
            Responsável (para menores de idade)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible_name">Nome do Responsável</Label>
              <Input
                id="responsible_name"
                value={formData.responsible_name}
                onChange={(e) => handleChange('responsible_name', e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_phone">Telefone do Responsável</Label>
              <Input
                id="responsible_phone"
                value={formData.responsible_phone}
                onChange={(e) => handleChange('responsible_phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_cpf">CPF do Responsável</Label>
              <Input
                id="responsible_cpf"
                value={formData.responsible_cpf}
                onChange={(e) => handleChange('responsible_cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua, número, bairro, cidade, estado, CEP"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Clínicas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-5 w-5 text-primary" />
            Informações Clínicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => handleChange('diagnosis', e.target.value)}
                placeholder="Diagnóstico do paciente"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neuropsych_complaint">Queixa Principal</Label>
              <Textarea
                id="neuropsych_complaint"
                value={formData.neuropsych_complaint}
                onChange={(e) => handleChange('neuropsych_complaint', e.target.value)}
                placeholder="Queixa neuropsicológica principal"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_history">Histórico Médico</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => handleChange('medical_history', e.target.value)}
                placeholder="Histórico de saúde e tratamentos anteriores"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_expectations">Expectativas do Tratamento</Label>
              <Textarea
                id="treatment_expectations"
                value={formData.treatment_expectations}
                onChange={(e) => handleChange('treatment_expectations', e.target.value)}
                placeholder="Expectativas e objetivos do tratamento"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinical_observations">Observações Clínicas</Label>
              <Textarea
                id="clinical_observations"
                value={formData.clinical_observations}
                onChange={(e) => handleChange('clinical_observations', e.target.value)}
                placeholder="Observações gerais sobre o paciente"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
