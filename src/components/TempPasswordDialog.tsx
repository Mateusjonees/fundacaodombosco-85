import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, AlertTriangle, KeyRound, ClipboardList } from 'lucide-react';

interface TempPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  employeeEmail: string;
  tempPassword: string;
  employeeCpf?: string;
  employeeUnit?: string;
  employeeRole?: string;
}

export const TempPasswordDialog = ({
  isOpen,
  onClose,
  employeeName,
  employeeEmail,
  tempPassword,
  employeeCpf,
  employeeUnit,
  employeeRole,
}: TempPasswordDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast({
        title: 'Senha copiada!',
        description: 'A senha temporária foi copiada para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar a senha. Copie manualmente.',
      });
    }
  };

  const buildSummary = () => {
    const lines = [
      'Acesso ao sistema Fundação Dom Bosco',
      '',
      `Nome: ${employeeName}`,
      employeeCpf ? `CPF: ${employeeCpf}` : null,
      employeeUnit ? `Unidade: ${employeeUnit}` : null,
      employeeRole ? `Cargo: ${employeeRole}` : null,
      `Email (login): ${employeeEmail}`,
      `Senha temporária: ${tempPassword}`,
      '',
      'Atenção: a senha deve ser alterada no primeiro acesso.',
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary());
      setSummaryCopied(true);
      toast({
        title: 'Resumo copiado!',
        description: 'Os dados do novo usuário foram copiados.',
      });
      setTimeout(() => setSummaryCopied(false), 3000);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o resumo.',
      });
    }
  };

  const handleClose = () => {
    setCopied(false);
    setSummaryCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            Usuário Criado com Sucesso!
          </DialogTitle>
          <DialogDescription>
            O usuário já pode fazer login no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resumo do cadastro */}
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium text-right">{employeeName}</span>
            </div>
            {employeeCpf && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">CPF</span>
                <span className="font-medium text-right font-mono">{employeeCpf}</span>
              </div>
            )}
            {employeeUnit && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Unidade</span>
                <span className="font-medium text-right">{employeeUnit}</span>
              </div>
            )}
            {employeeRole && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Cargo</span>
                <span className="font-medium text-right">{employeeRole}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-right break-all">{employeeEmail}</span>
            </div>
          </div>

          {/* Senha temporária */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Senha Temporária</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={tempPassword}
                readOnly
                className="font-mono text-lg tracking-wider bg-muted"
              />
              <Button
                type="button"
                variant={copied ? 'default' : 'outline'}
                size="icon"
                onClick={handleCopyPassword}
                className={copied ? 'bg-green-600 hover:bg-green-700' : ''}
                title="Copiar senha"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="w-full"
            >
              {summaryCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" /> Resumo copiado
                </>
              ) : (
                <>
                  <ClipboardList className="h-4 w-4 mr-2" /> Copiar resumo completo
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <p className="font-medium text-sm">Atenção</p>
            </div>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5 list-disc list-inside">
              <li>Esta senha só será exibida <strong>uma vez</strong></li>
              <li>Envie ao usuário de forma segura</li>
              <li>Ele deverá <strong>alterá-la no primeiro login</strong></li>
            </ul>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full">
          Entendi
        </Button>
      </DialogContent>
    </Dialog>
  );
};
