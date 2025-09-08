import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  FolderOpen, 
  FileText, 
  Image, 
  File,
  Search,
  Filter,
  Share,
  Tag,
  Calendar,
  HardDrive
} from 'lucide-react';

interface UserFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  category: string;
  description?: string;
  is_private: boolean;
  tags: string[];
  uploaded_at: string;
  updated_at: string;
}

interface FileUpload {
  file: File;
  category: string;
  description: string;
  tags: string[];
  is_private: boolean;
}

export default function FileManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [storageStats, setStorageStats] = useState({ total: 0, used: 0 });

  const [uploadData, setUploadData] = useState<Partial<FileUpload>>({
    category: 'document',
    description: '',
    tags: [],
    is_private: true
  });

  const categories = [
    { value: 'document', label: 'Documentos', icon: FileText },
    { value: 'report', label: 'Relatórios', icon: FileText },
    { value: 'image', label: 'Imagens', icon: Image },
    { value: 'spreadsheet', label: 'Planilhas', icon: FileText },
    { value: 'template', label: 'Templates', icon: File },
    { value: 'other', label: 'Outros', icon: File }
  ];

  useEffect(() => {
    loadFiles();
    loadStorageStats();
  }, [user]);

  const loadFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os arquivos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStorageStats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('file_size')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const totalUsed = data?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
      setStorageStats({
        total: 100 * 1024 * 1024, // 100MB limit
        used: totalUsed
      });
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadData.file || !user) return;

    setUploading(true);
    try {
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Determine bucket based on category
      let bucket = 'user-documents';
      if (uploadData.category === 'report') bucket = 'reports';
      if (uploadData.category === 'template') bucket = 'templates';

      // Upload file to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(bucket)
        .upload(filePath, uploadData.file);

      if (storageError) throw storageError;

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: user.id,
          file_name: uploadData.file.name,
          file_path: storageData.path,
          file_size: uploadData.file.size,
          file_type: fileExt || '',
          mime_type: uploadData.file.type,
          category: uploadData.category || 'document',
          description: uploadData.description,
          is_private: uploadData.is_private ?? true,
          tags: uploadData.tags || []
        });

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });

      setIsUploadDialogOpen(false);
      setUploadData({
        category: 'document',
        description: '',
        tags: [],
        is_private: true
      });
      loadFiles();
      loadStorageStats();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o arquivo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileDownload = async (file: UserFile) => {
    try {
      let bucket = 'user-documents';
      if (file.category === 'report') bucket = 'reports';
      if (file.category === 'template') bucket = 'templates';

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Iniciado",
        description: `Baixando ${file.file_name}...`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível baixar o arquivo.",
      });
    }
  };

  const handleFileDelete = async (file: UserFile) => {
    if (!confirm(`Tem certeza que deseja excluir "${file.file_name}"?`)) return;

    try {
      let bucket = 'user-documents';
      if (file.category === 'report') bucket = 'reports';
      if (file.category === 'template') bucket = 'templates';

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "Arquivo Excluído",
        description: `"${file.file_name}" foi excluído com sucesso.`,
      });

      loadFiles();
      loadStorageStats();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o arquivo.",
      });
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, category: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (category === 'spreadsheet' || mimeType.includes('sheet')) return FileText;
    if (category === 'report') return FileText;
    return File;
  };

  const storagePercentage = (storageStats.used / storageStats.total) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meus Arquivos</h1>
          <p className="text-muted-foreground">
            Gerencie seus documentos, relatórios e arquivos pessoais
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Enviar Arquivo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar Novo Arquivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadData({ ...uploadData, file });
                    }
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
                />
                <p className="text-xs text-muted-foreground">
                  Máximo 10MB. Formatos: PDF, DOC, XLS, PNG, JPG, TXT, CSV
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={uploadData.category} 
                  onValueChange={(value) => setUploadData({ ...uploadData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Descrição opcional do arquivo..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={uploadData.tags?.join(', ')}
                  onChange={(e) => setUploadData({ 
                    ...uploadData, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  placeholder="laudo, neuropsicologia, cliente..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={uploadData.is_private}
                  onChange={(e) => setUploadData({ ...uploadData, is_private: e.target.checked })}
                />
                <Label htmlFor="private">Arquivo privado</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleFileUpload} 
                disabled={uploading || !uploadData.file}
              >
                {uploading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Storage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatFileSize(storageStats.used)} usados</span>
              <span>{formatFileSize(storageStats.total)} total</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {files.length} arquivo{files.length !== 1 ? 's' : ''} • {storagePercentage.toFixed(1)}% usado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Arquivos ({filteredFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando arquivos...</p>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Nenhum arquivo encontrado com os filtros aplicados.' 
                  : 'Nenhum arquivo enviado ainda.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Modificado</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => {
                  const IconComponent = getFileIcon(file.mime_type, file.category);
                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{file.file_name}</div>
                            {file.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-xs">
                                {file.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categories.find(c => c.value === file.category)?.label || file.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(file.file_size)}</TableCell>
                      <TableCell>
                        {new Date(file.updated_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{file.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleFileDownload(file)}
                            title="Baixar"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedFile(file)}
                            title="Visualizar"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleFileDelete(file)}
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* File Details Modal */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.file_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Categoria:</strong> 
                  <Badge variant="outline" className="ml-2">
                    {categories.find(c => c.value === selectedFile.category)?.label}
                  </Badge>
                </div>
                <div>
                  <strong>Tamanho:</strong> {formatFileSize(selectedFile.file_size)}
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedFile.mime_type}
                </div>
                <div>
                  <strong>Privacidade:</strong> {selectedFile.is_private ? 'Privado' : 'Público'}
                </div>
              </div>
              
              {selectedFile.description && (
                <div>
                  <strong>Descrição:</strong>
                  <p className="mt-1 text-sm">{selectedFile.description}</p>
                </div>
              )}
              
              {selectedFile.tags.length > 0 && (
                <div>
                  <strong>Tags:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFile.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>Enviado:</strong> {new Date(selectedFile.uploaded_at).toLocaleString('pt-BR')}
                </div>
                <div>
                  <strong>Modificado:</strong> {new Date(selectedFile.updated_at).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleFileDownload(selectedFile)}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button onClick={() => setSelectedFile(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}