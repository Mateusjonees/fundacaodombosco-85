import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/UserAvatar";
import { Phone, FileCheck, FileX } from "lucide-react";

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

const getAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
};

const fmtDate = (d?: string | null): string => {
  if (!d) return '—';
  return new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR');
};

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
    <div className="w-full overflow-hidden rounded-lg border border-border/40">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/25 hover:bg-muted/25">
            {isAdmin && (
              <TableHead className="w-[32px] px-2">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="font-semibold text-xs text-muted-foreground w-[18%] px-2">PACIENTE</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[9%] px-2">NASC.</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[5%] px-1 text-center">ID.</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[12%] px-2">CONTATO</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[15%] px-2">PROFISSIONAL</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[5%] px-1 text-center">LAUDO</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[5%] px-1 text-center">ST.</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[9%] px-2">1ª SESSÃO</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[9%] px-2">ÚLT. ATIV.</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground w-[9%] px-2">CADASTRO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const age = getAge(client.birth_date);
            return (
              <TableRow
                key={client.id}
                className={`
                  transition-colors cursor-pointer
                  ${selectedClients.includes(client.id) ? "bg-primary/5" : "hover:bg-muted/30"}
                  ${!client.is_active ? "opacity-40" : ""}
                `}
                onClick={() => onView(client)}
              >
                {isAdmin && (
                  <TableCell className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => onToggleSelect(client.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="px-2 py-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <UserAvatar name={client.name} size="sm" />
                    <span className="font-semibold text-xs uppercase tracking-wide truncate text-foreground">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground px-2 py-3">{fmtDate(client.birth_date)}</TableCell>
                <TableCell className="text-xs font-bold text-foreground text-center px-1 py-3">{age ?? '—'}</TableCell>
                <TableCell className="px-2 py-3">
                  {client.phone ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground/40">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground px-2 py-3 truncate">
                  {clientProfessionals.get(client.id) || <span className="text-muted-foreground/40">—</span>}
                </TableCell>
                <TableCell className="px-1 py-3 text-center">
                  {clientLaudoIds.has(client.id) ? (
                    <FileCheck className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <FileX className="h-4 w-4 text-muted-foreground/25 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="px-1 py-3 text-center">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${client.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/25'}`} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground px-2 py-3">{fmtDate(firstAppointments.get(client.id))}</TableCell>
                <TableCell className="text-xs text-muted-foreground px-2 py-3">{fmtDate(lastAppointments.get(client.id))}</TableCell>
                <TableCell className="text-xs text-muted-foreground px-2 py-3">{fmtDate(client.created_at?.slice(0, 10))}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

ClientsTable.displayName = 'ClientsTable';
