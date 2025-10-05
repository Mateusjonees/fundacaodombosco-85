import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuditService } from '@/services/auditService';
import logo from '@/assets/fundacao-dom-bosco-saude-logo.png';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignUp?: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Log login attempt
      await AuditService.logAction({
        entityType: 'auth',
        action: 'login_attempted',
        metadata: { user_email: email }
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login
        await AuditService.logAction({
          entityType: 'auth',
          action: 'login_failed',
          metadata: { 
            user_email: email,
            error_message: error.message
          }
        });

        toast({
          variant: "destructive",
          title: "Erro no Login",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema.",
      });
      
      onSuccess();
    } catch (error) {
      // Log unexpected error
      await AuditService.logAction({
        entityType: 'auth',
        action: 'login_error',
        metadata: { 
          user_email: email,
          error: 'unexpected_error'
        }
      });

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
        <CardHeader className="text-center space-y-6 pt-8 pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg">
              <img 
                src={logo} 
                alt="Fundação Dom Bosco Saúde" 
                className="h-20 w-auto transition-transform hover:scale-105 duration-300"
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#2E7D32] to-[#43A047] bg-clip-text text-transparent">
              Sistema de Gestão
            </CardTitle>
            <p className="text-sm font-medium text-muted-foreground/80">Acesso Restrito</p>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground/90">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="seu@email.com"
                className="mt-2 h-12 px-4 bg-white border-primary/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="form-group">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground/90">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
                className="mt-2 h-12 px-4 bg-white border-primary/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-[#2E7D32] to-[#43A047] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 mt-6" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Entrando...
                </span>
              ) : (
                'Entrar no Sistema'
              )}
            </Button>
          </form>
          
          {onSwitchToSignUp && false && (
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={onSwitchToSignUp}
                disabled={isLoading}
              >
                Não tem uma conta? Criar conta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};