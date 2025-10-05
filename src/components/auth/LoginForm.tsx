import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuditService } from '@/services/auditService';
import logo from '@/assets/fundacao-dom-bosco-saude-logo.png';
import bgImage from '@/assets/dom-bosco-bg.png';

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
    <div className="login-creative-container">
      {/* Background Image */}
      <div className="login-bg-image">
        <img 
          src={bgImage} 
          alt="Dom Bosco Saúde" 
          className="w-full h-full object-cover"
        />
        <div className="login-overlay"></div>
      </div>

      {/* Centered Login Card */}
      <div className="login-card-wrapper">
        <div className="login-card-container">
          {/* Logo and Title - Outside white card */}
          <div className="text-center mb-6 relative z-20">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-2xl p-3 shadow-2xl">
                <img 
                  src={logo} 
                  alt="Fundação Dom Bosco Saúde" 
                  className="h-14 md:h-16"
                />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Bem-vindo
            </h1>
            <p className="text-sm text-white drop-shadow-md">
              Sistema de Gestão - Acesso Restrito
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
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
                  className="h-12 px-4 bg-white border-2 border-gray-200 rounded-xl focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all text-base"
                />
              </div>
              <div className="form-group">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 mb-2 block">
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
                  className="h-12 px-4 bg-white border-2 border-gray-200 rounded-xl focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all text-base"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-[#2E7D32] border-gray-300 rounded focus:ring-[#2E7D32]" />
                  <span className="text-sm text-gray-700">Lembrar-me</span>
                </label>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-[#2E7D32] to-[#43A047] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Entrando...
                  </span>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};