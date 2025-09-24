// Script temporário para resetar senha da Amanda Paola
// Execute este código no console do navegador quando logado como diretor
import { supabase } from "@/integrations/supabase/client";

const resetAmandaPassword = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('change-user-password', {
      body: {
        userId: 'd137ae9c-fb15-4a07-8a99-3016cd5da132',
        newPassword: '123456'
      }
    });
    
    if (error) {
      console.error('Erro ao resetar senha:', error);
    } else {
      console.log('Senha resetada com sucesso:', data);
      alert('Senha da Amanda Paola foi resetada para: 123456');
    }
  } catch (error) {
    console.error('Erro inesperado:', error);
  }
};

// Para executar: resetAmandaPassword();