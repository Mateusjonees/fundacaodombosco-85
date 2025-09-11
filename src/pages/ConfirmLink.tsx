import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ConfirmLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  useEffect(() => {
    // Se já tem tokens na URL, processar automaticamente
    if (accessToken && refreshToken && type === 'signup') {
      handleAutoConfirm();
    }
  }, [accessToken, refreshToken, type]);

  const handleAutoConfirm = async () => {
    try {
      setIsConfirming(true);
      
      // Definir a sessão com os tokens da URL
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken!,
        refresh_token: refreshToken!
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setConfirmed(true);
        toast({
          title: "Email confirmado!",
          description: "Sua conta foi ativada com sucesso.",
        });
      }
    } catch (error: any) {
      console.error('Erro na confirmação automática:', error);
      setError(error.message || 'Erro ao confirmar email');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleConfirmLink = async () => {
    if (confirmed) {
      navigate('/');
      return;
    }
    
    try {
      setIsConfirming(true);
      setError('');

      if (accessToken && refreshToken) {
        // Confirmar o link usando os tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          setConfirmed(true);
          toast({
            title: "Vínculo confirmado!",
            description: "Suas informações foram vinculadas ao sistema com sucesso.",
          });
          
          // Aguardar um pouco antes de redirecionar
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } else {
        throw new Error('Token de confirmação inválido');
      }
    } catch (error: any) {
      console.error('Erro na confirmação:', error);
      setError(error.message || 'Erro ao confirmar vínculo');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível confirmar o vínculo. Tente novamente.",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="login-bubble bubble-1"></div>
      <div className="login-bubble bubble-2"></div>
      <div className="login-bubble bubble-3"></div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <CheckCircle className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            FUNDAÇÃO DOM BOSCO
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema de Gestão Integrada
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {confirmed ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  Vínculo Confirmado!
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Suas informações foram vinculadas ao sistema da Fundação Dom Bosco com sucesso.
                  Você será redirecionado em instantes...
                </p>
              </div>
              <Button onClick={() => navigate('/')} className="w-full">
                Acessar Sistema
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Confirmar Vínculo
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Você está prestes a vincular suas informações ao sistema da{' '}
                  <strong>Fundação Dom Bosco</strong>.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ao confirmar, você concorda em fazer parte da nossa equipe e 
                  aceita os termos de uso do sistema.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleConfirmLink}
                  disabled={isConfirming}
                  className="w-full"
                >
                  {isConfirming ? 'Confirmando...' : 'Sim, Confirmo o Vínculo'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isConfirming}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Se você não solicitou este cadastro, pode ignorar esta mensagem.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}