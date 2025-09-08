import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SignUpFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const EMPLOYEE_ROLES = [
  { value: 'director', label: 'Diretor(a)' },
  { value: 'coordinator_madre', label: 'Coordenador(a) Madre' },
  { value: 'coordinator_floresta', label: 'Coordenador(a) Floresta' },
  { value: 'staff', label: 'Funcionário(a) Geral' },
  { value: 'intern', label: 'Estagiário(a)' },
  { value: 'musictherapist', label: 'Musicoterapeuta' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'receptionist', label: 'Recepcionista' },
  { value: 'psychologist', label: 'Psicólogo(a)' },
  { value: 'psychopedagogue', label: 'Psicopedagogo(a)' },
  { value: 'speech_therapist', label: 'Fonoaudiólogo(a)' },
  { value: 'nutritionist', label: 'Nutricionista' },
  { value: 'physiotherapist', label: 'Fisioterapeuta' }
];

export const SignUpForm = ({ onSuccess, onSwitchToLogin }: SignUpFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('staff');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
            employee_role: employeeRole,
            phone: phone,
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no Cadastro",
          description: error.message,
        });
        return;
      }

      if (data.user && !data.session) {
        toast({
          title: "Verifique seu email",
          description: "Enviamos um link de confirmação para seu email.",
        });
      } else {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Bem-vindo ao sistema.",
        });
        
        onSuccess();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bubble bubble-1"></div>
      <div className="login-bubble bubble-2"></div>
      <div className="login-bubble bubble-3"></div>
      
      <Card className="login-form">
        <CardHeader>
          <CardTitle className="login-form h1">FUNDAÇÃO DOM BOSCO</CardTitle>
          <p className="login-subtitle">Cadastro de Funcionário</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="seu@email.com"
              />
            </div>
            <div className="form-group">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="form-group">
              <Label htmlFor="role">Função</Label>
              <Select value={employeeRole} onValueChange={setEmployeeRole} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua função" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Sua senha"
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Já tem uma conta? Fazer login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};