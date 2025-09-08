import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key } from 'lucide-react';

interface PasswordManagerProps {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
}

export default function PasswordManager({ employeeId, employeeName, employeeEmail }: PasswordManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);
    try {
      // Usar a função administrativa do Supabase para atualizar senha
      const { error } = await supabase.auth.admin.updateUserById(employeeId, {
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Senha alterada com sucesso para ${employeeName}!`,
      });

      setIsOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      // Como fallback, enviar email de reset
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(employeeEmail, {
          redirectTo: window.location.origin + '/reset-password'
        });

        if (resetError) throw resetError;

        toast({
          title: "Email de Reset Enviado",
          description: `Um email de redefinição de senha foi enviado para ${employeeEmail}`,
        });
        setIsOpen(false);
      } catch (resetError) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível alterar a senha. Tente novamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="h-4 w-4 mr-2" />
          Trocar Senha
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Senha - {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePasswordReset} disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}