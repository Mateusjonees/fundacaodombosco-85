import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteClientDialogProps {
  clientName: string | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Dialog de confirmação de exclusão de paciente
 */
export const DeleteClientDialog = ({
  clientName,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteClientDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-destructive">
            <div className="p-2 bg-destructive/10 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            Excluir Paciente Permanentemente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong className="text-foreground">{clientName}</strong>?
          </p>
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-sm space-y-1">
            <p className="font-medium text-destructive">⚠️ Esta ação é irreversível!</p>
            <p className="text-muted-foreground text-xs">
              Todos os dados serão removidos: prontuários, agendamentos, laudos, receitas, notas, pagamentos e vinculações.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="rounded-xl gap-2">
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
