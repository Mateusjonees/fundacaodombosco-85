import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/UserAvatar";
import { Phone, ClipboardCheck, ClipboardX, FileCheck, FileX } from "lucide-react";

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

/**
 * Tabela de pacientes — layout compacto e legível sem scroll horizontal
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
    <div className="w-full overflow-x-auto rounded-lg border border-border/50">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
            {isAdmin && (
              <TableHead className="w-8 px-2">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[15%] px-2">PACIENTE</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[7%] px-2">DN</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[3.5%] px-1 text-center">ID.</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[10%] px-2">CONTATO</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[11%] px-2">PROFISSIONAL</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[10%] px-2">PROFISSIONAL</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[5%] px-1 text-center">LAUDO</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[4.5%] px-1 text-center">STATUS</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[7.5%] px-2">1ª SESSÃO</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[7.5%] px-2">ÚLT. ATIV.</TableHead>
            <TableHead className="font-bold text-[11px] tracking-wider text-foreground/80 w-[7.5%] px-2">CADASTRO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const age = getAge(client.birth_date);
            return (
              <TableRow
                key={client.id}
                className={`
                  transition-colors cursor-pointer group border-b border-border/30
                  ${selectedClients.includes(client.id) ? "bg-primary/8" : "hover:bg-muted/50"}
                  ${!client.is_active ? "opacity-50" : ""}
                `}
                onClick={() => onView(client)}
              >
                {isAdmin && (
                  <TableCell className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => onToggleSelect(client.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="px-2 py-2.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <UserAvatar name={client.name} size="sm" />
                    <span className="font-semibold text-[11px] uppercase tracking-wide truncate text-foreground">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground px-2 py-2.5">{fmtDate(client.birth_date)}</TableCell>
                <TableCell className="text-[11px] font-semibold text-center px-1 py-2.5 text-foreground">{age ?? '—'}</TableCell>
                <TableCell className="px-2 py-2.5">
                  {client.phone ? (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  ) : <span className="text-[11px] text-muted-foreground/50">—</span>}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground px-2 py-2.5 truncate">
                  {clientProfessionals.get(client.id) || <span className="text-muted-foreground/50">—</span>}
                </TableCell>
                <TableCell className="px-1 py-2.5 text-center">
                  {clientLaudoIds.has(client.id) ? (
                    <FileCheck className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <FileX className="h-4 w-4 text-amber-500/80 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="px-1 py-2.5 text-center">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${client.is_active ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-muted-foreground/30'}`} />
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground px-2 py-2.5">{fmtDate(firstAppointments.get(client.id))}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground px-2 py-2.5">{fmtDate(lastAppointments.get(client.id))}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground px-2 py-2.5">{fmtDate(client.created_at?.slice(0, 10))}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

ClientsTable.displayName = 'ClientsTable';
