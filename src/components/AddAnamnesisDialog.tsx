import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList } from 'lucide-react';

interface AddAnamnesisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

export default function AddAnamnesisDialog({ 
  open, 
  onOpenChange, 
  clientId, 
  onSuccess 
}: AddAnamnesisDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    queixaPrincipal: '',
    hma: '',
    hpp: '',
    exameFisico: '',
    hd: '',
    conduta: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Verifica se pelo menos um campo foi preenchido
    const hasContent = Object.values(formData).some(v => v.trim());
    if (!hasContent) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha pelo menos um campo da anamnese.",
      });
      return;
    }

    setLoading(true);
    try {
      // Monta o texto da nota com os campos preenchidos
      const sections = [];
      if (formData.queixaPrincipal.trim()) {
        sections.push(`**QUEIXA PRINCIPAL:**\n${formData.queixaPrincipal.trim()}`);
      }
      if (formData.hma.trim()) {
        sections.push(`**HMA (História da Moléstia Atual):**\n${formData.hma.trim()}`);
      }
      if (formData.hpp.trim()) {
        sections.push(`**HPP (História Patológica Pregressa):**\n${formData.hpp.trim()}`);
      }
      if (formData.exameFisico.trim()) {
        sections.push(`**EXAME FÍSICO:**\n${formData.exameFisico.trim()}`);
      }
      if (formData.hd.trim()) {
        sections.push(`**HD (Hipótese Diagnóstica):**\n${formData.hd.trim()}`);
      }
      if (formData.conduta.trim()) {
        sections.push(`**CONDUTA:**\n${formData.conduta.trim()}`);
      }

      const noteText = sections.join('\n\n');

      const { error } = await supabase
        .from('client_notes')
        .insert({
          client_id: clientId,
          note_text: noteText,
          note_type: 'anamnesis',
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Anamnese registrada com sucesso!",
      });

      // Limpa o formulário
      setFormData({
        queixaPrincipal: '',
        hma: '',
        hpp: '',
        exameFisico: '',
        hd: '',
        conduta: ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving anamnesis:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar a anamnese.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Nova Anamnese
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Preencha os campos desejados. Todos os campos são opcionais.
          </p>

          {/* Queixa Principal */}
          <div className="space-y-2">
            <Label htmlFor="queixaPrincipal">Queixa Principal</Label>
            <Textarea
              id="queixaPrincipal"
              value={formData.queixaPrincipal}
              onChange={(e) => handleChange('queixaPrincipal', e.target.value)}
              placeholder="Descreva a queixa principal do paciente..."
              rows={3}
            />
          </div>

          {/* HMA */}
          <div className="space-y-2">
            <Label htmlFor="hma">HMA (História da Moléstia Atual)</Label>
            <Textarea
              id="hma"
              value={formData.hma}
              onChange={(e) => handleChange('hma', e.target.value)}
              placeholder="Descreva a história da moléstia atual..."
              rows={3}
            />
          </div>

          {/* HPP */}
          <div className="space-y-2">
            <Label htmlFor="hpp">HPP (História Patológica Pregressa)</Label>
            <Textarea
              id="hpp"
              value={formData.hpp}
              onChange={(e) => handleChange('hpp', e.target.value)}
              placeholder="Descreva a história patológica pregressa..."
              rows={3}
            />
          </div>

          {/* Exame Físico */}
          <div className="space-y-2">
            <Label htmlFor="exameFisico">Exame Físico</Label>
            <Textarea
              id="exameFisico"
              value={formData.exameFisico}
              onChange={(e) => handleChange('exameFisico', e.target.value)}
              placeholder="Descreva os achados do exame físico..."
              rows={3}
            />
          </div>

          {/* HD */}
          <div className="space-y-2">
            <Label htmlFor="hd">HD (Hipótese Diagnóstica)</Label>
            <Textarea
              id="hd"
              value={formData.hd}
              onChange={(e) => handleChange('hd', e.target.value)}
              placeholder="Descreva a hipótese diagnóstica..."
              rows={3}
            />
          </div>

          {/* Conduta */}
          <div className="space-y-2">
            <Label htmlFor="conduta">Conduta</Label>
            <Textarea
              id="conduta"
              value={formData.conduta}
              onChange={(e) => handleChange('conduta', e.target.value)}
              placeholder="Descreva a conduta a ser seguida..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Anamnese'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
