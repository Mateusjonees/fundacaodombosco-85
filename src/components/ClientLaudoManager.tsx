import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  FileCheck2, 
  Calendar, 
  User, 
  Download, 
  Eye,
  FileText,
  Trash2,
  Pencil,
  Upload,
  Printer
} from 'lucide-react';
import { useLaudos, useCreateLaudo, useDeleteLaudo, Laudo } from '@/hooks/useLaudos';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { printBlankLaudoPdf } from '@/utils/prescriptionPdf';

interface Client {
  id: string;
  name: string;
}

interface ClientLaudoManagerProps {
  client: Client;
}

const LAUDO_TYPES = [
  { value: 'neuropsicologico', label: 'Neuropsicológico' },
  { value: 'psicologico', label: 'Psicológico' },
  { value: 'fonoaudiologico', label: 'Fonoaudiológico' },
  { value: 'medico', label: 'Médico' },
  { value: 'outro', label: 'Outro' }
];

export default function ClientLaudoManager({ client }: ClientLaudoManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: laudos, isLoading } = useLaudos(client.id);
  const createLaudo = useCreateLaudo();
  const deleteLaudo = useDeleteLaudo();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLaudo, setSelectedLaudo] = useState<Laudo | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [laudoDate, setLaudoDate] = useState(new Date().toISOString().split('T')[0]);
  const [laudoType, setLaudoType] = useState('neuropsicologico');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleView = (laudo: Laudo) => {
    setSelectedLaudo(laudo);
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
      const { data, error } = await supabase.storage
        .from('laudos')
        .download(laudo.file_path);

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
      const { data, error } = await supabase.storage
        .from('laudos')
        .createSignedUrl(laudo.file_path, 3600);

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

  const handleSubmit = async () => {
    if (!user || !title.trim()) return;

    setUploading(true);
    try {
      let filePath: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${selectedFile.name.replace(/[{}[\]<>]/g, '').replace(/\s+/g, '_')}`;
        filePath = `${client.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('laudos')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;
      }

      await createLaudo.mutateAsync({
        client_id: client.id,
        employee_id: user.id,
        laudo_date: laudoDate,
        laudo_type: laudoType,
        title: title.trim(),
        description: description.trim() || undefined,
        file_path: filePath
      });

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
        await supabase.storage
          .from('laudos')
          .remove([selectedLaudo.file_path]);
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
    setLaudoDate(new Date().toISOString().split('T')[0]);
    setLaudoType('neuropsicologico');
    setTitle('');
    setDescription('');
    setSelectedFile(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getLaudoTypeLabel = (type: string) => {
    return LAUDO_TYPES.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Laudos</h3>
          <Badge variant="secondary">{laudos?.length || 0}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => printBlankLaudoPdf()} className="gap-2">
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
      {(!laudos || laudos.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <FileCheck2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-2">Nenhum laudo cadastrado</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em "Novo Laudo" para adicionar o primeiro laudo do paciente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Laudo List */}
      {laudos && laudos.length > 0 && (
        <div className="space-y-3">
          {laudos.map((laudo) => (
            <Card key={laudo.id} className="hover:shadow-md transition-shadow">
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
                        {laudo.file_path && (
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                            Arquivo anexado
                          </Badge>
                        )}
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
                      {laudo.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {laudo.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="sm" onClick={() => handleView(laudo)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {laudo.file_path && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleViewFile(laudo)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(laudo)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedLaudo(laudo);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5" />
              Novo Laudo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laudo-date">Data do Laudo</Label>
                <Input
                  id="laudo-date"
                  type="date"
                  value={laudoDate}
                  onChange={(e) => setLaudoDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laudo-type">Tipo</Label>
                <Select value={laudoType} onValueChange={setLaudoType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAUDO_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Laudo de Avaliação Neuropsicológica"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição ou observações sobre o laudo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo (PDF, DOC)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx"
              />
              <p className="text-xs text-muted-foreground">
                Opcional: anexe o arquivo do laudo
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={uploading || !title.trim()}
            >
              {uploading ? 'Salvando...' : 'Salvar Laudo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5" />
              Detalhes do Laudo
            </DialogTitle>
          </DialogHeader>

          {selectedLaudo && (
            <div className="space-y-4">
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

              {selectedLaudo.description && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{selectedLaudo.description}</p>
                </div>
              )}

              {selectedLaudo.file_path && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleViewFile(selectedLaudo)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(selectedLaudo)}>
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                </div>
              )}
            </div>
          )}
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
    </div>
  );
}
