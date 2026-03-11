import { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/UserAvatar";
import { Eye, Edit, FileText, Power, Trash2, Phone, FileCheck, FileX, ClipboardCheck, ClipboardX } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  unit?: string;
  is_active: boolean;
  created_at: string;
  neuro_test_start_date?: string;
  neuro_report_deadline?: string;
  neuro_evaluation_status?: string;
  responsible_name?: string;
  responsible_cpf?: string;
  notes?: string;
}

interface ClientsTableProps {
  clients: Client[];
  selectedClients: string[];
  lastAppointments: Map<string, string>;
  clientLaudoIds?: Set<string>;
  clientAnamnesisIds?: Set<string>;
  clientProfessionals?: Map<string, string>;
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

/** Calcula idade a partir da data de nascimento */
const getAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
};

/** Formata data ISO para dd/mm/yyyy */
const fmtDate = (d?: string | null): string => {
  if (!d) return '—';
  return new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR');
};

/** Extrai dia/horário das notas */
const extractScheduleInfo = (notes?: string): string => {
  if (!notes) return '—';
  const match = notes.match(/Dia\/Horário:\s*([^\n|]+)/);
  return match ? match[1].trim() : '—';
};

/** Extrai observações das notas */
const extractObservations = (notes?: string): string => {
  if (!notes) return '—';
  const match = notes.match(/Obs planilha:\s*([^\n]+)/);
  return match ? match[1].trim() : '—';
};

/**
 * Tabela de pacientes com todas as colunas do controle ambulatorial
 */
export const ClientsTable = memo(({
  clients,
  selectedClients,
  lastAppointments,
  clientLaudoIds = new Set<string>(),
  clientAnamnesisIds = new Set<string>(),
  clientProfessionals = new Map<string, string>(),
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
    <ScrollArea className="w-full whitespace-nowrap">
      <Table className="min-w-[1400px]">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {isAdmin && (
              <TableHead className="w-10 sticky left-0 bg-muted/30 z-10">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="font-semibold sticky left-10 bg-muted/30 z-10 min-w-[180px]">Paciente</TableHead>
            <TableHead className="font-semibold min-w-[100px]">DN</TableHead>
            <TableHead className="font-semibold w-[50px]">Idade</TableHead>
            <TableHead className="font-semibold min-w-[120px]">Contato</TableHead>
            <TableHead className="font-semibold min-w-[150px]">Responsável</TableHead>
            <TableHead className="font-semibold min-w-[130px]">Profissional</TableHead>
            <TableHead className="font-semibold w-[70px]">Anamnese</TableHead>
            <TableHead className="font-semibold w-[70px]">Laudo</TableHead>
            <TableHead className="font-semibold w-[70px]">Status</TableHead>
            <TableHead className="font-semibold min-w-[100px]">1ª Sessão</TableHead>
            <TableHead className="font-semibold min-w-[100px]">Data Fim</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const age = getAge(client.birth_date);
            return (
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
                  <TableCell className="sticky left-0 bg-card z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => onToggleSelect(client.id)}
                    />
                  </TableCell>
                )}
                {/* Nome */}
                <TableCell className="sticky left-10 bg-card z-10">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={client.name} size="sm" />
                    <span className="font-semibold text-xs uppercase tracking-wide truncate max-w-[160px]">{client.name}</span>
                  </div>
                </TableCell>
                {/* Data Nascimento */}
                <TableCell className="text-xs text-muted-foreground">{fmtDate(client.birth_date)}</TableCell>
                {/* Idade */}
                <TableCell className="text-xs font-medium text-center">{age !== null ? age : '—'}</TableCell>
                {/* Contato */}
                <TableCell>
                  {client.phone ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[100px]">{client.phone}</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                {/* Responsável */}
                <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {client.responsible_name || '—'}
                </TableCell>
                {/* Profissional vinculado */}
                <TableCell className="text-xs text-muted-foreground truncate max-w-[130px]">
                  {clientProfessionals.get(client.id) || '—'}
                </TableCell>
                {/* Anamnese */}
                <TableCell>
                  {clientAnamnesisIds.has(client.id) ? (
                    <div className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-[10px] font-medium text-green-700 dark:text-green-400">Sim</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <ClipboardX className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">Não</span>
                    </div>
                  )}
                </TableCell>
                {/* Laudo */}
                <TableCell>
                  {clientLaudoIds.has(client.id) ? (
                    <div className="flex items-center gap-1">
                      <FileCheck className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-[10px] font-medium text-green-700 dark:text-green-400">Sim</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <FileX className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">Não</span>
                    </div>
                  )}
                </TableCell>
                {/* Status */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${client.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                    <span className={`text-[10px] font-medium ${client.is_active ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {client.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </TableCell>
                {/* 1ª Sessão */}
                <TableCell className="text-xs text-muted-foreground">{fmtDate(client.neuro_test_start_date)}</TableCell>
                {/* Data Fim */}
                <TableCell className="text-xs text-muted-foreground">{fmtDate(client.neuro_report_deadline)}</TableCell>
                {/* Dia/Horário */}
                <TableCell className="text-xs text-muted-foreground">{extractScheduleInfo(client.notes)}</TableCell>
                {/* Observações */}
                <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{extractObservations(client.notes)}</TableCell>
                {/* Ações */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => onView(client)} className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary" title="Visualizar">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(client)} className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary" title="Editar">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onReport(client)} className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary" title="Relatório">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => onToggleStatus(client.id, client.is_active)}
                          className={`h-7 w-7 p-0 ${client.is_active ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-green-500/10 hover:text-green-600"}`}
                          title={client.is_active ? "Desativar" : "Ativar"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => onDelete(client)} className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive" title="Excluir">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
});

ClientsTable.displayName = 'ClientsTable';
