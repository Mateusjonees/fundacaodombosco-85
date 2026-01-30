import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, User, Edit, CheckCircle, XCircle, ArrowRightLeft, Stethoscope, Trash2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PatientPresenceButton from '@/components/PatientPresenceButton';
import { UserAvatar } from '@/components/UserAvatar';
import { PatientDetailsModal } from '@/components/PatientDetailsModal';
import { ProfessionalQuickViewModal } from '@/components/ProfessionalQuickViewModal';

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  title: string;
  status: string;
  notes?: string;
  unit?: string;
  patient_arrived?: boolean;
  arrived_at?: string;
  arrived_confirmed_by?: string;
  patient_confirmed?: boolean;
  patient_confirmed_at?: string;
  email_sent_at?: string;
  clients?: { name: string };
  profiles?: { name: string };
}

interface ScheduleCardProps {
  schedule: Schedule;
  employees: any[];
  userProfile: any;
  isAdmin: boolean;
  canCancelSchedules: boolean;
  canDeleteSchedules: boolean;
  onEdit: (schedule: Schedule) => void;
  onRedirect: (scheduleId: string, newEmployeeId: string) => void;
  onCancelClick: () => void;
  onDeleteClick: () => void;
  onCompleteClick: () => void;
  onPresenceUpdate: () => void;
  getStatusBadge: (status: string) => { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string };
}

const unitColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  madre: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20', label: 'MADRE' },
  floresta: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20', label: 'FLORESTA' },
  atendimento_floresta: { bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/20', label: 'ATEND. FLORESTA' },
};

export const ScheduleCard = ({
  schedule,
  employees,
  userProfile,
  isAdmin,
  canCancelSchedules,
  canDeleteSchedules,
  onEdit,
  onRedirect,
  onCancelClick,
  onDeleteClick,
  onCompleteClick,
  onPresenceUpdate,
  getStatusBadge
}: ScheduleCardProps) => {
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [professionalModalOpen, setProfessionalModalOpen] = useState(false);

  const professional = employees.find(emp => emp.user_id === schedule.employee_id);
  const unitStyle = unitColors[schedule.unit || 'madre'] || unitColors.madre;
  const isCompleted = schedule.status === 'completed';
  const isCancelled = schedule.status === 'cancelled';
  const isPendingValidation = schedule.status === 'pending_validation';

  return (
    <>
      {/* Modal de detalhes completo do paciente */}
      <PatientDetailsModal
        clientId={schedule.client_id}
        open={patientModalOpen}
        onOpenChange={setPatientModalOpen}
      />
      <ProfessionalQuickViewModal
        professionalId={schedule.employee_id}
        open={professionalModalOpen}
        onOpenChange={setProfessionalModalOpen}
      />
    <div 
      className={`group relative rounded-xl border bg-card transition-all duration-300 hover:shadow-lg ${
        schedule.patient_arrived && !isCompleted && !isCancelled && !isPendingValidation
          ? 'border-emerald-400/50 ring-1 ring-emerald-400/30' 
          : isCompleted 
            ? 'border-green-400/30 bg-green-50/50 dark:bg-green-950/10'
            : isCancelled
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-border hover:border-primary/30'
      }`}
    >
      {/* Barra lateral colorida por status */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
        schedule.patient_arrived && !isCompleted && !isCancelled && !isPendingValidation
          ? 'bg-emerald-500'
          : isCompleted 
            ? 'bg-green-500'
            : isCancelled
              ? 'bg-destructive'
              : isPendingValidation
                ? 'bg-amber-500'
                : 'bg-primary'
      }`} />
      
      <div className="p-3 sm:p-4 pl-4 sm:pl-5">
        {/* Header: Horário + Unidade + Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded-md border border-primary/10">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                {format(new Date(schedule.start_time), 'HH:mm')} - {format(new Date(schedule.end_time), 'HH:mm')}
              </span>
            </div>
            <Badge variant="outline" className={`${unitStyle.bg} ${unitStyle.text} ${unitStyle.border} text-[10px] sm:text-xs font-medium`}>
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              {unitStyle.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {schedule.patient_confirmed && !isCompleted && !isCancelled && !isPendingValidation && (
              <Badge className="bg-blue-500 text-white text-[10px] sm:text-xs">
                ✓ Confirmou que irá
              </Badge>
            )}
            {schedule.patient_arrived && !isCompleted && !isCancelled && !isPendingValidation && (
              <Badge className="bg-emerald-500 text-white text-[10px] sm:text-xs animate-pulse">
                ✓ Presente
              </Badge>
            )}
            <Badge 
              variant={getStatusBadge(schedule.status).variant}
              className={`text-[10px] sm:text-xs ${getStatusBadge(schedule.status).className || ''}`}
            >
              {getStatusBadge(schedule.status).text}
            </Badge>
          </div>
        </div>

        {/* Conteúdo: Paciente e Profissional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
          {/* Paciente - Clicável */}
          <button
            type="button"
            onClick={() => setPatientModalOpen(true)}
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left group"
          >
            <UserAvatar name={schedule.clients?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Paciente</p>
              <p className="font-medium text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                {schedule.clients?.name || 'N/A'}
              </p>
            </div>
          </button>

          {/* Profissional - Clicável */}
          <button
            type="button"
            onClick={() => setProfessionalModalOpen(true)}
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left group"
          >
            <UserAvatar 
              name={professional?.name} 
              size="sm" 
              role={professional?.employee_role}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Profissional</p>
              <p className="font-medium text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                {professional?.name || 'Não atribuído'}
              </p>
            </div>
          </button>
        </div>

        {/* Tipo de atendimento */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            <Stethoscope className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            {schedule.title}
          </Badge>
          {schedule.arrived_at && (
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              Chegou às {format(new Date(schedule.arrived_at), 'HH:mm')}
            </span>
          )}
        </div>

        {/* Observações */}
        {schedule.notes && (
          <div className="p-2 sm:p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 mb-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              <span className="font-medium text-amber-700 dark:text-amber-400">Obs:</span>{' '}
              <span className="text-foreground">{schedule.notes}</span>
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border/50">
          {/* Botão de presença para recepcionistas */}
          <div>
            {(userProfile?.employee_role === 'receptionist' || isAdmin) && ['scheduled', 'confirmed'].includes(schedule.status) && (
              <PatientPresenceButton
                scheduleId={schedule.id}
                clientName={schedule.clients?.name || 'Cliente'}
                employeeId={schedule.employee_id}
                patientArrived={schedule.patient_arrived || false}
                arrivedAt={schedule.arrived_at}
                onPresenceUpdate={onPresenceUpdate}
              />
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(schedule)}
              className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-3"
            >
              <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Editar</span>
            </Button>

            {['scheduled', 'confirmed'].includes(schedule.status) && (
              <>
                <Button
                  size="sm"
                  onClick={onCompleteClick}
                  className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-3 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden xs:inline">Concluir</span>
                </Button>

                {canCancelSchedules && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancelClick}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-3 text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </Button>
                )}

                {canDeleteSchedules && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDeleteClick}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1 px-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                )}
              </>
            )}
            
            {isPendingValidation && (
              <span className="text-[10px] sm:text-xs text-amber-600 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Aguardando validação</span>
                <span className="sm:hidden">Validação</span>
              </span>
            )}

            {isAdmin && !isCompleted && !isCancelled && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Redirecionar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Redirecionar Agendamento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Selecione o profissional para quem deseja redirecionar este agendamento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Select onValueChange={(value) => onRedirect(schedule.id, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(emp => emp.user_id !== schedule.employee_id).map((employee) => (
                        <SelectItem key={employee.user_id} value={employee.user_id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};