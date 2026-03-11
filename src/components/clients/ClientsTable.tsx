import { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/UserAvatar";
import { Eye, Edit, FileText, Power, Trash2, Phone, FileCheck, FileX } from "lucide-react";

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
  clientLaudoIds: Set<string>;
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
 * Tabela de pacientes — memoizada para performance
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
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {isAdmin && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="font-semibold">Paciente</TableHead>
            <TableHead className="font-semibold">Contato</TableHead>
            <TableHead className="font-semibold">Área</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Última Consulta</TableHead>
            <TableHead className="font-semibold">Cadastro</TableHead>
            <TableHead className="font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className={`
                transition-colors cursor-pointer group
                ${selectedClients.includes(client.id) ? "bg-primary/5" : "hover:bg-muted/40"}
                ${!client.is_active ? "opacity-50" : ""}
              `}
              onClick={() => onView(client)}
            >
              {isAdmin && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={() => onToggleSelect(client.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <UserAvatar name={client.name} size="sm" />
                  <span className="font-semibold text-sm uppercase tracking-wide">{client.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {client.phone ? (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {client.phone}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium ${
                    client.unit === "madre"
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                      : client.unit === "floresta"
                        ? "border-green-500/50 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        : "border-purple-500/50 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                  }`}
                >
                  {client.unit === "madre" ? "🏥 Clínica Social" :
                   client.unit === "floresta" ? "🧠 Neuro" :
                   client.unit === "atendimento_floresta" ? "🩺 Atend. Floresta" :
                   client.unit || "N/A"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${client.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                  <span className={`text-xs font-medium ${client.is_active ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {client.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {lastAppointments.get(client.id)
                  ? <span className="text-sm">{new Date(lastAppointments.get(client.id)!).toLocaleDateString("pt-BR")}</span>
                  : <span className="text-xs text-muted-foreground italic">Sem registro</span>
                }
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(client.created_at).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => onView(client)} className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600" title="Visualizar">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(client)} className="h-8 w-8 p-0 hover:bg-orange-500/10 hover:text-orange-600" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onReport(client)} className="h-8 w-8 p-0 hover:bg-purple-500/10 hover:text-purple-600" title="Relatório">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(client.id, client.is_active)}
                        className={`h-8 w-8 p-0 ${client.is_active ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"}`}
                        title={client.is_active ? "Desativar" : "Ativar"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(client)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" title="Excluir">
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
