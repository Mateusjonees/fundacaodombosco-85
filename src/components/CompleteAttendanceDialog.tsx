import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Brain } from 'lucide-react';
import { getTodayLocalISODate, calculateAgeBR } from '@/lib/utils';
import AttendanceMaterialSelector from './AttendanceMaterialSelector';
import NeuroTestSelector from './NeuroTestSelector';
import NeuroTestBPA2Form, { type BPA2Results } from './NeuroTestBPA2Form';
import NeuroTestFDTForm from './NeuroTestFDTForm';
import NeuroTestRAVLTForm from './NeuroTestRAVLTForm';
import { type FDTResults } from '@/data/neuroTests/fdt';
import { type RAVLTResults } from '@/data/neuroTests/ravlt';

interface Schedule {
  id: string;
  client_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  title: string;
  clients?: {
    name: string;
    birth_date?: string;
    unit?: string;
  };
}

interface SelectedMaterial {
  stock_item_id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface CompleteAttendanceDialogProps {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CompleteAttendanceDialog({
  schedule,
  isOpen,
  onClose,
  onComplete
}: CompleteAttendanceDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  
  // Neuro tests state
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [bpa2Results, setBpa2Results] = useState<BPA2Results | null>(null);
  const [fdtResults, setFdtResults] = useState<FDTResults | null>(null);
  const [ravltResults, setRavltResults] = useState<RAVLTResults | null>(null);
  const [clientUnit, setClientUnit] = useState<string | null>(null);
  const [patientAge, setPatientAge] = useState<number>(0);

  // Calculate patient age and get unit
  useEffect(() => {
    if (isOpen && schedule?.client_id) {
      fetchClientInfo();
    }
  }, [isOpen, schedule?.client_id]);

  const fetchClientInfo = async () => {
    if (!schedule?.client_id) return;
    
    const { data } = await supabase
      .from('clients')
      .select('birth_date, unit')
      .eq('id', schedule.client_id)
      .maybeSingle();
    
    if (data) {
      setClientUnit(data.unit);
      if (data.birth_date) {
        const age = calculateAgeBR(data.birth_date);
        setPatientAge(age ?? 0);
      }
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSessionNotes('');
      setSelectedMaterials([]);
      setSelectedTests([]);
      setBpa2Results(null);
      setFdtResults(null);
      setRavltResults(null);
    }
  }, [isOpen]);

  const handleSelectTest = (testCode: string) => {
    setSelectedTests(prev => [...prev, testCode]);
  };

  const handleRemoveTest = (testCode: string) => {
    setSelectedTests(prev => prev.filter(t => t !== testCode));
    if (testCode === 'BPA2') {
      setBpa2Results(null);
    } else if (testCode === 'FDT') {
      setFdtResults(null);
    } else if (testCode === 'RAVLT') {
      setRavltResults(null);
    }
  };

  const handleBpa2ResultsChange = useCallback((results: BPA2Results) => {
    setBpa2Results(results);
  }, []);

  const handleFdtResultsChange = useCallback((results: FDTResults) => {
    setFdtResults(results);
  }, []);

  const handleRavltResultsChange = useCallback((results: RAVLTResults) => {
    setRavltResults(results);
  }, []);

  const handleComplete = async () => {
    if (!schedule || !user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados do agendamento não encontrados."
      });
      return;
    }

    if (!sessionNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Por favor, preencha a evolução do atendimento."
      });
      return;
    }

    setLoading(true);
    try {
      const isAtendimentoFloresta = clientUnit === 'atendimento_floresta';
      const isNeuroUnit = clientUnit === 'floresta';

      // Buscar profissional
      const { data: professionalProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', schedule.employee_id)
        .maybeSingle();

      const professionalName = professionalProfile?.name || professionalProfile?.email || 'Profissional';

      // Buscar usuário que está concluindo
      const { data: completedByProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      const completedByName = completedByProfile?.name || completedByProfile?.email || user.email || 'Usuário';

      const now = new Date().toISOString();
      const scheduleStatus = isAtendimentoFloresta ? 'completed' : 'pending_validation';
      const validationStatus = isAtendimentoFloresta ? 'validated' : 'pending_validation';

      // Calcular duração da sessão
      const startTime = new Date(schedule.start_time);
      const endTime = new Date(schedule.end_time);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Preparar materials_used como JSON
      const materialsUsed = selectedMaterials.length > 0 
        ? JSON.parse(JSON.stringify(selectedMaterials)) 
        : null;

      // Atualizar schedule
      const { error: scheduleError } = await supabase.from('schedules').update({
        status: scheduleStatus,
        session_notes: sessionNotes,
        materials_used: materialsUsed,
        completed_at: now,
        completed_by: user.id
      }).eq('id', schedule.id);

      if (scheduleError) throw scheduleError;

      // Criar attendance_report
      const { data: attendanceReport } = await supabase
        .from('attendance_reports')
        .insert({
          schedule_id: schedule.id,
          client_id: schedule.client_id,
          employee_id: schedule.employee_id,
          patient_name: schedule.clients?.name || '',
          professional_name: professionalName,
          attendance_type: 'Consulta',
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          session_duration: durationMinutes,
          observations: sessionNotes,
          session_notes: sessionNotes,
          materials_used: materialsUsed,
          created_by: user.id,
          completed_by: user.id,
          completed_by_name: completedByName,
          validation_status: validationStatus,
          validated_at: isAtendimentoFloresta ? now : null,
          validated_by: isAtendimentoFloresta ? user.id : null,
          validated_by_name: isAtendimentoFloresta ? completedByName : null
        })
        .select('id')
        .maybeSingle();

      // Salvar resultados dos testes neuro (se houver)
      if (isNeuroUnit) {
        const testsToSave = [];

        // BPA-2
        if (bpa2Results && selectedTests.includes('BPA2')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'BPA2',
            test_name: 'BPA-2 - Bateria Psicológica para Avaliação da Atenção',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(bpa2Results.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(bpa2Results.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify(bpa2Results.percentiles)),
            classifications: JSON.parse(JSON.stringify(bpa2Results.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: bpa2Results.notes || null
          });
        }

        // FDT
        if (fdtResults && selectedTests.includes('FDT')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'FDT',
            test_name: 'FDT - Five Digit Test',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(fdtResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(fdtResults.calculatedScores)),
            percentiles: {},
            classifications: {},
            applied_by: user.id,
            applied_at: now,
            notes: fdtResults.notes || null
          });
        }

        // RAVLT
        if (ravltResults && selectedTests.includes('RAVLT')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'RAVLT',
            test_name: 'RAVLT - Teste de Aprendizagem Auditivo-Verbal de Rey',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(ravltResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(ravltResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify(ravltResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(ravltResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: ravltResults.notes || null
          });
        }

        if (testsToSave.length > 0) {
          await supabase.from('neuro_test_results').insert(testsToSave);
        }
      }

      // Upsert employee_report
      await supabase.from('employee_reports').upsert({
        employee_id: schedule.employee_id,
        client_id: schedule.client_id,
        schedule_id: schedule.id,
        session_date: getTodayLocalISODate(),
        session_type: 'Consulta',
        session_duration: durationMinutes,
        professional_notes: sessionNotes,
        completed_by: user.id,
        completed_by_name: completedByName,
        validation_status: validationStatus,
        validated_at: isAtendimentoFloresta ? now : null,
        validated_by: isAtendimentoFloresta ? user.id : null,
        validated_by_name: isAtendimentoFloresta ? completedByName : null
      }, {
        onConflict: 'schedule_id'
      });

      // Se for Atendimento Floresta, processar automaticamente
      if (isAtendimentoFloresta && attendanceReport?.id) {
        await supabase.rpc('validate_attendance_report', {
          p_attendance_report_id: attendanceReport.id,
          p_action: 'validate',
          p_professional_amount: 0,
          p_foundation_amount: 0,
          p_total_amount: 0,
          p_payment_method: 'dinheiro'
        });
      }

      // Atualizar cliente
      await supabase.from('clients').update({
        last_session_date: getTodayLocalISODate(),
        last_session_type: 'Consulta',
        last_session_notes: sessionNotes,
        updated_at: now
      }).eq('id', schedule.client_id);

      // Sucesso!
      setLoading(false);
      toast({
        title: isAtendimentoFloresta ? "Atendimento Finalizado!" : "Atendimento Enviado!",
        description: isAtendimentoFloresta 
          ? "Atendimento concluído e registrado no histórico do paciente." 
          : "Atendimento enviado para revisão do coordenador."
      });

      onClose();
      setTimeout(() => {
        onComplete();
      }, 300);

    } catch (error: any) {
      console.error('Erro ao completar atendimento:', error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: error?.message || "Não foi possível concluir o atendimento."
      });
    }
  };

  if (!schedule) return null;

  const isNeuroUnit = clientUnit === 'floresta';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-5 w-5" />
            Finalizar Atendimento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {schedule.clients?.name} • {new Date(schedule.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {isNeuroUnit && patientAge > 0 && (
              <span className="ml-2 text-primary font-medium">• {patientAge} anos</span>
            )}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 p-4 sm:p-6">
            {/* Seção de Testes Neuropsicológicos - Apenas para unidade Floresta (Neuro) */}
            {isNeuroUnit && patientAge > 0 && (
              <div className="space-y-3">
                <NeuroTestSelector
                  patientAge={patientAge}
                  selectedTests={selectedTests}
                  onSelectTest={handleSelectTest}
                  onRemoveTest={handleRemoveTest}
                />

                {/* Formulário BPA-2 */}
                {selectedTests.includes('BPA2') && (
                  <NeuroTestBPA2Form
                    patientAge={patientAge}
                    onResultsChange={handleBpa2ResultsChange}
                    onRemove={() => handleRemoveTest('BPA2')}
                  />
                )}

                {/* Formulário FDT */}
                {selectedTests.includes('FDT') && (
                  <NeuroTestFDTForm
                    patientAge={patientAge}
                    onResultsChange={handleFdtResultsChange}
                    onRemove={() => handleRemoveTest('FDT')}
                  />
                )}

                {/* Formulário RAVLT */}
                {selectedTests.includes('RAVLT') && (
                  <NeuroTestRAVLTForm
                    patientAge={patientAge}
                    onResultsChange={handleRavltResultsChange}
                    onRemove={() => handleRemoveTest('RAVLT')}
                  />
                )}
              </div>
            )}

            {/* Seletor de Materiais */}
            <AttendanceMaterialSelector
              selectedMaterials={selectedMaterials}
              onMaterialsChange={setSelectedMaterials}
            />

            {/* Evolução do Atendimento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Evolução do Atendimento <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Descreva a evolução do atendimento, procedimentos realizados, observações clínicas, orientações dadas ao paciente..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="min-h-[120px] sm:min-h-[150px] resize-none text-sm sm:text-base"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 px-4 sm:px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleComplete} disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalizar Atendimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
