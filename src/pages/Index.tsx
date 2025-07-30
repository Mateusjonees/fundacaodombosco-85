import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { FolderStructure } from '@/components/FolderStructure';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FolderOpen, Upload as UploadIcon } from 'lucide-react';

const Index = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary to-primary-glow rounded-xl shadow-lg">
              <FolderOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Gerenciador de Arquivos
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Organize seus arquivos de forma simples e eficiente. Crie pastas e faça upload de documentos facilmente.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Folder Structure */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Pastas</h2>
            </div>
            <FolderStructure />
          </div>

          {/* File Upload */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <UploadIcon className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Upload de Arquivos</h2>
            </div>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        </div>

        {/* Stats */}
        {uploadedFiles.length > 0 && (
          <>
            <Separator className="my-8" />
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-accent/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{uploadedFiles.length}</div>
                  <div className="text-sm text-muted-foreground">Arquivos Selecionados</div>
                </div>
                <div className="text-center p-4 bg-accent/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {(uploadedFiles.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">MB Total</div>
                </div>
                <div className="text-center p-4 bg-accent/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {new Set(uploadedFiles.map(file => file.type)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Tipos Diferentes</div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
