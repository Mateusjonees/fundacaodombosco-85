import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Folder, Download, Eye, Upload, Plus } from 'lucide-react';

export default function StaticFiles() {
  const staticFiles = [
    {
      name: 'index.html',
      path: '/static/index.html',
      type: 'Página Principal',
      size: '12 KB',
      modified: 'Hoje',
      description: 'Página principal para gerenciar arquivos estáticos'
    },
    {
      name: 'exemplo-formulario.html',
      path: '/static/formularios/exemplo-formulario.html',
      type: 'Formulário',
      size: '18 KB',
      modified: 'Hoje',
      description: 'Formulário de cadastro de cliente completo'
    },
    {
      name: 'relatorio-mensal.html',
      path: '/static/relatorios/relatorio-mensal.html',
      type: 'Relatório',
      size: '25 KB',
      modified: 'Hoje',
      description: 'Template de relatório mensal com gráficos e estatísticas'
    }
  ];

  const folders = [
    { name: 'formularios', count: 1, description: 'Formulários HTML personalizados' },
    { name: 'relatorios', count: 1, description: 'Relatórios e dashboards' },
    { name: 'documentos', count: 0, description: 'Documentos e manuais' },
    { name: 'templates', count: 0, description: 'Templates reutilizáveis' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Arquivos Estáticos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus arquivos HTML, formulários e relatórios personalizados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Arquivo
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Arquivo
          </Button>
        </div>
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Acesso Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.open('/static/index.html', '_blank')}
            >
              <FileText className="h-6 w-6" />
              Gerenciar Arquivos
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.open('/static/formularios/exemplo-formulario.html', '_blank')}
            >
              <FileText className="h-6 w-6" />
              Formulário de Exemplo
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.open('/static/relatorios/relatorio-mensal.html', '_blank')}
            >
              <FileText className="h-6 w-6" />
              Relatório Mensal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Pastas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.name}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Folder className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="font-medium">{folder.name}</div>
                    <Badge variant="outline" className="text-xs">
                      {folder.count} arquivos
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{folder.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Arquivos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staticFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <p className="text-sm text-muted-foreground">{file.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{file.type}</Badge>
                      <Badge variant="secondary">{file.size}</Badge>
                      <Badge variant="outline">{file.modified}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(file.path, '_blank')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">📁 Organizando Arquivos</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Crie pastas para diferentes tipos de arquivo</li>
                  <li>• Use nomes descritivos para fácil identificação</li>
                  <li>• Mantenha uma estrutura consistente</li>
                  <li>• Documente o propósito de cada arquivo</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🔗 Acessando Arquivos</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Arquivos ficam em <code>/static/nome-arquivo.html</code></li>
                  <li>• Use subpastas: <code>/static/pasta/arquivo.html</code></li>
                  <li>• Links podem ser integrados no sistema principal</li>
                  <li>• Arquivos são servidos diretamente pelo servidor</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Dica Importante</h4>
              <p className="text-sm text-blue-800">
                Para adicionar novos arquivos HTML ao sistema, você pode colocá-los na pasta 
                <code className="bg-blue-100 px-1 rounded">public/static/</code> e eles ficarão 
                automaticamente disponíveis através das URLs correspondentes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}