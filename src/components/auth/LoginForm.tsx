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
    <div className="login-modern-container">
      {/* Top Wave Decoration */}
      <div className="login-wave-top">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" fill="url(#gradient1)"/>
          <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" fill="url(#gradient2)" opacity="0.7"/>
          <defs>
            <linearGradient id="gradient1" x1="0" y1="0" x2="1440" y2="0">
              <stop offset="0%" stopColor="#2E7D32"/>
              <stop offset="50%" stopColor="#43A047"/>
              <stop offset="100%" stopColor="#2E7D32"/>
            </linearGradient>
            <linearGradient id="gradient2" x1="0" y1="0" x2="1440" y2="0">
              <stop offset="0%" stopColor="#43A047"/>
              <stop offset="100%" stopColor="#66BB6A"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Centered Login Card */}
      <div className="login-modern-content">
        <div className="login-modern-card">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <img 
                src={logo} 
                alt="Fundação Dom Bosco Saúde" 
                className="h-16 md:h-20"
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Bem-vindo
            </h1>
            <p className="text-sm text-gray-500">
              Sistema de Gestão - Acesso Restrito
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
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
                className="h-12 px-4 bg-white border border-gray-300 rounded-lg focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
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
                className="h-12 px-4 bg-white border border-gray-300 rounded-lg focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all text-base"
              />
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="remember"
                className="w-4 h-4 text-[#2E7D32] bg-white border-gray-300 rounded focus:ring-[#2E7D32] focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer select-none">
                Lembrar-me
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mt-6" 
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

      {/* Bottom Wave with Watermark */}
      <div className="login-wave-bottom">
        <div className="login-watermark">saúde</div>
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="url(#gradient3)"/>
          <path d="M0,96L48,90.7C96,85,192,75,288,74.7C384,75,480,85,576,90.7C672,96,768,96,864,90.7C960,85,1056,75,1152,74.7C1248,75,1344,85,1392,90.7L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="url(#gradient4)" opacity="0.7"/>
          <defs>
            <linearGradient id="gradient3" x1="0" y1="0" x2="1440" y2="0">
              <stop offset="0%" stopColor="#2E7D32"/>
              <stop offset="50%" stopColor="#43A047"/>
              <stop offset="100%" stopColor="#2E7D32"/>
            </linearGradient>
            <linearGradient id="gradient4" x1="0" y1="0" x2="1440" y2="0">
              <stop offset="0%" stopColor="#43A047"/>
              <stop offset="100%" stopColor="#66BB6A"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};