import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MessageBackupService } from '@/services/messageBackupService';
import { 
  Download, 
  Archive, 
  Calendar, 
  FileText,
  AlertCircle
} from 'lucide-react';

export const MessageBackupManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFullBackup = async () => {
    setLoading(true);
    try {
      const blob = await MessageBackupService.backupAllMessages();
      MessageBackupService.downloadBackup(blob);
      
      toast({
        title: "Backup completo realizado",
        description: "Todas as mensagens foram exportadas com sucesso!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no backup",
        description: "Não foi possível criar o backup das mensagens.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeBackup = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Datas necessárias",
        description: "Por favor, selecione as datas de início e fim.",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        variant: "destructive",
        title: "Datas inválidas",
        description: "A data de início deve ser anterior à data de fim.",
      });
      return;
    }

    setLoading(true);
    try {
      const blob = await MessageBackupService.backupMessagesByDate(
        startDate + 'T00:00:00.000Z', 
        endDate + 'T23:59:59.999Z'
      );
      MessageBackupService.downloadBackup(
        blob, 
        `backup_mensagens_${startDate}_${endDate}.json`
      );
      
      toast({
        title: "Backup por período realizado",
        description: `Mensagens de ${startDate} até ${endDate} foram exportadas!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no backup",
        description: "Não foi possível criar o backup das mensagens por período.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBackup = async () => {
    setLoading(true);
    try {
      await MessageBackupService.createAutoBackup();
      
      toast({
        title: "Backup automático configurado",
        description: "Backup automático das mensagens foi criado e salvo!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no backup automático",
        description: "Não foi possível configurar o backup automático.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Archive className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Backup de Mensagens</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Backup Completo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />
              Backup Completo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exporta todas as mensagens do sistema em um arquivo JSON.
            </p>
            <Button 
              onClick={handleFullBackup} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Fazer Backup Completo
            </Button>
          </CardContent>
        </Card>

        {/* Backup por Período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Backup por Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data de Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data de Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleDateRangeBackup} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Backup por Período
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Backup Automático
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cria um backup completo e salva automaticamente no seu dispositivo.
          </p>
          <Button 
            onClick={handleAutoBackup} 
            disabled={loading}
            variant="secondary"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent mr-2" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Configurar Backup Automático
          </Button>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Importante sobre os backups:
              </p>
              <ul className="mt-1 text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Os backups incluem todas as mensagens de canais e conversas diretas</li>
                <li>• Arquivos são salvos em formato JSON para fácil importação</li>
                <li>• Recomendamos fazer backup regular dos dados</li>
                <li>• Os backups incluem informações de remetente, destinatário e timestamps</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};