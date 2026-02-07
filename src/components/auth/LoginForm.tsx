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
              Acesse o sistema Clínica
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={isLoading} 
                placeholder="seu@email.com"
                className="h-12 rounded-xl border-input bg-muted/50 focus:bg-card"
              />
            </div>

            <div className="form-group">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  disabled={isLoading} 
                  placeholder="••••••••"
                  className="pr-10 h-12 rounded-xl border-input bg-muted/50 focus:bg-card"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
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

        {/* Install App Link */}
        <div className="text-center mt-4">
          <a
            href="/install"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Instalar o aplicativo
          </a>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-white/30 mt-2">
          Fundação Dom Bosco · Clínica
        </p>
      </div>
    </div>
  );
};
