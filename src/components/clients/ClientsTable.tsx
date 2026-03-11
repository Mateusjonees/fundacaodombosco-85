import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/UserAvatar";
import { Phone, FileCheck, FileX, Calendar } from "lucide-react";

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
 * Tabela de pacientes — layout limpo, legível e moderno
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
    <div className="w-full rounded-xl border border-border/40 overflow-hidden">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
            {isAdmin && (
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground min-w-[200px] px-3">PACIENTE</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground min-w-[90px] px-3">NASCIMENTO</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground w-[50px] px-2 text-center">IDADE</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground min-w-[120px] px-3">CONTATO</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground min-w-[150px] px-3">PROFISSIONAL</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground w-[60px] px-2 text-center">LAUDO</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground w-[60px] px-2 text-center">STATUS</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground min-w-[90px] px-3">1ª SESSÃO</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground min-w-[90px] px-3">ÚLT. ATIV.</TableHead>
            <TableHead className="font-semibold text-xs tracking-wide text-muted-foreground min-w-[90px] px-3">CADASTRO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const age = getAge(client.birth_date);
            return (
              <TableRow
                key={client.id}
                className={`
                  transition-all duration-150 cursor-pointer group
                  ${selectedClients.includes(client.id) ? "bg-primary/5" : "hover:bg-muted/40"}
                  ${!client.is_active ? "opacity-40" : ""}
                `}
                onClick={() => onView(client)}
              >
                {isAdmin && (
                  <TableCell className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => onToggleSelect(client.id)}
                    />
                  </TableCell>
                )}

                {/* Paciente */}
                <TableCell className="px-3 py-3.5">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <UserAvatar name={client.name} size="sm" />
                    <span className="font-semibold text-[13px] uppercase tracking-wide truncate text-foreground">
                      {client.name}
                    </span>
                  </div>
                </TableCell>

                {/* Nascimento */}
                <TableCell className="text-[13px] text-muted-foreground px-3 py-3.5">
                  {fmtDate(client.birth_date)}
                </TableCell>

                {/* Idade */}
                <TableCell className="text-center px-2 py-3.5">
                  <span className="text-[13px] font-bold text-foreground">
                    {age ?? '—'}
                  </span>
                </TableCell>

                {/* Contato */}
                <TableCell className="px-3 py-3.5">
                  {client.phone ? (
                    <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  ) : <span className="text-[13px] text-muted-foreground/40">—</span>}
                </TableCell>

                {/* Profissional */}
                <TableCell className="text-[13px] text-muted-foreground px-3 py-3.5 truncate">
                  {clientProfessionals.get(client.id) || <span className="text-muted-foreground/40">—</span>}
                </TableCell>

                {/* Laudo */}
                <TableCell className="px-2 py-3.5 text-center">
                  {clientLaudoIds.has(client.id) ? (
                    <FileCheck className="h-4.5 w-4.5 text-emerald-500 mx-auto" />
                  ) : (
                    <FileX className="h-4.5 w-4.5 text-muted-foreground/30 mx-auto" />
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="px-2 py-3.5 text-center">
                  <span className={`inline-flex items-center justify-center w-3 h-3 rounded-full ${client.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/25'}`} />
                </TableCell>

                {/* 1ª Sessão */}
                <TableCell className="text-[13px] text-muted-foreground px-3 py-3.5">
                  {fmtDate(firstAppointments.get(client.id))}
                </TableCell>

                {/* Última Atividade */}
                <TableCell className="text-[13px] text-muted-foreground px-3 py-3.5">
                  {fmtDate(lastAppointments.get(client.id))}
                </TableCell>

                {/* Cadastro */}
                <TableCell className="text-[13px] text-muted-foreground px-3 py-3.5">
                  {fmtDate(client.created_at?.slice(0, 10))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

ClientsTable.displayName = 'ClientsTable';
