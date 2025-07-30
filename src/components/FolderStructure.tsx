import { useState } from 'react';
import { Folder, FolderOpen, File, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FolderItem[];
  parent?: string;
}

export const FolderStructure = () => {
  const [folders, setFolders] = useState<FolderItem[]>([
    {
      id: '1',
      name: 'uploads',
      type: 'folder',
      children: []
    },
    {
      id: '2',
      name: 'documents',
      type: 'folder',
      children: []
    },
    {
      id: '3',
      name: 'images',
      type: 'folder',
      children: []
    }
  ]);
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2', '3']));
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const { toast } = useToast();

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      type: 'folder',
      children: []
    };

    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setShowNewFolderInput(false);
    
    toast({
      title: "Pasta criada",
      description: `Pasta "${newFolder.name}" criada com sucesso`,
    });
  };

  const deleteFolder = (folderId: string) => {
    setFolders(folders.filter(folder => folder.id !== folderId));
    toast({
      title: "Pasta removida",
      description: "Pasta removida com sucesso",
    });
  };

  const renderFolder = (item: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const paddingLeft = level * 20;

    return (
      <div key={item.id}>
        <div 
          className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer group"
          style={{ paddingLeft: paddingLeft + 8 }}
        >
          <div 
            className="flex items-center space-x-2 flex-1"
            onClick={() => item.type === 'folder' && toggleFolder(item.id)}
          >
            {item.type === 'folder' ? (
              isExpanded ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary" />
            ) : (
              <File className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          
          {item.type === 'folder' && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(item.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {item.type === 'folder' && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Estrutura de Pastas</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewFolderInput(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Pasta
        </Button>
      </div>

      {showNewFolderInput && (
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Nome da pasta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            className="flex-1"
          />
          <Button onClick={createFolder} size="sm">
            Criar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setShowNewFolderInput(false);
              setNewFolderName('');
            }}
          >
            Cancelar
          </Button>
        </div>
      )}

      <div className="space-y-1">
        {folders.map(folder => renderFolder(folder))}
      </div>
    </Card>
  );
};