import { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Edit, FileText, Power, Trash2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phone?: string;
  unit?: string;
  is_active: boolean;
  created_at: string;
}

interface ClientsTableProps {
  clients: Client[];
  selectedClients: string[];
  lastAppointments: Map<string, string>;
  isAdmin: boolean;
  canDelete: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onReport: (client: Client) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDelete: (client: Client) => void;
}

/**
 * Tabela de pacientes extraída do Clients.tsx — memoizada para performance
 */
export const ClientsTable = memo(({
  clients,
  selectedClients,
  lastAppointments,
  isAdmin,
  canDelete,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onReport,
  onToggleStatus,
  onDelete,
}: ClientsTableProps) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            {isAdmin && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Última Consulta</TableHead>
            <TableHead>Data de Cadastro</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className={selectedClients.includes(client.id) ? "bg-primary/5" : ""}
            >
              {isAdmin && (
                <TableCell>
                  <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={() => onToggleSelect(client.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.phone || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    client.unit === "madre"
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                      : client.unit === "floresta"
                        ? "border-green-500/50 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        : "border-purple-500/50 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                  }
                >
                  {client.unit === "madre" ? "🏥 Clinica Social" :
                   client.unit === "floresta" ? "🧠 Neuro" :
                   client.unit === "atendimento_floresta" ? "🩺 Atend. Floresta" :
                   client.unit || "N/A"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={client.is_active ? "default" : "secondary"}
                  className={
                    client.is_active
                      ? "bg-green-500/90 hover:bg-green-500 border-0"
                      : "bg-gray-400/90 hover:bg-gray-400 border-0"
                  }
                >
                  {client.is_active ? "✓ Ativo" : "⏸ Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                {lastAppointments.get(client.id)
                  ? <span className="text-sm">{new Date(lastAppointments.get(client.id)!).toLocaleDateString("pt-BR")}</span>
                  : <span className="text-xs text-muted-foreground">—</span>
                }
              </TableCell>
              <TableCell>{new Date(client.created_at).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onView(client)} className="hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all" title="Visualizar" aria-label={`Visualizar ${client.name}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onEdit(client)} className="hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/50 transition-all" title="Editar" aria-label={`Editar ${client.name}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onReport(client)} className="hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50 transition-all" title="Gerar Relatório" aria-label={`Relatório ${client.name}`}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleStatus(client.id, client.is_active)}
                        className={client.is_active ? "hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50 transition-all" : "hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-all"}
                        title={client.is_active ? "Desativar" : "Ativar"}
                        aria-label={`${client.is_active ? 'Desativar' : 'Ativar'} ${client.name}`}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button variant="outline" size="sm" onClick={() => onDelete(client)} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all" title="Excluir permanentemente" aria-label={`Excluir ${client.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

ClientsTable.displayName = 'ClientsTable';
