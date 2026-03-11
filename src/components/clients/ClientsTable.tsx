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
  firstAppointments?: Map<string, string>;
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
  firstAppointments = new Map<string, string>(),
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
    <div className="w-full overflow-x-auto">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {isAdmin && (
              <TableHead className="w-7 px-1">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="font-semibold text-[10px] w-[14%] px-1">PACIENTE</TableHead>
            <TableHead className="font-semibold text-[10px] w-[7%] px-1">DN</TableHead>
            <TableHead className="font-semibold text-[10px] w-[4%] px-1 text-center">ID.</TableHead>
            <TableHead className="font-semibold text-[10px] w-[10%] px-1">CONTATO</TableHead>
            <TableHead className="font-semibold text-[10px] w-[10%] px-1">RESPONSÁVEL</TableHead>
            <TableHead className="font-semibold text-[10px] w-[10%] px-1">PROFISSIONAL</TableHead>
            <TableHead className="font-semibold text-[10px] w-[5%] px-1 text-center">ANAM.</TableHead>
            <TableHead className="font-semibold text-[10px] w-[5%] px-1 text-center">LAUDO</TableHead>
            <TableHead className="font-semibold text-[10px] w-[5%] px-1 text-center">STATUS</TableHead>
            <TableHead className="font-semibold text-[10px] w-[7%] px-1">1ª SESSÃO</TableHead>
            <TableHead className="font-semibold text-[10px] w-[7%] px-1">ÚLT. ATIV.</TableHead>
            <TableHead className="font-semibold text-[10px] w-[7%] px-1">CADASTRO</TableHead>
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
                  <TableCell className="px-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => onToggleSelect(client.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="px-1">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <UserAvatar name={client.name} size="sm" />
                    <span className="font-semibold text-[10px] uppercase tracking-wide truncate">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground px-1">{fmtDate(client.birth_date)}</TableCell>
                <TableCell className="text-[10px] font-medium text-center px-1">{age ?? '—'}</TableCell>
                <TableCell className="px-1">
                  {client.phone ? (
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Phone className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  ) : <span className="text-[10px] text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground px-1 truncate">
                  {client.responsible_name || '—'}
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground px-1 truncate">
                  {clientProfessionals.get(client.id) || '—'}
                </TableCell>
                <TableCell className="px-1 text-center">
                  {clientAnamnesisIds.has(client.id) ? (
                    <ClipboardCheck className="h-3.5 w-3.5 text-green-500 mx-auto" />
                  ) : (
                    <ClipboardX className="h-3.5 w-3.5 text-amber-500 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="px-1 text-center">
                  {clientLaudoIds.has(client.id) ? (
                    <FileCheck className="h-3.5 w-3.5 text-green-500 mx-auto" />
                  ) : (
                    <FileX className="h-3.5 w-3.5 text-amber-500 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="px-1 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${client.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground px-1">{fmtDate(firstAppointments.get(client.id))}</TableCell>
                <TableCell className="text-[10px] text-muted-foreground px-1">{fmtDate(lastAppointments.get(client.id))}</TableCell>
                <TableCell className="text-[10px] text-muted-foreground px-1">{fmtDate(client.created_at?.slice(0, 10))}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

ClientsTable.displayName = 'ClientsTable';
