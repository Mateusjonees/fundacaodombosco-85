import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, User, Edit, CheckCircle, XCircle, ArrowRightLeft, Stethoscope, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PatientPresenceButton from '@/components/PatientPresenceButton';

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
  return (
    <div 
      className={`group relative overflow-hidden p-6 border rounded-xl gap-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
        schedule.patient_arrived 
          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50/50 shadow-lg dark:from-emerald-950/30 dark:via-green-950/20 dark:to-emerald-950/10' 
          : 'border-border hover:border-blue-500/30 bg-gradient-to-br from-card to-blue-500/5'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Header com horário e tipo */}
      <div className="relative flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {format(new Date(schedule.start_time), 'HH:mm', { locale: ptBR })} - {format(new Date(schedule.end_time), 'HH:mm', { locale: ptBR })}
            </span>
          </div>
          <Badge className="text-sm font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
            {schedule.title}
          </Badge>
        </div>
        <Badge 
          variant={
            schedule.unit === 'madre' ? 'default' : 
            schedule.unit === 'floresta' ? 'secondary' :
            'outline'
          }
          className={`text-sm font-semibold ${
            schedule.unit === 'madre' 
              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' 
              : schedule.unit === 'floresta'
              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
              : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
          }`}
        >
          🏥 {schedule.unit === 'madre' ? 'MADRE' : 
              schedule.unit === 'floresta' ? 'FLORESTA' :
              schedule.unit === 'atendimento_floresta' ? 'ATEND. FLORESTA' :
              schedule.unit || 'N/A'}
        </Badge>
      </div>

      {/* Informações principais */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/5 to-transparent rounded-lg border border-green-500/10">
            <div className="p-1.5 bg-green-500/10 rounded-md">
              <User className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Paciente</span>
              <span className="font-bold text-foreground">{schedule.clients?.name || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/5 to-transparent rounded-lg border border-blue-500/10">
            <div className="p-1.5 bg-blue-500/10 rounded-md">
              <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Profissional</span>
              <span className="font-bold text-foreground">
                {employees.find(emp => emp.user_id === schedule.employee_id)?.name || 'Não atribuído'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status e observações */}
      <div className="relative flex flex-col gap-3">
        {schedule.notes && (
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-sm">
              <span className="font-bold text-yellow-700 dark:text-yellow-400">💭 Observações:</span>
              <span className="ml-2 text-foreground">{schedule.notes}</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-gradient-to-r from-transparent via-border to-transparent">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge 
            variant={getStatusBadge(schedule.status).variant}
            className={`${getStatusBadge(schedule.status).className || ''} ${
              schedule.patient_arrived && !['pending_validation', 'completed', 'cancelled'].includes(schedule.status) 
                ? 'border-emerald-500 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 font-bold shadow-md dark:from-emerald-900/50 dark:to-emerald-800/50 dark:text-emerald-200' 
                : ''
            } text-sm px-3 py-1.5`}
          >
            {schedule.patient_arrived && !['pending_validation', 'completed', 'cancelled'].includes(schedule.status) 
              ? '✓ Paciente Presente' 
              : getStatusBadge(schedule.status).text}
          </Badge>
          {schedule.patient_arrived && schedule.arrived_at && (
            <span className="text-xs font-medium px-2 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-500/20">
              Chegou às {format(new Date(schedule.arrived_at), 'HH:mm', { locale: ptBR })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão de presença do paciente para recepcionistas */}
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
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(schedule)}
            className="h-9 gap-2 font-medium hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all duration-300"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>

          {/* Botões de ação apenas para agendamentos pendentes */}
          {['scheduled', 'confirmed'].includes(schedule.status) && (
            <>
              <Button
                size="sm"
                onClick={onCompleteClick}
                className="h-9 gap-2 font-medium bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <CheckCircle className="h-4 w-4" />
                Concluir
              </Button>

              {canCancelSchedules && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onCancelClick}
                  className="h-9 gap-2 font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </Button>
              )}

              {canDeleteSchedules && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDeleteClick}
                  className="h-9 gap-2 font-medium text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              )}
            </>
          )}
          
          {/* Status de atendimento concluído aguardando validação */}
          {schedule.status === 'pending_validation' && (
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Aguardando validação</span>
            </div>
          )}

          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 gap-2 font-medium hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50 transition-all duration-300">
                  <ArrowRightLeft className="h-4 w-4" />
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
  );
};
