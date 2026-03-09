import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/UserAvatar";
import { getUnitStyle } from "@/utils/unitUtils";
import { CalendarDays, Phone, Stethoscope } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  unit?: string;
  diagnosis?: string;
  is_active: boolean;
  created_at: string;
  cpf?: string;
}

interface PatientCardProps {
  client: Client;
  isSelected?: boolean;
  showCheckbox?: boolean;
  showActions?: boolean;
  lastAppointment?: string;
  onSelect?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onReport?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
}

const getUnitConfig = (unit?: string) => {
  const style = getUnitStyle(unit);
  return {
    label: style.label,
    Icon: style.Icon,
    gradient: style.gradient,
    bgLight: style.bgLight,
    textColor: style.textColor,
    borderColor: style.borderColor,
  };
};

const calculateAge = (birthDate?: string) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export function PatientCard({
  client,
  isSelected = false,
  showCheckbox = false,
  lastAppointment,
  onSelect,
  onView,
}: PatientCardProps) {
  const unitConfig = getUnitConfig(client.unit);
  const age = calculateAge(client.birth_date);
  const UnitIcon = unitConfig.Icon;

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-200 
        border shadow-sm hover:shadow-lg hover:-translate-y-0.5
        ${isSelected ? 'ring-2 ring-primary' : ''}
        ${!client.is_active ? 'opacity-50 grayscale-[30%]' : ''}
        cursor-pointer group
      `}
      onClick={onView}
    >
      {/* Barra de cor da unidade */}
      <div className={`h-1 bg-gradient-to-r ${unitConfig.gradient}`} />
      
      <CardContent className="p-3 sm:p-4">
        {/* Linha principal: avatar + info */}
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {showCheckbox && (
            <div onClick={(e) => e.stopPropagation()} className="pt-1">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={() => onSelect?.()}
                className="h-4 w-4 rounded-full"
              />
            </div>
          )}

          {/* Avatar */}
          <UserAvatar name={client.name} size="md" />

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Nome */}
            <h3 className="font-bold text-sm text-foreground truncate leading-tight uppercase tracking-wide">
              {client.name}
            </h3>

            {/* Badges: unidade + status + idade */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${unitConfig.bgLight} ${unitConfig.textColor} border ${unitConfig.borderColor}`}>
                <UnitIcon className="h-3 w-3" />
                {unitConfig.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                client.is_active 
                  ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${client.is_active ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
                {client.is_active ? 'Ativo' : 'Inativo'}
              </span>
              {age !== null && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                  age < 18 
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {age} anos{age < 18 ? ' · Menor' : ''}
                </span>
              )}
            </div>

            {/* Info extra: telefone, diagnóstico, última consulta */}
            <div className="space-y-0.5 pt-0.5">
              {client.phone && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{client.phone}</span>
                </div>
              )}
              {client.diagnosis && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Stethoscope className="h-3 w-3 shrink-0" />
                  <span className="truncate line-clamp-1">{client.diagnosis}</span>
                </div>
              )}
              {lastAppointment && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  <span>Última: {new Date(lastAppointment).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
