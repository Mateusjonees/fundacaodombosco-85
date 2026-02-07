import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileCheck2, Calendar, User, Download, Eye, FileText, Trash2, Upload, Printer, X, FileDown, ClipboardCheck } from 'lucide-react';
import { useLaudos, useCreateLaudo, useDeleteLaudo, Laudo } from '@/hooks/useLaudos';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { printBlankLaudoPdf, printLaudoPdf, downloadLaudoPdf } from '@/utils/prescriptionPdf';
import { formatDateBR, getTodayLocalISODate } from '@/lib/utils';
interface Client {
  id: string;
  name: string;
}
interface ClientLaudoManagerProps {
  client: Client;
}
const LAUDO_TYPES = [{
  value: 'neuropsicologico',
  label: 'Neuropsicológico'
}, {
  value: 'psicologico',
  label: 'Psicológico'
}, {
  value: 'fonoaudiologico',
  label: 'Fonoaudiológico'
}, {
  value: 'medico',
  label: 'Médico'
}, {
  value: 'outro',
  label: 'Outro'
}];
export default function ClientLaudoManager({
  client
}: ClientLaudoManagerProps) {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    data: laudos,
    isLoading
  } = useLaudos(client.id);
  const createLaudo = useCreateLaudo();
  const deleteLaudo = useDeleteLaudo();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLaudo, setSelectedLaudo] = useState<Laudo | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state - simplified to just text + file
  const [laudoDate, setLaudoDate] = useState(getTodayLocalISODate());
  const [laudoType, setLaudoType] = useState('neuropsicologico');
  const [laudoText, setLaudoText] = useState('');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB.'
        });
        return;
      }
      setSelectedFile(file);
    }
  };
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleView = (laudo: Laudo) => {
    // Force dialog content to refresh even when the dialog is already open
    setSelectedLaudo({ ...laudo });
    setViewDialogOpen(true);
  };
  const handleDownload = async (laudo: Laudo) => {
    if (!laudo.file_path) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Este laudo não possui arquivo anexado."
      });
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.storage.from('laudos').download(laudo.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo_${client.name}_${laudo.laudo_date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading laudo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível baixar o laudo."
      });
    }
  };
  const handleViewFile = async (laudo: Laudo) => {
    if (!laudo.file_path) return;
    try {
      const {
        data,
        error
      } = await supabase.storage.from('laudos').createSignedUrl(laudo.file_path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing laudo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível visualizar o laudo."
      });
    }
  };

  // Imprimir PDF do laudo com conteúdo
  const handlePrintLaudo = async (laudo: Laudo) => {
    if (!laudo.description) {
      toast({
        variant: "destructive",
        title: "Sem conteúdo",
        description: "Este laudo não possui texto para gerar PDF."
      });
      return;
    }
    const professionalName = laudo.employee?.name || 'Profissional';
    await printLaudoPdf(
      { 
        title: laudo.title, 
        description: laudo.description, 
        laudo_date: laudo.laudo_date, 
        laudo_type: laudo.laudo_type 
      },
      client,
      professionalName
    );
  };

  // Baixar PDF do laudo com conteúdo
  const handleDownloadLaudoPdf = async (laudo: Laudo) => {
    if (!laudo.description) {
      toast({
        variant: "destructive",
        title: "Sem conteúdo",
        description: "Este laudo não possui texto para gerar PDF."
      });
      return;
    }
    const professionalName = laudo.employee?.name || 'Profissional';
    await downloadLaudoPdf(
      { 
        title: laudo.title, 
        description: laudo.description, 
        laudo_date: laudo.laudo_date, 
        laudo_type: laudo.laudo_type 
      },
      client,
      professionalName
    );
  };
  const handleSubmit = async () => {
    if (!user) return;

    // Validate that there's content (text or file)
    if (!laudoText.trim() && !selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Conteúdo obrigatório',
        description: 'Escreva o conteúdo do laudo ou anexe um arquivo.'
      });
      return;
    }
    setUploading(true);
    try {
      let filePath: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${selectedFile.name.replace(/[{}[\]<>]/g, '').replace(/\s+/g, '_')}`;
        filePath = `${client.id}/${fileName}`;
        const {
          error: uploadError
        } = await supabase.storage.from('laudos').upload(filePath, selectedFile);
        if (uploadError) throw uploadError;
      }

      // Generate a simple title based on type and date
      const typeLabel = LAUDO_TYPES.find(t => t.value === laudoType)?.label || 'Laudo';
      const generatedTitle = `${typeLabel} - ${formatDateBR(laudoDate)}`;
      await createLaudo.mutateAsync({
        client_id: client.id,
        employee_id: user.id,
        laudo_date: laudoDate,
        laudo_type: laudoType,
        title: generatedTitle,
        description: laudoText.trim() || undefined,
        file_path: filePath
      });

      // Atualizar diagnóstico do cliente se preenchido
      if (diagnosisText.trim()) {
        await supabase
          .from('clients')
          .update({ diagnosis: diagnosisText.trim() })
          .eq('id', client.id);
      }

      // Reset form
      resetForm();
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error creating laudo:', error);
    } finally {
      setUploading(false);
    }
  };
  const handleDelete = async () => {
    if (!selectedLaudo) return;
    try {
      // Delete file from storage if exists
      if (selectedLaudo.file_path) {
        await supabase.storage.from('laudos').remove([selectedLaudo.file_path]);
      }
      await deleteLaudo.mutateAsync({
        id: selectedLaudo.id,
        clientId: client.id
      });
      setDeleteDialogOpen(false);
      setSelectedLaudo(null);
    } catch (error) {
      console.error('Error deleting laudo:', error);
    }
  };
  const resetForm = () => {
    setLaudoDate(getTodayLocalISODate());
    setLaudoType('neuropsicologico');
    setLaudoText('');
    setDiagnosisText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const formatDate = (dateString: string) => formatDateBR(dateString);
  const getLaudoTypeLabel = (type: string) => {
    return LAUDO_TYPES.find(t => t.value === type)?.label || type;
  };
  if (isLoading) {
    return <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>;
  }
  return <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Laudos</h3>
          <Badge variant="secondary">{laudos?.length || 0}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => printBlankLaudoPdf()}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir em Branco
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Laudo
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {(!laudos || laudos.length === 0) && <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <FileCheck2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-2">Nenhum laudo cadastrado</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em "Novo Laudo" para adicionar o primeiro laudo do paciente.
            </p>
          </CardContent>
        </Card>}

      {/* Laudo List */}
      {laudos && laudos.length > 0 && <div className="space-y-3">
          {laudos.map(laudo => <Card key={laudo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileCheck2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">{laudo.title}</span>
                        <Badge variant="outline">{getLaudoTypeLabel(laudo.laudo_type)}</Badge>
                        {laudo.file_path && <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                            Arquivo anexado
                          </Badge>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(laudo.laudo_date)}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {laudo.employee?.name || 'Profissional'}
                        </div>
                      </div>
                      {laudo.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {laudo.description}
                        </p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <Button variant="ghost" size="sm" onClick={() => handleView(laudo)} title="Ver detalhes">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {/* Botões para laudo com conteúdo texto */}
                    {laudo.description && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handlePrintLaudo(laudo)} title="Imprimir PDF">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadLaudoPdf(laudo)} title="Baixar PDF">
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {/* Botões para laudo com arquivo anexado */}
                    {laudo.file_path && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleViewFile(laudo)} title="Ver arquivo">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(laudo)} title="Baixar arquivo">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                      setSelectedLaudo(laudo);
                      setDeleteDialogOpen(true);
                    }} title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="p-2 bg-primary/10 rounded-xl">
                <FileCheck2 className="h-5 w-5 text-primary" />
              </div>
              Novo Laudo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="laudo-date" className="text-sm font-medium">Data do Laudo</Label>
                <Input id="laudo-date" type="date" value={laudoDate} onChange={e => setLaudoDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="laudo-type" className="text-sm font-medium">Tipo</Label>
                <Select value={laudoType} onValueChange={setLaudoType}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAUDO_TYPES.map(type => <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conteúdo do Laudo */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Conteúdo do Laudo
              </Label>
              <Textarea placeholder="Escreva aqui o conteúdo do laudo..." value={laudoText} onChange={e => setLaudoText(e.target.value)} rows={8} className="resize-none rounded-xl border-border/60 focus:border-primary/50" />
            </div>

            {/* Diagnóstico - atualiza automaticamente o cliente */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                Diagnóstico
                <span className="text-xs text-muted-foreground font-normal">(atualiza o cadastro do paciente)</span>
              </Label>
              <Input 
                placeholder="Ex: TEA, TDAH, Dislexia..." 
                value={diagnosisText} 
                onChange={e => setDiagnosisText(e.target.value)} 
                className="h-11 rounded-xl border-border/60 focus:border-emerald-500/50" 
              />
            </div>

            {/* Upload de arquivo */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-dashed border-border/60">
              <Label className="text-sm font-medium text-muted-foreground">Ou anexe um arquivo</Label>
              <div className="flex items-center gap-3 flex-wrap">
                <Input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30">
                  <Upload className="h-4 w-4" />
                  Selecionar Arquivo
                </Button>
                {selectedFile && <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-3 py-2 rounded-xl">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-full" onClick={handleRemoveFile}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>}
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={uploading || (!laudoText.trim() && !selectedFile)} className="rounded-xl gap-2">
              {uploading ? 'Enviando...' : 'Salvar Laudo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent key={selectedLaudo?.id || 'laudo-view'} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5" />
              Detalhes do Laudo
            </DialogTitle>
          </DialogHeader>

          {selectedLaudo && <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(selectedLaudo.laudo_date)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-4 w-4" />
                  {selectedLaudo.employee?.name}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Título</h4>
                <p className="text-sm">{selectedLaudo.title}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Tipo</h4>
                <Badge variant="outline">{getLaudoTypeLabel(selectedLaudo.laudo_type)}</Badge>
              </div>

              {selectedLaudo.description && <div>
                  <h4 className="font-medium text-sm mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{selectedLaudo.description}</p>
                </div>}

              {selectedLaudo.file_path && <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleViewFile(selectedLaudo)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(selectedLaudo)}>
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                </div>}
            </div>}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Tem certeza que deseja excluir este laudo? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLaudo.isPending}>
              {deleteLaudo.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}