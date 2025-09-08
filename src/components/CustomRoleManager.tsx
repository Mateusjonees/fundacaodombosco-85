import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  is_active: boolean;
}

export default function CustomRoleManager() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os cargos.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O nome do cargo é obrigatório.",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingRole) {
        const { error } = await supabase
          .from('custom_roles')
          .update({
            name: roleName.trim(),
            description: roleDescription.trim() || null,
          })
          .eq('id', editingRole.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cargo atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('custom_roles')
          .insert({
            name: roleName.trim(),
            description: roleDescription.trim() || null,
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cargo criado com sucesso!",
        });
      }

      setIsCreateOpen(false);
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
      loadRoles();
    } catch (error: any) {
      console.error('Error saving role:', error);
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Já existe um cargo com este nome.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível salvar o cargo.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: CustomRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setIsCreateOpen(true);
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cargo?')) return;

    try {
      const { error } = await supabase
        .from('custom_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cargo desativado com sucesso!",
      });

      loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o cargo.",
      });
    }
  };

  const resetForm = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gerenciar Cargos</CardTitle>
          <Dialog 
            open={isCreateOpen} 
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRole ? 'Editar Cargo' : 'Criar Novo Cargo'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Nome do Cargo</Label>
                  <Input
                    id="roleName"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Ex: Psicólogo Sênior, Assistente Administrativo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Descrição (opcional)</Label>
                  <Textarea
                    id="roleDescription"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Descreva as responsabilidades deste cargo..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Salvando...' : editingRole ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {roles.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum cargo customizado criado ainda.
            </p>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{role.name}</h4>
                    <Badge variant={role.is_active ? "default" : "secondary"}>
                      {role.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {role.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(role)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  {role.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(role.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}