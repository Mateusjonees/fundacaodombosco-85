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
    const fileName = `${clientId}/${Date.now()}.${fileExt}`;
    const filePath = `prescriptions/${fileName}`;

    const { error } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    return filePath;
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Nova Receita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data e Tipo de Atendimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prescription-date">Data da Prescrição</Label>
              <Input
                id="prescription-date"
                type="date"
                value={prescriptionDate}
                onChange={(e) => setPrescriptionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-type">Tipo de Atendimento</Label>
              <Select value={serviceType} onValueChange={(v: 'sus' | 'private') => setServiceType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Demanda Própria</SelectItem>
                  <SelectItem value="sus">SUS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Caixa única de Receita */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Receita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Escreva aqui o conteúdo da receita: medicamentos, dosagens, orientações, etc..."
                value={prescriptionText}
                onChange={(e) => setPrescriptionText(e.target.value)}
                rows={10}
                className="resize-none"
              />

              {/* Upload de arquivo */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Ou anexe um arquivo</Label>
                <div className="flex items-center gap-2">
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
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                  {uploadedFile && (
                    <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[200px]">{uploadedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Opções de exibição no PDF */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium text-muted-foreground">Opções de exibição no PDF</Label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-prescription-date"
                  checked={showPrescriptionDate}
                  onCheckedChange={(checked) => setShowPrescriptionDate(checked === true)}
                />
                <Label htmlFor="show-prescription-date" className="text-sm font-normal cursor-pointer">
                  Incluir Data de Lançamento no PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-print-date"
                  checked={showPrintDate}
                  onCheckedChange={(checked) => setShowPrintDate(checked === true)}
                />
                <Label htmlFor="show-print-date" className="text-sm font-normal cursor-pointer">
                  Incluir Data de Impressão no PDF
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createPrescription.isPending || isUploading || (!prescriptionText.trim() && !uploadedFile)}
          >
            {isUploading ? 'Enviando...' : createPrescription.isPending ? 'Salvando...' : 'Salvar Receita'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
