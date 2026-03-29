import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface ClientFormData {
  name: string;
  phone: string;
  email: string;
  birth_date: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  medical_history: string;
  cpf: string;
  responsible_name: string;
  responsible_phone: string;
  responsible_cpf: string;
  unit: string;
  diagnosis: string;
  neuropsych_complaint: string;
  treatment_expectations: string;
  clinical_observations: string;
}

interface ClientFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ClientFormData;
  onFormChange: (data: ClientFormData) => void;
  onSubmit: () => void;
  isEditing: boolean;
  isSaving: boolean;
  userRole?: string;
}

/**
 * Dialog de cadastro/edição de paciente extraído do Clients.tsx
 */
export const ClientFormDialog = ({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  isEditing,
  isSaving,
  userRole,
}: ClientFormDialogProps) => {
  const updateField = (field: keyof ClientFormData, value: string) => {
    onFormChange({ ...formData, [field]: value });
  };

  const isUnitLocked = userRole === "coordinator_madre" || userRole === "coordinator_floresta" || userRole === "coordinator_atendimento_floresta";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0">
          <Plus className="h-5 w-5" />
          Cadastrar Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Paciente" : "Cadastrar Novo Paciente"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input id="name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Digite o nome completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input id="birth_date" type="date" value={formData.birth_date} onChange={(e) => updateField('birth_date', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" value={formData.cpf} onChange={(e) => updateField('cpf', e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade</Label>
            <Select value={formData.unit} onValueChange={(v) => updateField('unit', v)} disabled={isUnitLocked}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(userRole === "director" || userRole === "receptionist") && (
                  <>
                    <SelectItem value="madre">MADRE (Clínica Social)</SelectItem>
                    <SelectItem value="floresta">Floresta (Neuroavaliação)</SelectItem>
                    <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>
                  </>
                )}
                {userRole === "coordinator_madre" && <SelectItem value="madre">MADRE</SelectItem>}
                {userRole === "coordinator_floresta" && <SelectItem value="floresta">Neuro (Floresta)</SelectItem>}
                {userRole === "coordinator_atendimento_floresta" && <SelectItem value="atendimento_floresta">Atendimento Floresta</SelectItem>}
              </SelectContent>
            </Select>
            {isUnitLocked && (
              <p className="text-sm text-muted-foreground">Você só pode cadastrar clientes para sua unidade.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsible_name">Nome do Responsável</Label>
            <Input id="responsible_name" value={formData.responsible_name} onChange={(e) => updateField('responsible_name', e.target.value)} placeholder="Nome completo do responsável" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsible_phone">Telefone do Responsável</Label>
            <Input id="responsible_phone" value={formData.responsible_phone} onChange={(e) => updateField('responsible_phone', e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsible_cpf">CPF do Responsável Financeiro</Label>
            <Input id="responsible_cpf" value={formData.responsible_cpf} onChange={(e) => updateField('responsible_cpf', e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact">Contato de Emergência</Label>
            <Input id="emergency_contact" value={formData.emergency_contact} onChange={(e) => updateField('emergency_contact', e.target.value)} placeholder="Nome do contato de emergência" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
            <Input id="emergency_phone" value={formData.emergency_phone} onChange={(e) => updateField('emergency_phone', e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Textarea id="address" value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Rua, número, bairro, cidade, CEP" />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="medical_history">Histórico Médico</Label>
            <Textarea id="medical_history" value={formData.medical_history} onChange={(e) => updateField('medical_history', e.target.value)} placeholder="Histórico médico relevante, medicações em uso, alergias..." />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea id="diagnosis" value={formData.diagnosis} onChange={(e) => updateField('diagnosis', e.target.value)} placeholder="Diagnóstico médico ou hipótese diagnóstica" />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="neuropsych_complaint">Queixa Neuropsicológica</Label>
            <Textarea id="neuropsych_complaint" value={formData.neuropsych_complaint} onChange={(e) => updateField('neuropsych_complaint', e.target.value)} placeholder="Queixa principal relacionada à neuropsicologia" />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="treatment_expectations">Expectativas do Tratamento</Label>
            <Textarea id="treatment_expectations" value={formData.treatment_expectations} onChange={(e) => updateField('treatment_expectations', e.target.value)} placeholder="O que o paciente/família espera do tratamento" />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="clinical_observations">Observações Clínicas</Label>
            <Textarea id="clinical_observations" value={formData.clinical_observations} onChange={(e) => updateField('clinical_observations', e.target.value)} placeholder="Observações gerais sobre o paciente" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={!formData.name || isSaving}>
            {isSaving ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
