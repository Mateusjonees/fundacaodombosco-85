import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2,
  Brain,
  Stethoscope as StethoscopeIcon,
  Clipboard,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

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
  onSelect?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onReport?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
}

const getUnitConfig = (unit?: string) => {
  switch (unit) {
    case "madre":
      return {
        label: "Clínica Social",
        Icon: Building2,
        gradient: "from-blue-500 to-cyan-500",
        bgLight: "bg-blue-50 dark:bg-blue-950/30",
        textColor: "text-blue-700 dark:text-blue-300",
        borderColor: "border-blue-200 dark:border-blue-800"
      };
    case "floresta":
      return {
        label: "Neuroavaliação",
        Icon: Brain,
        gradient: "from-violet-500 to-purple-500",
        bgLight: "bg-violet-50 dark:bg-violet-950/30",
        textColor: "text-violet-700 dark:text-violet-300",
        borderColor: "border-violet-200 dark:border-violet-800"
      };
    case "atendimento_floresta":
      return {
        label: "Atend. Floresta",
        Icon: StethoscopeIcon,
        gradient: "from-emerald-500 to-teal-500",
        bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
        textColor: "text-emerald-700 dark:text-emerald-300",
        borderColor: "border-emerald-200 dark:border-emerald-800"
      };
    default:
      return {
        label: "N/A",
        Icon: Clipboard,
        gradient: "from-gray-400 to-gray-500",
        bgLight: "bg-muted/50",
        textColor: "text-muted-foreground",
        borderColor: "border-border"
      };
  }
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
        border shadow-sm hover:shadow-md hover:-translate-y-0.5
        ${isSelected ? 'ring-2 ring-primary' : ''}
        ${!client.is_active ? 'opacity-60' : ''}
        cursor-pointer
      `}
      onClick={onView}
    >
      {/* Barra de cor da unidade */}
      <div className={`h-1.5 bg-gradient-to-r ${unitConfig.gradient}`} />
      
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          {showCheckbox && (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox 
                checked={isSelected}
                onCheckedChange={() => onSelect?.()}
                className="h-4 w-4 rounded-full"
              />
            </div>
          )}

          {/* Avatar */}
          <UserAvatar name={client.name} size="md" />

          {/* Nome + unidade + status */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate leading-tight uppercase">
              {client.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${unitConfig.bgLight} ${unitConfig.textColor} border ${unitConfig.borderColor}`}>
                <UnitIcon className="h-3 w-3" />
                {unitConfig.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                client.is_active 
                  ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${client.is_active ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                {client.is_active ? 'Ativo' : 'Inativo'}
              </span>
              {age !== null && age < 18 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                  Menor
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}