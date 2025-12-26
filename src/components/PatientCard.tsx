import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Eye, 
  Edit, 
  FileText, 
  Power, 
  Phone, 
  Calendar, 
  MapPin,
  User,
  Stethoscope
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
}

const getUnitConfig = (unit?: string) => {
  switch (unit) {
    case "madre":
      return {
        label: "Clínica Social",
        icon: "🏥",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        textColor: "text-blue-600 dark:text-blue-400",
        accentColor: "bg-blue-500"
      };
    case "floresta":
      return {
        label: "Neuroavaliação",
        icon: "🧠",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        textColor: "text-emerald-600 dark:text-emerald-400",
        accentColor: "bg-emerald-500"
      };
    case "atendimento_floresta":
      return {
        label: "Atend. Floresta",
        icon: "🩺",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        textColor: "text-purple-600 dark:text-purple-400",
        accentColor: "bg-purple-500"
      };
    default:
      return {
        label: "Não definido",
        icon: "📋",
        bgColor: "bg-muted",
        borderColor: "border-border",
        textColor: "text-muted-foreground",
        accentColor: "bg-muted-foreground"
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
  showActions = true,
  onSelect,
  onView,
  onEdit,
  onReport,
  onToggleStatus
}: PatientCardProps) {
  const unitConfig = getUnitConfig(client.unit);
  const age = calculateAge(client.birth_date);

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-300 hover:shadow-lg
        ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}
        ${!client.is_active ? 'opacity-75' : ''}
        group cursor-pointer
      `}
      onClick={onView}
    >
      {/* Barra colorida no topo baseada na unidade */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${unitConfig.accentColor}`} />
      
      <CardContent className="p-4 pt-5">
        <div className="flex items-start gap-3">
          {/* Checkbox para seleção */}
          {showCheckbox && (
            <div 
              className="pt-1"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
              }}
            >
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onSelect}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          )}

          {/* Avatar */}
          <UserAvatar 
            name={client.name} 
            size="lg"
            className={`${unitConfig.bgColor} ${unitConfig.textColor} ring-2 ring-background shadow-sm`}
          />

          {/* Informações principais */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate leading-tight">
                  {client.name}
                </h3>
                
                {/* Badges de status e unidade */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0 ${unitConfig.bgColor} ${unitConfig.borderColor} ${unitConfig.textColor}`}
                  >
                    {unitConfig.icon} {unitConfig.label}
                  </Badge>
                  
                  <Badge 
                    variant={client.is_active ? "default" : "secondary"}
                    className={`text-xs px-2 py-0 ${
                      client.is_active 
                        ? 'bg-green-500/90 text-white border-0' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {client.is_active ? '● Ativo' : '○ Inativo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="mt-3 space-y-1.5 text-sm">
              {client.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{client.phone}</span>
                </div>
              )}
              
              {age !== null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{age} anos</span>
                  {age < 18 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
                      Menor
                    </Badge>
                  )}
                </div>
              )}

              {client.diagnosis && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">{client.diagnosis}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>Cadastro: {new Date(client.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        {showActions && (
          <div 
            className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onView}
              className="h-8 px-2.5 hover:bg-blue-500/10 hover:text-blue-600"
              title="Visualizar"
            >
              <Eye className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline text-xs">Ver</span>
            </Button>
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 px-2.5 hover:bg-orange-500/10 hover:text-orange-600"
                title="Editar"
              >
                <Edit className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-xs">Editar</span>
              </Button>
            )}
            
            {onReport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReport}
                className="h-8 px-2.5 hover:bg-purple-500/10 hover:text-purple-600"
                title="Relatório"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            
            {onToggleStatus && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleStatus}
                className={`h-8 px-2.5 ${
                  client.is_active 
                    ? 'hover:bg-red-500/10 hover:text-red-600' 
                    : 'hover:bg-green-500/10 hover:text-green-600'
                }`}
                title={client.is_active ? "Desativar" : "Ativar"}
              >
                <Power className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
