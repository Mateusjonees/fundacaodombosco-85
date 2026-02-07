import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuditService } from '@/services/auditService';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignUp?: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await AuditService.logAction({
        entityType: 'auth',
        action: 'login_attempted',
        metadata: { user_email: email }
      });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        await AuditService.logAction({
          entityType: 'auth',
          action: 'login_failed',
          metadata: { user_email: email, error_message: error.message }
        });
        toast({
          variant: "destructive",
          title: "Erro no Login",
          description: error.message
        });
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema."
      });
      onSuccess();
    } catch (error) {
      await AuditService.logAction({
        entityType: 'auth',
        action: 'login_error',
        metadata: { user_email: email, error: 'unexpected_error' }
      });
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bubble bubble-1" />
      <div className="login-bubble bubble-2" />
      <div className="login-bubble bubble-3" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo floating above card */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute -inset-3 bg-white/10 rounded-3xl blur-xl" />
            <img 
              alt="Fundação Dom Bosco" 
              src="/lovable-uploads/d1e09cd0-006f-4737-87e4-4824049ed50a.png" 
              className="relative h-32 w-auto object-contain drop-shadow-2xl" 
              fetchPriority="high"
            />
          </div>
        </div>

        {/* Card */}
        <div className="login-form">
          <div className="space-y-1 mb-8">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-muted-foreground">
              Acesse o sistema de gestão clínica
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading} 
                  placeholder="seu@email.com"
                  className="pl-10 h-12 rounded-xl border-input bg-muted/50 focus:bg-card"
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  disabled={isLoading} 
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 rounded-xl border-input bg-muted/50 focus:bg-card"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-sm font-semibold gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {onSwitchToSignUp && false && (
            <div className="mt-6 text-center">
              <Button variant="link" onClick={onSwitchToSignUp} disabled={isLoading} className="text-xs">
                Não tem uma conta? Criar conta
              </Button>
            </div>
          )}
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-white/30 mt-6">
          Fundação Dom Bosco · Sistema de Gestão
        </p>
      </div>
    </div>
  );
};
