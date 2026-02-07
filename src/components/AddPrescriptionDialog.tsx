import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pill, Upload, X, FileText } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCreatePrescription } from '@/hooks/usePrescriptions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTodayLocalISODate } from '@/lib/utils';

interface AddPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export default function AddPrescriptionDialog({ open, onOpenChange, clientId }: AddPrescriptionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createPrescription = useCreatePrescription();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [prescriptionDate, setPrescriptionDate] = useState(getTodayLocalISODate());
  const [serviceType, setServiceType] = useState<'sus' | 'private'>('private');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [showPrescriptionDate, setShowPrescriptionDate] = useState(true);
  const [showPrintDate, setShowPrintDate] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB.'
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[{}[\]<>\s]/g, '_');
    const fileName = `${clientId}/${Date.now()}_${sanitizedName}`;

    const { error } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    return fileName;
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate that there's content (text or file)
    if (!prescriptionText.trim() && !uploadedFile) {
      toast({
        variant: 'destructive',
        title: 'Conteúdo obrigatório',
        description: 'Escreva o conteúdo da receita ou anexe um arquivo.'
      });
      return;
    }

    setIsUploading(true);

    try {
      let filePath: string | null = null;
      
      if (uploadedFile) {
        filePath = await uploadFile(uploadedFile);
        if (!filePath) {
          toast({
            variant: 'destructive',
            title: 'Erro no upload',
            description: 'Não foi possível fazer o upload do arquivo.'
          });
          setIsUploading(false);
          return;
        }
      }

      // Store the text content in general_instructions and file path in diagnosis (reusing field)
      await createPrescription.mutateAsync({
        client_id: clientId,
        employee_id: user.id,
        prescription_date: prescriptionDate,
        medications: [], // Empty since we're using free text
        general_instructions: prescriptionText || undefined,
        diagnosis: filePath || undefined, // Reusing diagnosis field to store file path
        status: 'active',
        service_type: serviceType,
        show_prescription_date: showPrescriptionDate,
        show_print_date: showPrintDate
      });

      // Reset form
      setPrescriptionDate(getTodayLocalISODate());
      setServiceType('private');
      setPrescriptionText('');
      setShowPrescriptionDate(true);
      setShowPrintDate(false);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving prescription:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            Nova Receita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Data e Tipo de Atendimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prescription-date" className="text-sm font-medium">Data da Prescrição</Label>
              <Input
                id="prescription-date"
                type="date"
                value={prescriptionDate}
                onChange={(e) => setPrescriptionDate(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-type" className="text-sm font-medium">Tipo de Atendimento</Label>
              <Select value={serviceType} onValueChange={(v: 'sus' | 'private') => setServiceType(v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Demanda Própria</SelectItem>
                  <SelectItem value="sus">SUS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Caixa de Receita */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Conteúdo da Receita
            </Label>
            <Textarea
              placeholder="Escreva aqui o conteúdo da receita: medicamentos, dosagens, orientações, etc..."
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              rows={8}
              className="resize-none rounded-xl border-border/60 focus:border-primary/50"
            />
          </div>

          {/* Upload de arquivo */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-dashed border-border/60">
            <Label className="text-sm font-medium text-muted-foreground">Ou anexe um arquivo</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30"
              >
                <Upload className="h-4 w-4" />
                Selecionar Arquivo
              </Button>
              {uploadedFile && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-3 py-2 rounded-xl">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm truncate max-w-[200px] font-medium">{uploadedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-full"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
            </p>
          </div>

          {/* Opções de exibição no PDF */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opções do PDF</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-prescription-date"
                  checked={showPrescriptionDate}
                  onCheckedChange={(checked) => setShowPrescriptionDate(checked === true)}
                />
                <Label htmlFor="show-prescription-date" className="text-sm font-normal cursor-pointer">
                  Data de Lançamento
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-print-date"
                  checked={showPrintDate}
                  onCheckedChange={(checked) => setShowPrintDate(checked === true)}
                />
                <Label htmlFor="show-print-date" className="text-sm font-normal cursor-pointer">
                  Data de Impressão
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createPrescription.isPending || isUploading || (!prescriptionText.trim() && !uploadedFile)}
            className="rounded-xl gap-2"
          >
            {isUploading ? 'Enviando...' : createPrescription.isPending ? 'Salvando...' : 'Salvar Receita'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
