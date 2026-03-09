import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Brain, Maximize2, Minimize2 } from 'lucide-react';
import { getTodayLocalISODate, calculateAgeBR } from '@/lib/utils';
import AttendanceMaterialSelector from './AttendanceMaterialSelector';
import NutritionAssessmentForm, { type NutritionData } from './NutritionAssessmentForm';
import NeuroTestSelector from './NeuroTestSelector';

// Lazy load - formulários só carregam quando selecionados pelo profissional
const NeuroTestBPA2Form = lazy(() => import('./NeuroTestBPA2Form'));
const NeuroTestFDTForm = lazy(() => import('./NeuroTestFDTForm'));
const NeuroTestRAVLTForm = lazy(() => import('./NeuroTestRAVLTForm'));
const NeuroTestTINForm = lazy(() => import('./NeuroTestTINForm'));
const NeuroTestPCFOForm = lazy(() => import('./NeuroTestPCFOForm'));
const NeuroTestTSBCForm = lazy(() => import('./NeuroTestTSBCForm'));
const NeuroTestFVAForm = lazy(() => import('./NeuroTestFVAForm'));
const NeuroTestBNTBRForm = lazy(() => import('./NeuroTestBNTBRForm'));
const NeuroTestTrilhasForm = lazy(() => import('./NeuroTestTrilhasForm'));
const NeuroTestTMTAdultoForm = lazy(() => import('./NeuroTestTMTAdultoForm'));
const NeuroTestTrilhasPreEscolarForm = lazy(() => import('./NeuroTestTrilhasPreEscolarForm'));
const NeuroTestFASForm = lazy(() => import('./NeuroTestFASForm'));
const NeuroTestHaylingAdultoForm = lazy(() => import('./NeuroTestHaylingAdultoForm'));
const NeuroTestHaylingInfantilForm = lazy(() => import('./NeuroTestHaylingInfantilForm'));
const NeuroTestTFVForm = lazy(() => import('./NeuroTestTFVForm'));
const NeuroTestTOMForm = lazy(() => import('./NeuroTestTOMForm'));
const NeuroTestTaylorForm = lazy(() => import('./NeuroTestTaylorForm'));
const NeuroTestTRPPForm = lazy(() => import('./NeuroTestTRPPForm'));
const NeuroTestFPTInfantilForm = lazy(() => import('./NeuroTestFPTInfantilForm'));
const NeuroTestFPTAdultoForm = lazy(() => import('./NeuroTestFPTAdultoForm'));
const NeuroTestReyForm = lazy(() => import('./NeuroTestReyForm'));
const NeuroTestStroopForm = lazy(() => import('./NeuroTestStroopForm'));
const NeuroTestWCSTForm = lazy(() => import('./NeuroTestWCSTForm'));
const NeuroTestWechslerForm = lazy(() => import('./NeuroTestWechslerForm'));
const NeuroTestToLForm = lazy(() => import('./NeuroTestToLForm'));
const NeuroTestD2Form = lazy(() => import('./NeuroTestD2Form'));
const NeuroTestBDIForm = lazy(() => import('./NeuroTestBDIForm'));
const NeuroTestBAIForm = lazy(() => import('./NeuroTestBAIForm'));
const NeuroTestSNAPIVForm = lazy(() => import('./NeuroTestSNAPIVForm'));
const NeuroTestMCHATForm = lazy(() => import('./NeuroTestMCHATForm'));
const NeuroTestRavenForm = lazy(() => import('./NeuroTestRavenForm'));
const NeuroTestWMSForm = lazy(() => import('./NeuroTestWMSForm'));
const NeuroTestMoCAForm = lazy(() => import('./NeuroTestMoCAForm'));
const NeuroTestMEEMForm = lazy(() => import('./NeuroTestMEEMForm'));
const NeuroTestBRIEF2Form = lazy(() => import('./NeuroTestBRIEF2Form'));
const NeuroTestCorsiForm = lazy(() => import('./NeuroTestCorsiForm'));
const NeuroTestConnersForm = lazy(() => import('./NeuroTestConnersForm'));
const NeuroTestVinelandForm = lazy(() => import('./NeuroTestVinelandForm'));
const NeuroTestACE3Form = lazy(() => import('./NeuroTestACE3Form'));
const NeuroTestCBCLForm = lazy(() => import('./NeuroTestCBCLForm'));
const NeuroTestSDQForm = lazy(() => import('./NeuroTestSDQForm'));
const NeuroTestGDSForm = lazy(() => import('./NeuroTestGDSForm'));
const NeuroTestTDE2Form = lazy(() => import('./NeuroTestTDE2Form'));
const NeuroTestNEUPSILINForm = lazy(() => import('./NeuroTestNEUPSILINForm'));
const NeuroTestCancelamentoForm = lazy(() => import('./NeuroTestCancelamentoForm'));

// Tipos (apenas interfaces, não aumentam o bundle)
import { type BPA2Results } from './NeuroTestBPA2Form';
import { type TINResults } from './NeuroTestTINForm';
import { type PCFOResults } from './NeuroTestPCFOForm';
import { type TrilhasResults } from './NeuroTestTrilhasForm';
import { type TMTAdultoResults } from './NeuroTestTMTAdultoForm';
import { type HaylingResults } from './NeuroTestHaylingAdultoForm';
import { type FDTResults } from '@/data/neuroTests/fdt';
import { type RAVLTResults } from '@/data/neuroTests/ravlt';

// Fallback de loading para formulários lazy
const NeuroFormFallback = () => (
  <Card className="border-primary/20">
    <CardContent className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Carregando formulário...</span>
    </CardContent>
  </Card>
);
import { type TSBCResults } from '@/data/neuroTests/tsbc';
import { type FVAResults } from '@/data/neuroTests/fva';
import { type BNTBRResults } from '@/data/neuroTests/bntbr';
import { type TrilhasPreEscolarTestResult } from '@/data/neuroTests/trilhasPreEscolar';
import { type FASTestResult } from '@/data/neuroTests/fas';
import { type HaylingInfantilResults } from '@/data/neuroTests/haylingInfantil';
import { type TFVResults } from '@/data/neuroTests/tfv';
import { type TOMTestResult } from '@/data/neuroTests/tom';
import { type TaylorResults } from '@/data/neuroTests/taylor';
import { type TRPPResults } from '@/data/neuroTests/trpp';
import { type FPTInfantilResults } from '@/data/neuroTests/fptInfantil';
import { type FPTAdultoResults } from '@/data/neuroTests/fptAdulto';
import { type ReyResults } from '@/data/neuroTests/rey';
import { type StroopResults } from '@/data/neuroTests/stroop';
import { type WCSTResults } from '@/data/neuroTests/wcst';
import { type WechslerResults } from '@/data/neuroTests/wais';
import { type ToLResults } from '@/data/neuroTests/tol';
import { type D2Results } from '@/data/neuroTests/d2';
import { type BDIResults } from '@/data/neuroTests/bdi';
import { type BAIResults } from '@/data/neuroTests/bai';
import { type SNAPIVResults } from '@/data/neuroTests/snapiv';
import { type MCHATResults } from '@/data/neuroTests/mchat';
import { type RavenResults } from '@/data/neuroTests/raven';
import { type WMSResults } from '@/data/neuroTests/wms';
import { type MoCAResults } from '@/data/neuroTests/moca';
import { type MEEMResults } from '@/data/neuroTests/meem';
import { type BRIEF2Results } from '@/data/neuroTests/brief2';
import { type CorsiResults } from '@/data/neuroTests/corsi';
import { type ConnersResults } from '@/data/neuroTests/conners';
import { type VinelandResults } from '@/data/neuroTests/vineland';
import { type ACE3Results } from '@/data/neuroTests/ace3';
import { type CBCLResults } from '@/data/neuroTests/cbcl';
import { type SDQResults } from '@/data/neuroTests/sdq';
import { type GDSResults } from '@/data/neuroTests/gds';
import { type TDE2Results } from '@/data/neuroTests/tde2';
import { type NEUPSILINResults } from '@/data/neuroTests/neupsilin';
import { type CancelamentoResults } from '@/data/neuroTests/cancelamento';

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
  const [isMaximized, setIsMaximized] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  
  // Neuro tests state
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [bpa2Results, setBpa2Results] = useState<BPA2Results | null>(null);
  const [fdtResults, setFdtResults] = useState<FDTResults | null>(null);
  const [ravltResults, setRavltResults] = useState<RAVLTResults | null>(null);
  const [tinResults, setTinResults] = useState<TINResults | null>(null);
  const [pcfoResults, setPcfoResults] = useState<PCFOResults | null>(null);
  const [tsbcResults, setTsbcResults] = useState<TSBCResults | null>(null);
  const [fvaResults, setFvaResults] = useState<FVAResults | null>(null);
  const [bntbrResults, setBntbrResults] = useState<BNTBRResults | null>(null);
  const [trilhasResults, setTrilhasResults] = useState<TrilhasResults | null>(null);
  const [tmtAdultoResults, setTmtAdultoResults] = useState<TMTAdultoResults | null>(null);
  const [trilhasPreEscolarResults, setTrilhasPreEscolarResults] = useState<TrilhasPreEscolarTestResult | null>(null);
  const [fasResults, setFasResults] = useState<FASTestResult | null>(null);
  const [haylingAdultoResults, setHaylingAdultoResults] = useState<HaylingResults | null>(null);
  const [haylingInfantilResults, setHaylingInfantilResults] = useState<HaylingInfantilResults | null>(null);
  const [tfvResults, setTfvResults] = useState<TFVResults | null>(null);
  const [tomResults, setTomResults] = useState<TOMTestResult | null>(null);
  const [taylorResults, setTaylorResults] = useState<TaylorResults | null>(null);
  const [trppResults, setTrppResults] = useState<TRPPResults | null>(null);
  const [fptInfantilResults, setFptInfantilResults] = useState<FPTInfantilResults | null>(null);
  const [fptAdultoResults, setFptAdultoResults] = useState<FPTAdultoResults | null>(null);
  const [reyResults, setReyResults] = useState<ReyResults | null>(null);
  const [stroopResults, setStroopResults] = useState<StroopResults | null>(null);
  const [wcstResults, setWcstResults] = useState<WCSTResults | null>(null);
  const [wechslerResults, setWechslerResults] = useState<WechslerResults | null>(null);
  const [tolResults, setTolResults] = useState<ToLResults | null>(null);
  const [d2Results, setD2Results] = useState<D2Results | null>(null);
  const [bdiResults, setBdiResults] = useState<BDIResults | null>(null);
  const [baiResults, setBaiResults] = useState<BAIResults | null>(null);
  const [snapivResults, setSnapivResults] = useState<SNAPIVResults | null>(null);
  const [mchatResults, setMchatResults] = useState<MCHATResults | null>(null);
  const [ravenResults, setRavenResults] = useState<RavenResults | null>(null);
  const [wmsResults, setWmsResults] = useState<WMSResults | null>(null);
  const [mocaResults, setMocaResults] = useState<MoCAResults | null>(null);
  const [meemResults, setMeemResults] = useState<MEEMResults | null>(null);
  const [brief2Results, setBrief2Results] = useState<BRIEF2Results | null>(null);
  const [corsiResults, setCorsiResults] = useState<CorsiResults | null>(null);
  const [connersResults, setConnersResults] = useState<ConnersResults | null>(null);
  const [vinelandResults, setVinelandResults] = useState<VinelandResults | null>(null);
  const [ace3Results, setAce3Results] = useState<ACE3Results | null>(null);
  const [cbclResults, setCbclResults] = useState<CBCLResults | null>(null);
  const [sdqResults, setSdqResults] = useState<SDQResults | null>(null);
  const [gdsResults, setGdsResults] = useState<GDSResults | null>(null);
  const [tde2Results, setTde2Results] = useState<TDE2Results | null>(null);
  const [neupsilinResults, setNeupsilinResults] = useState<NEUPSILINResults | null>(null);
  const [cancelamentoResults, setCancelamentoResults] = useState<CancelamentoResults | null>(null);
  const [clientUnit, setClientUnit] = useState<string | null>(null);
  const [patientAge, setPatientAge] = useState<number>(0);
  const [professionalRole, setProfessionalRole] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionData>({});

  // Calculate patient age, get unit, and fetch professional role
  useEffect(() => {
    if (isOpen && schedule?.client_id) {
      fetchClientInfo();
    }
    if (isOpen && schedule?.employee_id) {
      fetchProfessionalRole();
    }
  }, [isOpen, schedule?.client_id, schedule?.employee_id]);

  const fetchProfessionalRole = async () => {
    if (!schedule?.employee_id) return;
    const { data } = await supabase
      .from('profiles')
      .select('employee_role')
      .eq('user_id', schedule.employee_id)
      .maybeSingle();
    if (data) setProfessionalRole(data.employee_role);
  };

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
      setTinResults(null);
      setPcfoResults(null);
      setTsbcResults(null);
      setFvaResults(null);
      setBntbrResults(null);
      setTrilhasResults(null);
      setTmtAdultoResults(null);
      setTrilhasPreEscolarResults(null);
      setFasResults(null);
      setHaylingAdultoResults(null);
      setHaylingInfantilResults(null);
      setTfvResults(null);
      setTomResults(null);
      setTaylorResults(null);
      setTrppResults(null);
      setFptInfantilResults(null);
      setFptAdultoResults(null);
      setReyResults(null);
      setStroopResults(null);
      setWcstResults(null);
      setWechslerResults(null);
      setTolResults(null);
      setD2Results(null);
      setBdiResults(null);
      setBaiResults(null);
      setSnapivResults(null);
      setMchatResults(null);
      setRavenResults(null);
      setWmsResults(null);
      setMocaResults(null);
      setMeemResults(null);
      setBrief2Results(null);
      setCorsiResults(null);
      setConnersResults(null);
      setVinelandResults(null);
      setAce3Results(null);
      setCbclResults(null);
      setSdqResults(null);
      setGdsResults(null);
      setTde2Results(null);
      setNeupsilinResults(null);
      setCancelamentoResults(null);
      setNutritionData({});
      setProfessionalRole(null);
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
    } else if (testCode === 'TIN') {
      setTinResults(null);
    } else if (testCode === 'PCFO') {
      setPcfoResults(null);
    } else if (testCode === 'TSBC') {
      setTsbcResults(null);
    } else if (testCode === 'FVA') {
      setFvaResults(null);
    } else if (testCode === 'BNTBR') {
      setBntbrResults(null);
    } else if (testCode === 'TRILHAS') {
      setTrilhasResults(null);
    } else if (testCode === 'TMT_ADULTO') {
      setTmtAdultoResults(null);
    } else if (testCode === 'TRILHAS_PRE_ESCOLAR') {
      setTrilhasPreEscolarResults(null);
    } else if (testCode === 'FAS') {
      setFasResults(null);
    } else if (testCode === 'HAYLING_ADULTO') {
      setHaylingAdultoResults(null);
    } else if (testCode === 'HAYLING_INFANTIL') {
      setHaylingInfantilResults(null);
    } else if (testCode === 'TFV') {
      setTfvResults(null);
    } else if (testCode === 'TOM') {
      setTomResults(null);
    } else if (testCode === 'TAYLOR') {
      setTaylorResults(null);
    } else if (testCode === 'TRPP') {
      setTrppResults(null);
    } else if (testCode === 'FPT_INFANTIL') {
      setFptInfantilResults(null);
    } else if (testCode === 'FPT_ADULTO') {
      setFptAdultoResults(null);
    } else if (testCode === 'REY') {
      setReyResults(null);
    } else if (testCode === 'STROOP') {
      setStroopResults(null);
    } else if (testCode === 'WCST') {
      setWcstResults(null);
    } else if (testCode === 'WECHSLER') {
      setWechslerResults(null);
    } else if (testCode === 'TOL') {
      setTolResults(null);
    } else if (testCode === 'D2') {
      setD2Results(null);
    } else if (testCode === 'BDI') {
      setBdiResults(null);
    } else if (testCode === 'BAI') {
      setBaiResults(null);
    } else if (testCode === 'SNAPIV') {
      setSnapivResults(null);
    } else if (testCode === 'MCHAT') {
      setMchatResults(null);
    } else if (testCode === 'RAVEN') {
      setRavenResults(null);
    } else if (testCode === 'WMS') {
      setWmsResults(null);
    } else if (testCode === 'MOCA') {
      setMocaResults(null);
    } else if (testCode === 'MEEM') {
      setMeemResults(null);
    } else if (testCode === 'BRIEF2') {
      setBrief2Results(null);
    } else if (testCode === 'CORSI') {
      setCorsiResults(null);
    } else if (testCode === 'CONNERS') {
      setConnersResults(null);
    } else if (testCode === 'VINELAND') {
      setVinelandResults(null);
    } else if (testCode === 'ACE3') {
      setAce3Results(null);
    } else if (testCode === 'CBCL') {
      setCbclResults(null);
    } else if (testCode === 'SDQ') {
      setSdqResults(null);
    } else if (testCode === 'GDS') {
      setGdsResults(null);
    } else if (testCode === 'TDE2') {
      setTde2Results(null);
    } else if (testCode === 'NEUPSILIN') {
      setNeupsilinResults(null);
    } else if (testCode === 'CANCELAMENTO') {
      setCancelamentoResults(null);
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

  const handleTinResultsChange = useCallback((results: TINResults) => {
    setTinResults(results);
  }, []);

  const handlePcfoResultsChange = useCallback((results: PCFOResults) => {
    setPcfoResults(results);
  }, []);

  const handleTsbcResultsChange = useCallback((results: TSBCResults) => {
    setTsbcResults(results);
  }, []);

  const handleFvaResultsChange = useCallback((results: FVAResults | null) => {
    setFvaResults(results);
  }, []);

  const handleBntbrResultsChange = useCallback((results: BNTBRResults | null) => {
    setBntbrResults(results);
  }, []);

  const handleTrilhasResultsChange = useCallback((results: TrilhasResults) => {
    setTrilhasResults(results);
  }, []);

  const handleTmtAdultoResultsChange = useCallback((results: TMTAdultoResults) => {
    setTmtAdultoResults(results);
  }, []);

  const handleTrilhasPreEscolarResultsChange = useCallback((results: TrilhasPreEscolarTestResult | null) => {
    setTrilhasPreEscolarResults(results);
  }, []);

  const handleFasResultsChange = useCallback((results: FASTestResult | null) => {
    setFasResults(results);
  }, []);

  const handleHaylingAdultoResultsChange = useCallback((results: HaylingResults | null) => {
    setHaylingAdultoResults(results);
  }, []);

  const handleHaylingInfantilResultsChange = useCallback((results: HaylingInfantilResults | null) => {
    setHaylingInfantilResults(results);
  }, []);

  const handleTfvResultsChange = useCallback((results: TFVResults | null) => {
    setTfvResults(results);
  }, []);

  const handleTomResultsChange = useCallback((results: TOMTestResult | null) => {
    setTomResults(results);
  }, []);

  const handleTaylorResultsChange = useCallback((results: TaylorResults | null) => {
    setTaylorResults(results);
  }, []);

  const handleTrppResultsChange = useCallback((results: TRPPResults | null) => {
    setTrppResults(results);
  }, []);

  const handleFptInfantilResultsChange = useCallback((results: FPTInfantilResults | null) => {
    setFptInfantilResults(results);
  }, []);

  const handleFptAdultoResultsChange = useCallback((results: FPTAdultoResults | null) => {
    setFptAdultoResults(results);
  }, []);

  const handleReyResultsChange = useCallback((results: ReyResults | null) => {
    setReyResults(results);
  }, []);

  const handleStroopResultsChange = useCallback((results: StroopResults | null) => {
    setStroopResults(results);
  }, []);

  const handleWcstResultsChange = useCallback((results: WCSTResults | null) => {
    setWcstResults(results);
  }, []);

  const handleWechslerResultsChange = useCallback((results: WechslerResults | null) => {
    setWechslerResults(results);
  }, []);

  const handleTolResultsChange = useCallback((results: ToLResults | null) => { setTolResults(results); }, []);
  const handleD2ResultsChange = useCallback((results: D2Results | null) => { setD2Results(results); }, []);
  const handleBdiResultsChange = useCallback((results: BDIResults | null) => { setBdiResults(results); }, []);
  const handleBaiResultsChange = useCallback((results: BAIResults | null) => { setBaiResults(results); }, []);
  const handleSnapivResultsChange = useCallback((results: SNAPIVResults | null) => { setSnapivResults(results); }, []);
  const handleMchatResultsChange = useCallback((results: MCHATResults | null) => { setMchatResults(results); }, []);
  const handleRavenResultsChange = useCallback((results: RavenResults | null) => { setRavenResults(results); }, []);
  const handleWmsResultsChange = useCallback((results: WMSResults | null) => { setWmsResults(results); }, []);
  const handleMocaResultsChange = useCallback((results: MoCAResults | null) => { setMocaResults(results); }, []);
  const handleMeemResultsChange = useCallback((results: MEEMResults | null) => { setMeemResults(results); }, []);
  const handleBrief2ResultsChange = useCallback((results: BRIEF2Results | null) => { setBrief2Results(results); }, []);
  const handleCorsiResultsChange = useCallback((results: CorsiResults | null) => { setCorsiResults(results); }, []);
  const handleConnersResultsChange = useCallback((results: ConnersResults | null) => { setConnersResults(results); }, []);
  const handleVinelandResultsChange = useCallback((results: VinelandResults | null) => { setVinelandResults(results); }, []);
  const handleAce3ResultsChange = useCallback((results: ACE3Results | null) => { setAce3Results(results); }, []);
  const handleCbclResultsChange = useCallback((results: CBCLResults | null) => { setCbclResults(results); }, []);
  const handleSdqResultsChange = useCallback((results: SDQResults | null) => { setSdqResults(results); }, []);
  const handleGdsResultsChange = useCallback((results: GDSResults | null) => { setGdsResults(results); }, []);
  const handleTde2ResultsChange = useCallback((results: TDE2Results | null) => { setTde2Results(results); }, []);
  const handleNeupsilinResultsChange = useCallback((results: NEUPSILINResults | null) => { setNeupsilinResults(results); }, []);
  const handleCancelamentoResultsChange = useCallback((results: CancelamentoResults | null) => { setCancelamentoResults(results); }, []);

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
      const isNutritionist = professionalRole === 'nutritionist';
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

      // Preparar dados de nutrição como attachments
      const hasNutritionData = isNutritionist && Object.values(nutritionData).some(v => v && v.toString().trim() !== '');
      const attachmentsData = hasNutritionData 
        ? JSON.parse(JSON.stringify({ nutrition_assessment: nutritionData }))
        : null;

      const attendanceType = isNutritionist ? 'Consulta Nutricional' : 'Consulta';

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
          attendance_type: attendanceType,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          session_duration: durationMinutes,
          observations: sessionNotes,
          session_notes: sessionNotes,
          materials_used: materialsUsed,
          attachments: attachmentsData,
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
            percentiles: JSON.parse(JSON.stringify(fdtResults.percentiles || {})),
            classifications: JSON.parse(JSON.stringify(fdtResults.classifications || {})),
            applied_by: user.id,
            applied_at: now,
            notes: fdtResults.notes || null
          });
        }

        // RAVLT
        if (ravltResults && selectedTests.includes('RAVLT')) {
          // Salvar percentile ranges como strings no campo percentiles para exibição correta
          const ravltPercentiles = ravltResults.percentileRanges 
            ? JSON.parse(JSON.stringify(ravltResults.percentileRanges))
            : JSON.parse(JSON.stringify(ravltResults.percentiles));
          
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'RAVLT',
            test_name: 'RAVLT - Teste de Aprendizagem Auditivo-Verbal de Rey',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(ravltResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(ravltResults.calculatedScores)),
            percentiles: ravltPercentiles,
            classifications: JSON.parse(JSON.stringify(ravltResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: ravltResults.notes || null
          });
        }

        // TIN
        if (tinResults && selectedTests.includes('TIN')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TIN',
            test_name: 'TIN - Teste Infantil de Nomeação',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(tinResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(tinResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify({ escorePadrao: tinResults.calculatedScores?.escorePadrao ?? null })),
            classifications: JSON.parse(JSON.stringify(tinResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: tinResults.notes || null
          });
        }

        // PCFO
        if (pcfoResults && selectedTests.includes('PCFO')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'PCFO',
            test_name: 'PCFO - Prova de Consciência Fonológica por produção Oral',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(pcfoResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(pcfoResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify({ escorePadrao: pcfoResults.calculatedScores?.escorePadrao ?? null })),
            classifications: JSON.parse(JSON.stringify({ escorePadrao: pcfoResults.classifications?.geral ?? 'Não classificado' })),
            applied_by: user.id,
            applied_at: now,
            notes: pcfoResults.notes || null
          });
        }

        // TSBC
        if (tsbcResults && selectedTests.includes('TSBC')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TSBC',
            test_name: 'TSBC - Tarefa Span de Blocos (Corsi)',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(tsbcResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(tsbcResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify({ escorePadraoOD: tsbcResults.calculatedScores?.escorePadraoOD ?? null, escorePadraoOI: tsbcResults.calculatedScores?.escorePadraoOI ?? null })),
            classifications: JSON.parse(JSON.stringify({ escorePadraoOD: tsbcResults.classifications?.classificacaoOD ?? 'Não classificado', escorePadraoOI: tsbcResults.classifications?.classificacaoOI ?? 'Não classificado' })),
            applied_by: user.id,
            applied_at: now,
            notes: tsbcResults.notes || null
          });
        }

        // FVA
        if (fvaResults && selectedTests.includes('FVA')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'FVA',
            test_name: 'FVA - Fluência Verbal Alternada',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(fvaResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(fvaResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify({ percentilAnimais: fvaResults.calculatedScores?.percentilAnimais, percentilFrutas: fvaResults.calculatedScores?.percentilFrutas, percentilPares: fvaResults.calculatedScores?.percentilPares })),
            classifications: JSON.parse(JSON.stringify({ percentilAnimais: fvaResults.classifications?.classificacaoAnimais ?? '-', percentilFrutas: fvaResults.classifications?.classificacaoFrutas ?? '-', percentilPares: fvaResults.classifications?.classificacaoPares ?? '-' })),
            applied_by: user.id,
            applied_at: now,
            notes: fvaResults.notes || null
          });
        }

        // BNT-BR
        if (bntbrResults && selectedTests.includes('BNTBR')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'BNTBR',
            test_name: 'BNT-BR - Teste de Nomeação de Boston',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(bntbrResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(bntbrResults.calculatedScores)),
            percentiles: { percentil: bntbrResults.calculatedScores.percentil },
            classifications: JSON.parse(JSON.stringify(bntbrResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: bntbrResults.notes || null
          });
        }

        // Trilhas A e B
        if (trilhasResults && selectedTests.includes('TRILHAS')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TRILHAS',
            test_name: 'Teste de Trilhas: Partes A e B',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(trilhasResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(trilhasResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify({ trilhaA: trilhasResults.calculatedScores?.escorePadraoA ?? null, trilhaB: trilhasResults.calculatedScores?.escorePadraoB ?? null })),
            classifications: JSON.parse(JSON.stringify({ trilhaA: trilhasResults.classifications?.sequenciasA ?? '-', trilhaB: trilhasResults.classifications?.sequenciasB ?? '-' })),
            applied_by: user.id,
            applied_at: now,
            notes: trilhasResults.notes || null
          });
        }

        // TMT Adulto
        if (tmtAdultoResults && selectedTests.includes('TMT_ADULTO')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TMT_ADULTO',
            test_name: 'TMT - Teste de Trilhas Adulto',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(tmtAdultoResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(tmtAdultoResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify(tmtAdultoResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(tmtAdultoResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: tmtAdultoResults.notes || null
          });
        }

        // Trilhas Pré-Escolares
        if (trilhasPreEscolarResults && selectedTests.includes('TRILHAS_PRE_ESCOLAR')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TRILHAS_PRE_ESCOLAR',
            test_name: 'Teste de Trilhas Pré-Escolares',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              sequenciasA: trilhasPreEscolarResults.sequenciasA,
              sequenciasB: trilhasPreEscolarResults.sequenciasB
            })),
            calculated_scores: JSON.parse(JSON.stringify({
              trilhaA: trilhasPreEscolarResults.standardScoreA,
              trilhaB: trilhasPreEscolarResults.standardScoreB
            })),
            percentiles: JSON.parse(JSON.stringify({
              trilhaA: trilhasPreEscolarResults.standardScoreA,
              trilhaB: trilhasPreEscolarResults.standardScoreB
            })),
            classifications: JSON.parse(JSON.stringify({
              trilhaA: trilhasPreEscolarResults.classificationA,
              trilhaB: trilhasPreEscolarResults.classificationB
            })),
            applied_by: user.id,
            applied_at: now,
            notes: null
          });
        }

        // FAS
        if (fasResults && selectedTests.includes('FAS')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'FAS',
            test_name: 'FAS - Teste de Fluência Verbal Fonêmica',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              letraF: fasResults.letraF,
              letraA: fasResults.letraA,
              letraS: fasResults.letraS
            })),
            calculated_scores: JSON.parse(JSON.stringify({
              totalFAS: fasResults.totalFAS,
              zScore: fasResults.zScore
            })),
            percentiles: { percentil: fasResults.percentile },
            classifications: { percentil: fasResults.classification },
            applied_by: user.id,
            applied_at: now,
            notes: null
          });
        }

        // Hayling Adulto
        if (haylingAdultoResults && selectedTests.includes('HAYLING_ADULTO')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'HAYLING_ADULTO',
            test_name: 'Teste Hayling - Versão Adulto',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(haylingAdultoResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({
              ...haylingAdultoResults.calculatedScores,
              educationLevel: haylingAdultoResults.educationLevel
            })),
            percentiles: JSON.parse(JSON.stringify(haylingAdultoResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(haylingAdultoResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: haylingAdultoResults.notes || null
          });
        }

        // Hayling Infantil
        if (haylingInfantilResults && selectedTests.includes('HAYLING_INFANTIL')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'HAYLING_INFANTIL',
            test_name: 'Teste Hayling - Versão Infantil',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              parteATempo: haylingInfantilResults.parteATempo.raw,
              parteBTempo: haylingInfantilResults.parteBTempo.raw,
              parteBErros: haylingInfantilResults.parteBErros.raw,
              schoolType: haylingInfantilResults.schoolType
            })),
            calculated_scores: JSON.parse(JSON.stringify({
              inibicaoBA: haylingInfantilResults.inibicaoBA.raw
            })),
            percentiles: JSON.parse(JSON.stringify({
              parteATempo: haylingInfantilResults.parteATempo.percentile,
              parteBTempo: haylingInfantilResults.parteBTempo.percentile,
              parteBErros: haylingInfantilResults.parteBErros.percentile,
              inibicaoBA: haylingInfantilResults.inibicaoBA.percentile
            })),
            classifications: JSON.parse(JSON.stringify({
              parteATempo: haylingInfantilResults.parteATempo.classification,
              parteBTempo: haylingInfantilResults.parteBTempo.classification,
              parteBErros: haylingInfantilResults.parteBErros.classification,
              inibicaoBA: haylingInfantilResults.inibicaoBA.classification
            })),
            applied_by: user.id,
            applied_at: now,
            notes: `Tipo de escola: ${haylingInfantilResults.schoolType === 'privada' ? 'Privada' : 'Pública'}`
          });
        }

        // TFV
        if (tfvResults && selectedTests.includes('TFV')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TFV',
            test_name: 'TFV - Tarefas de Fluência Verbal',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              fluenciaLivre: tfvResults.fluenciaLivre.raw,
              fluenciaFonemica: tfvResults.fluenciaFonemica.raw,
              fluenciaSemantica: tfvResults.fluenciaSemantica.raw,
              schoolType: tfvResults.schoolType
            })),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({
              fluenciaLivre: tfvResults.fluenciaLivre.percentile,
              fluenciaFonemica: tfvResults.fluenciaFonemica.percentile,
              fluenciaSemantica: tfvResults.fluenciaSemantica.percentile
            })),
            classifications: JSON.parse(JSON.stringify({
              fluenciaLivre: tfvResults.fluenciaLivre.classification,
              fluenciaFonemica: tfvResults.fluenciaFonemica.classification,
              fluenciaSemantica: tfvResults.fluenciaSemantica.classification
            })),
            applied_by: user.id,
            applied_at: now,
            notes: `Tipo de escola: ${tfvResults.schoolType === 'privada' ? 'Privada' : 'Pública'}`
          });
        }

        // TOM
        if (tomResults && selectedTests.includes('TOM')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TOM',
            test_name: 'ToM - Bateria de Tarefas para Avaliação da Teoria da Mente',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              totalScore: tomResults.totalScore
            })),
            calculated_scores: JSON.parse(JSON.stringify({
              zScore: tomResults.zScore
            })),
            percentiles: { percentil: tomResults.percentile },
            classifications: { percentil: tomResults.classification },
            applied_by: user.id,
            applied_at: now,
            notes: null
          });
        }

        // Taylor
        if (taylorResults && selectedTests.includes('TAYLOR')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TAYLOR',
            test_name: 'Taylor - Figura Complexa Modificada de Taylor',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              copia: taylorResults.rawScores.copia,
              reproducaoMemoria: taylorResults.rawScores.reproducaoMemoria
            })),
            calculated_scores: JSON.parse(JSON.stringify({
              zScoreCopia: taylorResults.zScores.copia,
              zScoreReproducao: taylorResults.zScores.reproducaoMemoria
            })),
            percentiles: JSON.parse(JSON.stringify({
              copia: taylorResults.percentiles.copia,
              reproducaoMemoria: taylorResults.percentiles.reproducaoMemoria
            })),
            classifications: JSON.parse(JSON.stringify({
              copia: taylorResults.classifications.copia,
              reproducaoMemoria: taylorResults.classifications.reproducaoMemoria
            })),
            applied_by: user.id,
            applied_at: now,
            notes: `Grupo etário: ${taylorResults.ageGroup}`
          });
        }

        // TRPP
        if (trppResults && selectedTests.includes('TRPP')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'TRPP',
            test_name: 'TRPP - Teste de Repetição de Palavras e Pseudopalavras',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              palavras: trppResults.rawScores.palavras,
              pseudopalavras: trppResults.rawScores.pseudopalavras
            })),
            calculated_scores: JSON.parse(JSON.stringify({
              total: trppResults.calculatedScores.total,
              escorePadrao: trppResults.calculatedScores.escorePadrao
            })),
            percentiles: JSON.parse(JSON.stringify({ total: trppResults.calculatedScores?.escorePadrao ?? null })),
            classifications: JSON.parse(JSON.stringify({
              total: trppResults.classifications.total
            })),
            applied_by: user.id,
            applied_at: now,
            notes: null
          });
        }

        // FPT Infantil
        if (fptInfantilResults && selectedTests.includes('FPT_INFANTIL')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'FPT_INFANTIL',
            test_name: 'FPT - Five-Point Test (Versão Infantil)',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              desenhosUnicos: fptInfantilResults.rawScore,
              schoolYear: fptInfantilResults.schoolYear
            })),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: { desenhosUnicos: fptInfantilResults.percentile },
            classifications: JSON.parse(JSON.stringify({
              desenhosUnicos: fptInfantilResults.classification
            })),
            applied_by: user.id,
            applied_at: now,
            notes: `Ano escolar: ${fptInfantilResults.schoolYear}`
          });
        }

        // FPT Adulto
        if (fptAdultoResults && selectedTests.includes('FPT_ADULTO')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'FPT_ADULTO',
            test_name: 'FPT - Five-Point Test (Versão Adulto)',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify({
              desenhosUnicos: fptAdultoResults.rawScore,
              ageGroup: fptAdultoResults.ageGroup
            })),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: { desenhosUnicos: fptAdultoResults.percentile },
            classifications: JSON.parse(JSON.stringify({
              desenhosUnicos: fptAdultoResults.classification
            })),
            applied_by: user.id,
            applied_at: now,
            notes: `Faixa etária: ${fptAdultoResults.ageGroup}`
          });
        }

        // Rey
        if (reyResults && selectedTests.includes('REY')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'REY',
            test_name: 'Figuras Complexas de Rey',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(reyResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify(reyResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(reyResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: `Faixa etária: ${reyResults.ageGroup}`
          });
        }

        // Stroop
        if (stroopResults && selectedTests.includes('STROOP')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'STROOP',
            test_name: 'Teste Stroop de Cores e Palavras',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(stroopResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(stroopResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify(stroopResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(stroopResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: `Faixa etária: ${stroopResults.ageGroup}`
          });
        }

        // WCST
        if (wcstResults && selectedTests.includes('WCST')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'WCST',
            test_name: 'Wisconsin - Teste de Classificação de Cartas',
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(wcstResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(wcstResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify(wcstResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(wcstResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: `Faixa etária: ${wcstResults.ageGroup}`
          });
        }

        // Wechsler (WAIS/WISC)
        if (wechslerResults && selectedTests.includes('WECHSLER')) {
          testsToSave.push({
            client_id: schedule.client_id,
            schedule_id: schedule.id,
            attendance_report_id: attendanceReport?.id || null,
            test_code: 'WECHSLER',
            test_name: `Wechsler - ${wechslerResults.testVersion}`,
            patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(wechslerResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify(wechslerResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(wechslerResults.classifications)),
            applied_by: user.id,
            applied_at: now,
            notes: `Versão: ${wechslerResults.testVersion}`
          });
        }

        // Torre de Londres
        if (tolResults && selectedTests.includes('TOL')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'TOL', test_name: 'Torre de Londres', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(tolResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify(tolResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(tolResults.classifications)),
            applied_by: user.id, applied_at: now, notes: tolResults.notes
          });
        }

        // D2
        if (d2Results && selectedTests.includes('D2')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'D2', test_name: 'D2 - Atenção Concentrada', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(d2Results.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(d2Results.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify(d2Results.percentiles)),
            classifications: JSON.parse(JSON.stringify(d2Results.classifications)),
            applied_by: user.id, applied_at: now, notes: d2Results.notes
          });
        }

        // BDI-II
        if (bdiResults && selectedTests.includes('BDI')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'BDI', test_name: 'BDI-II - Inventário de Depressão de Beck', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(bdiResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify(bdiResults.percentiles || {})),
            classifications: JSON.parse(JSON.stringify(bdiResults.classifications)),
            applied_by: user.id, applied_at: now, notes: bdiResults.notes
          });
        }

        // BAI
        if (baiResults && selectedTests.includes('BAI')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'BAI', test_name: 'BAI - Inventário de Ansiedade de Beck', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(baiResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify(baiResults.percentiles || {})),
            classifications: JSON.parse(JSON.stringify(baiResults.classifications)),
            applied_by: user.id, applied_at: now, notes: baiResults.notes
          });
        }

        // SNAP-IV
        if (snapivResults && selectedTests.includes('SNAPIV')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'SNAPIV', test_name: 'SNAP-IV - Rastreamento TDAH', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(snapivResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(snapivResults.classifications)),
            applied_by: user.id, applied_at: now, notes: snapivResults.notes
          });
        }

        // M-CHAT-R/F
        if (mchatResults && selectedTests.includes('MCHAT')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'MCHAT', test_name: 'M-CHAT-R/F - Rastreamento TEA', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(mchatResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(mchatResults.classifications)),
            applied_by: user.id, applied_at: now, notes: mchatResults.notes
          });
        }

        // Raven
        if (ravenResults && selectedTests.includes('RAVEN')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'RAVEN', test_name: `Matrizes de Raven (${ravenResults.version})`, patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(ravenResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify(ravenResults.percentiles)),
            classifications: JSON.parse(JSON.stringify(ravenResults.classifications)),
            applied_by: user.id, applied_at: now, notes: ravenResults.notes
          });
        }

        // WMS
        if (wmsResults && selectedTests.includes('WMS')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'WMS', test_name: 'WMS-IV - Escala de Memória Wechsler', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(wmsResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(wmsResults.classifications)),
            applied_by: user.id, applied_at: now, notes: wmsResults.notes
          });
        }

        // MoCA
        if (mocaResults && selectedTests.includes('MOCA')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'MOCA', test_name: 'MoCA - Montreal Cognitive Assessment', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(mocaResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(mocaResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(mocaResults.classifications)),
            applied_by: user.id, applied_at: now, notes: mocaResults.notes
          });
        }

        // MEEM
        if (meemResults && selectedTests.includes('MEEM')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'MEEM', test_name: 'MEEM - Mini Exame do Estado Mental', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(meemResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(meemResults.classifications)),
            applied_by: user.id, applied_at: now, notes: meemResults.notes
          });
        }

        // BRIEF-2
        if (brief2Results && selectedTests.includes('BRIEF2')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'BRIEF2', test_name: 'BRIEF-2 - Inventário de Funções Executivas', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(brief2Results.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(brief2Results.indices)),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(brief2Results.classifications)),
            applied_by: user.id, applied_at: now, notes: brief2Results.notes
          });
        }

        // Cubos de Corsi
        if (corsiResults && selectedTests.includes('CORSI')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'CORSI', test_name: 'Cubos de Corsi', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(corsiResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify(corsiResults.percentiles || {})),
            classifications: JSON.parse(JSON.stringify(corsiResults.classifications)),
            applied_by: user.id, applied_at: now, notes: corsiResults.notes
          });
        }

        // Conners 3
        if (connersResults && selectedTests.includes('CONNERS')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'CONNERS', test_name: 'Conners 3 - Avaliação TDAH', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(connersResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(connersResults.classifications)),
            applied_by: user.id, applied_at: now, notes: connersResults.notes
          });
        }

        // Vineland-3
        if (vinelandResults && selectedTests.includes('VINELAND')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'VINELAND', test_name: 'Vineland-3 - Comportamento Adaptativo', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(vinelandResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(vinelandResults.classifications)),
            applied_by: user.id, applied_at: now, notes: vinelandResults.notes
          });
        }

        // ACE-III
        if (ace3Results && selectedTests.includes('ACE3')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'ACE3', test_name: 'ACE-III - Addenbrooke\'s Cognitive Examination', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(ace3Results.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(ace3Results.classifications)),
            applied_by: user.id, applied_at: now, notes: ace3Results.notes
          });
        }

        // CBCL
        if (cbclResults && selectedTests.includes('CBCL')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'CBCL', test_name: 'CBCL - Child Behavior Checklist', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(cbclResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(cbclResults.classifications)),
            applied_by: user.id, applied_at: now, notes: cbclResults.notes
          });
        }

        // SDQ
        if (sdqResults && selectedTests.includes('SDQ')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'SDQ', test_name: 'SDQ - Questionário de Capacidades e Dificuldades', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(sdqResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(sdqResults.classifications)),
            applied_by: user.id, applied_at: now, notes: sdqResults.notes
          });
        }

        // GDS
        if (gdsResults && selectedTests.includes('GDS')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'GDS', test_name: 'GDS - Escala de Depressão Geriátrica', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(gdsResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(gdsResults.classifications)),
            applied_by: user.id, applied_at: now, notes: gdsResults.notes
          });
        }

        // TDE-II
        if (tde2Results && selectedTests.includes('TDE2')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'TDE2', test_name: 'TDE-II - Teste de Desempenho Escolar', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(tde2Results.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(tde2Results.classifications)),
            applied_by: user.id, applied_at: now, notes: tde2Results.notes
          });
        }

        // NEUPSILIN
        if (neupsilinResults && selectedTests.includes('NEUPSILIN')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'NEUPSILIN', test_name: 'NEUPSILIN - Avaliação Neuropsicológica Breve', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(neupsilinResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify({})),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(neupsilinResults.classifications)),
            applied_by: user.id, applied_at: now, notes: neupsilinResults.notes
          });
        }

        // Cancelamento
        if (cancelamentoResults && selectedTests.includes('CANCELAMENTO')) {
          testsToSave.push({
            client_id: schedule.client_id, schedule_id: schedule.id, attendance_report_id: attendanceReport?.id || null,
            test_code: 'CANCELAMENTO', test_name: 'Teste de Atenção por Cancelamento', patient_age: patientAge,
            raw_scores: JSON.parse(JSON.stringify(cancelamentoResults.rawScores)),
            calculated_scores: JSON.parse(JSON.stringify(cancelamentoResults.calculatedScores)),
            percentiles: JSON.parse(JSON.stringify({})),
            classifications: JSON.parse(JSON.stringify(cancelamentoResults.classifications)),
            applied_by: user.id, applied_at: now, notes: cancelamentoResults.notes
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
  const isNutritionistProfessional = professionalRole === 'nutritionist';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`flex flex-col p-0 gap-0 transition-all duration-200 ${
        isMaximized 
          ? 'w-[98vw] max-w-[98vw] h-[98vh] max-h-[98vh]' 
          : 'w-[95vw] max-w-2xl h-[90vh] max-h-[90vh]'
      }`}>
        <DialogHeader className="px-4 sm:px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5" />
              Finalizar Atendimento
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-8 w-8 shrink-0"
              title={isMaximized ? "Minimizar" : "Maximizar"}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
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

              <Suspense fallback={<NeuroFormFallback />}>
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

                {/* Formulário TIN */}
                {selectedTests.includes('TIN') && (
                  <NeuroTestTINForm
                    patientAge={patientAge}
                    onResultsChange={handleTinResultsChange}
                    onRemove={() => handleRemoveTest('TIN')}
                  />
                )}

                {/* Formulário PCFO */}
                {selectedTests.includes('PCFO') && (
                  <NeuroTestPCFOForm
                    patientAge={patientAge}
                    onResultsChange={handlePcfoResultsChange}
                  />
                )}

                {/* Formulário TSBC */}
                {selectedTests.includes('TSBC') && (
                  <NeuroTestTSBCForm
                    patientAge={patientAge}
                    onResultsChange={handleTsbcResultsChange}
                    onRemove={() => handleRemoveTest('TSBC')}
                  />
                )}

                {/* Formulário FVA */}
                {selectedTests.includes('FVA') && (
                  <NeuroTestFVAForm
                    patientAge={patientAge}
                    onResultsChange={handleFvaResultsChange}
                  />
                )}

                {/* Formulário BNT-BR */}
                {selectedTests.includes('BNTBR') && (
                  <NeuroTestBNTBRForm
                    patientAge={patientAge}
                    onResultsChange={handleBntbrResultsChange}
                    onRemove={() => handleRemoveTest('BNTBR')}
                  />
                )}

                {/* Formulário Trilhas A e B */}
                {selectedTests.includes('TRILHAS') && (
                  <NeuroTestTrilhasForm
                    patientAge={patientAge}
                    onResultsChange={handleTrilhasResultsChange}
                    onRemove={() => handleRemoveTest('TRILHAS')}
                  />
                )}

                {/* Formulário TMT Adulto */}
                {selectedTests.includes('TMT_ADULTO') && (
                  <NeuroTestTMTAdultoForm
                    patientAge={patientAge}
                    onResultsChange={handleTmtAdultoResultsChange}
                    onRemove={() => handleRemoveTest('TMT_ADULTO')}
                  />
                )}

                {/* Formulário Trilhas Pré-Escolares */}
                {selectedTests.includes('TRILHAS_PRE_ESCOLAR') && (
                  <NeuroTestTrilhasPreEscolarForm
                    patientAge={patientAge}
                    onResultsChange={handleTrilhasPreEscolarResultsChange}
                  />
                )}

                {/* Formulário FAS */}
                {selectedTests.includes('FAS') && (
                  <NeuroTestFASForm
                    patientAge={patientAge}
                    onResultsChange={handleFasResultsChange}
                  />
                )}

                {/* Formulário Hayling Adulto */}
                {selectedTests.includes('HAYLING_ADULTO') && (
                  <NeuroTestHaylingAdultoForm
                    patientAge={patientAge}
                    onResultsChange={handleHaylingAdultoResultsChange}
                    onRemove={() => handleRemoveTest('HAYLING_ADULTO')}
                  />
                )}

                {/* Formulário Hayling Infantil */}
                {selectedTests.includes('HAYLING_INFANTIL') && (
                  <NeuroTestHaylingInfantilForm
                    patientAge={patientAge}
                    onResultsChange={handleHaylingInfantilResultsChange}
                  />
                )}

                {/* Formulário TFV */}
                {selectedTests.includes('TFV') && (
                  <NeuroTestTFVForm
                    patientAge={patientAge}
                    onResultsChange={handleTfvResultsChange}
                  />
                )}

                {/* Formulário TOM */}
                {selectedTests.includes('TOM') && (
                  <NeuroTestTOMForm
                    patientAge={patientAge}
                    onResultsChange={handleTomResultsChange}
                  />
                )}

                {/* Formulário Taylor */}
                {selectedTests.includes('TAYLOR') && (
                  <NeuroTestTaylorForm
                    patientAge={patientAge}
                    onResultsChange={handleTaylorResultsChange}
                  />
                )}

                {/* Formulário TRPP */}
                {selectedTests.includes('TRPP') && (
                  <NeuroTestTRPPForm
                    patientAge={patientAge}
                    onResultsChange={handleTrppResultsChange}
                  />
                )}

                {/* Formulário FPT Infantil */}
                {selectedTests.includes('FPT_INFANTIL') && (
                  <NeuroTestFPTInfantilForm
                    patientAge={patientAge}
                    onResultsChange={handleFptInfantilResultsChange}
                  />
                )}

                {/* Formulário FPT Adulto */}
                {selectedTests.includes('FPT_ADULTO') && (
                  <NeuroTestFPTAdultoForm
                    patientAge={patientAge}
                    onResultsChange={handleFptAdultoResultsChange}
                  />
                )}

                {/* Formulário Figuras de Rey */}
                {selectedTests.includes('REY') && (
                  <NeuroTestReyForm
                    patientAge={patientAge}
                    onResultsChange={handleReyResultsChange}
                  />
                )}

                {/* Formulário Stroop */}
                {selectedTests.includes('STROOP') && (
                  <NeuroTestStroopForm
                    patientAge={patientAge}
                    onResultsChange={handleStroopResultsChange}
                  />
                )}

                {/* Formulário WCST */}
                {selectedTests.includes('WCST') && (
                  <NeuroTestWCSTForm
                    patientAge={patientAge}
                    onResultsChange={handleWcstResultsChange}
                  />
                )}

                {/* Formulário Wechsler (WAIS/WISC) */}
                {selectedTests.includes('WECHSLER') && (
                  <NeuroTestWechslerForm
                    patientAge={patientAge}
                    onResultsChange={handleWechslerResultsChange}
                  />
                )}

                {/* Torre de Londres */}
                {selectedTests.includes('TOL') && (
                  <NeuroTestToLForm patientAge={patientAge} onResultsChange={handleTolResultsChange} />
                )}

                {/* D2 Atenção Concentrada */}
                {selectedTests.includes('D2') && (
                  <NeuroTestD2Form patientAge={patientAge} onResultsChange={handleD2ResultsChange} />
                )}

                {/* BDI-II Depressão */}
                {selectedTests.includes('BDI') && (
                  <NeuroTestBDIForm patientAge={patientAge} onResultsChange={handleBdiResultsChange} />
                )}

                {/* BAI Ansiedade */}
                {selectedTests.includes('BAI') && (
                  <NeuroTestBAIForm patientAge={patientAge} onResultsChange={handleBaiResultsChange} />
                )}

                {/* SNAP-IV TDAH */}
                {selectedTests.includes('SNAPIV') && (
                  <NeuroTestSNAPIVForm patientAge={patientAge} onResultsChange={handleSnapivResultsChange} />
                )}

                {/* M-CHAT-R/F Autismo */}
                {selectedTests.includes('MCHAT') && (
                  <NeuroTestMCHATForm patientAge={patientAge} onResultsChange={handleMchatResultsChange} />
                )}

                {/* Matrizes de Raven */}
                {selectedTests.includes('RAVEN') && (
                  <NeuroTestRavenForm patientAge={patientAge} onResultsChange={handleRavenResultsChange} />
                )}

                {/* WMS Memória Wechsler */}
                {selectedTests.includes('WMS') && (
                  <NeuroTestWMSForm patientAge={patientAge} onResultsChange={handleWmsResultsChange} />
                )}

                {/* MoCA */}
                {selectedTests.includes('MOCA') && (
                  <NeuroTestMoCAForm patientAge={patientAge} onResultsChange={handleMocaResultsChange} />
                )}

                {/* MEEM */}
                {selectedTests.includes('MEEM') && (
                  <NeuroTestMEEMForm patientAge={patientAge} onResultsChange={handleMeemResultsChange} />
                )}

                {/* BRIEF-2 */}
                {selectedTests.includes('BRIEF2') && (
                  <NeuroTestBRIEF2Form patientAge={patientAge} onResultsChange={handleBrief2ResultsChange} />
                )}

                {/* Cubos de Corsi */}
                {selectedTests.includes('CORSI') && (
                  <NeuroTestCorsiForm patientAge={patientAge} onResultsChange={handleCorsiResultsChange} />
                )}

                {/* Conners 3 */}
                {selectedTests.includes('CONNERS') && (
                  <NeuroTestConnersForm patientAge={patientAge} onResultsChange={handleConnersResultsChange} />
                )}

                {/* Vineland-3 */}
                {selectedTests.includes('VINELAND') && (
                  <NeuroTestVinelandForm patientAge={patientAge} onResultsChange={handleVinelandResultsChange} />
                )}

                {/* ACE-III */}
                {selectedTests.includes('ACE3') && (
                  <NeuroTestACE3Form patientAge={patientAge} onResultsChange={handleAce3ResultsChange} />
                )}

                {/* CBCL */}
                {selectedTests.includes('CBCL') && (
                  <NeuroTestCBCLForm patientAge={patientAge} onResultsChange={handleCbclResultsChange} />
                )}

                {/* SDQ */}
                {selectedTests.includes('SDQ') && (
                  <NeuroTestSDQForm patientAge={patientAge} onResultsChange={handleSdqResultsChange} />
                )}

                {/* GDS */}
                {selectedTests.includes('GDS') && (
                  <NeuroTestGDSForm patientAge={patientAge} onResultsChange={handleGdsResultsChange} />
                )}

                {/* TDE-II */}
                {selectedTests.includes('TDE2') && (
                  <NeuroTestTDE2Form patientAge={patientAge} onResultsChange={handleTde2ResultsChange} />
                )}

                {/* NEUPSILIN */}
                {selectedTests.includes('NEUPSILIN') && (
                  <NeuroTestNEUPSILINForm patientAge={patientAge} onResultsChange={handleNeupsilinResultsChange} />
                )}

                {/* Cancelamento */}
                {selectedTests.includes('CANCELAMENTO') && (
                  <NeuroTestCancelamentoForm patientAge={patientAge} onResultsChange={handleCancelamentoResultsChange} />
                )}
              </Suspense>
              </div>
            )}

            {/* Avaliação Nutricional - Apenas para nutricionistas */}
            {isNutritionistProfessional && (
              <NutritionAssessmentForm
                data={nutritionData}
                onChange={setNutritionData}
              />
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
