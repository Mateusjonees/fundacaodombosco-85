import { formatDateBR } from '@/lib/utils';
import { Clock, User, FileText, Calendar, Activity, Pill, HeartPulse, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MedicalRecord {
  id: string;
  session_date: string;
  session_type: string;
  session_duration?: number;
  progress_notes: string;
  treatment_plan?: string;
  symptoms?: string;
  vital_signs?: Record<string, string>;
  medications?: any[];
  status?: string;
  next_appointment_notes?: string;
  profiles?: {
    name: string;
    employee_role: string;
  };
}

interface MedicalRecordTimelineProps {
  records: MedicalRecord[];
}

const getSessionTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'Consulta': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300',
    'Avaliação Inicial': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Avaliação': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Retorno': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
    'Terapia Individual': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Terapia em Grupo': 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300',
    'Terapia': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Avaliação Neuropsicológica': 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/40 dark:text-violet-300',
    'Psicoterapia': 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/40 dark:text-pink-300',
    'Acompanhamento': 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-300',
    'Interconsulta': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300',
    'Alta': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300',
    'Encaminhamento': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300',
  };
  return colors[type] || 'bg-muted text-muted-foreground';
};

const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    director: 'Diretor(a)',
    psychologist: 'Psicólogo(a)',
    neuropsychologist: 'Neuropsicólogo(a)',
    psychiatrist: 'Psiquiatra',
    psiquiatra: 'Psiquiatra',
    neuropediatra: 'Neuropediatra',
    speech_therapist: 'Fonoaudiólogo(a)',
    occupational_therapist: 'Terapeuta Ocupacional',
    social_worker: 'Assistente Social',
    pedagogue: 'Pedagogo(a)',
    coordinator_madre: 'Coordenador(a)',
    coordinator_floresta: 'Coordenador(a)',
    receptionist: 'Recepcionista',
  };
  return roleMap[role] || role;
};

export const MedicalRecordTimeline = ({ records }: MedicalRecordTimelineProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">Nenhum registro no prontuário</p>
          <p className="text-sm">Clique em "Adicionar Registro" para criar a primeira entrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Linha vertical da timeline */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4">
        {records.map((record, index) => {
          const isExpanded = expandedId === record.id;
          const hasVitalSigns = record.vital_signs && Object.keys(record.vital_signs).length > 0;
          const hasMedications = record.medications && record.medications.length > 0;

          return (
            <div key={record.id} className="relative pl-12">
              {/* Marcador da timeline */}
              <div className="absolute left-3 top-4 w-5 h-5 rounded-full bg-primary border-2 border-background shadow-sm z-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>

              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  {/* Header compacto */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getSessionTypeColor(record.session_type)} border text-xs`}>
                        {record.session_type}
                      </Badge>
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatDateBR(record.session_date)}
                      </span>
                      {record.session_duration && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {record.session_duration}min
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      #{records.length - index}
                    </span>
                  </div>

                  {/* Profissional */}
                  {record.profiles && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{record.profiles.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({getRoleName(record.profiles.employee_role)})
                      </span>
                    </div>
                  )}

                  {/* Sinais Vitais - inline */}
                  {hasVitalSigns && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(record.vital_signs!).map(([key, value]) => (
                        <div key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-xs">
                          <HeartPulse className="w-3 h-3 text-red-500" />
                          <span className="font-medium text-red-700 dark:text-red-400">{key}:</span>
                          <span className="text-red-600 dark:text-red-300">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Queixa */}
                  {record.symptoms && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Queixa / Sintomas
                      </h4>
                      <p className="text-sm bg-muted/30 rounded-lg p-2.5">{record.symptoms}</p>
                    </div>
                  )}

                  {/* Evolução - sempre visível */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Evolução
                    </h4>
                    <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-2.5 leading-relaxed">
                      {record.progress_notes}
                    </p>
                  </div>

                  {/* Seção expandível */}
                  {(record.treatment_plan || hasMedications || record.next_appointment_notes) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                        {isExpanded ? 'Menos detalhes' : 'Mais detalhes'}
                      </Button>

                      {isExpanded && (
                        <div className="space-y-3 mt-2 pt-3 border-t">
                          {record.treatment_plan && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Conduta / Plano Terapêutico
                              </h4>
                              <p className="text-sm whitespace-pre-wrap bg-primary/5 rounded-lg p-2.5">
                                {record.treatment_plan}
                              </p>
                            </div>
                          )}

                          {hasMedications && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Pill className="w-3 h-3" /> Medicações
                              </h4>
                              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-2.5 space-y-1">
                                {record.medications!.map((med: any, idx: number) => (
                                  <p key={idx} className="text-sm">
                                    • {typeof med === 'string' ? med : med.name || 'Medicação não especificada'}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {record.next_appointment_notes && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Próxima Sessão
                              </h4>
                              <p className="text-sm bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2.5">
                                {record.next_appointment_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
