import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Calculator, Trash2, Info, Clock, AlertTriangle, FileText } from 'lucide-react';
import { 
  FDT_TEST, 
  calculateInibicao, 
  calculateFlexibilidade, 
  type FDTScores, 
  type FDTResults 
} from '@/data/neuroTests/fdt';
import {
  lookupFDTPercentile,
  lookupFDTPercentileRange,
  getFDTClassification,
  getFDTClassificationColor,
  getFDTAgeGroupName,
  type FDTVariable
} from '@/data/neuroTests/fdtPercentiles';

interface NeuroTestFDTFormProps {
  patientAge: number;
  onResultsChange: (results: FDTResults) => void;
  onRemove: () => void;
}

// Nomenclatura clínica por variável
const FDT_NOMENCLATURE: Record<string, { domain: string; description: string }> = {
  leitura: {
    domain: 'Velocidade de Processamento Automático',
    description: 'Avalia a velocidade de processamento em tarefa automática (leitura de números).'
  },
  contagem: {
    domain: 'Velocidade de Processamento Controlado',
    description: 'Avalia a velocidade de processamento em tarefa que exige controle atencional (contagem).'
  },
  escolha: {
    domain: 'Controle Inibitório (Atenção Seletiva)',
    description: 'Avalia a capacidade de inibir a resposta automática de leitura para contar os estímulos.'
  },
  alternancia: {
    domain: 'Flexibilidade Cognitiva (Alternância Atencional)',
    description: 'Avalia a capacidade de alternar entre regras (ler ou contar) conforme a moldura.'
  },
  errosLeitura: {
    domain: 'Acurácia — Leitura',
    description: 'Número de erros cometidos na etapa de leitura automática.'
  },
  errosContagem: {
    domain: 'Acurácia — Contagem',
    description: 'Número de erros cometidos na etapa de contagem controlada.'
  },
  errosEscolha: {
    domain: 'Acurácia — Escolha',
    description: 'Número de erros cometidos na etapa de controle inibitório.'
  },
  errosAlternancia: {
    domain: 'Acurácia — Alternância',
    description: 'Número de erros cometidos na etapa de flexibilidade cognitiva.'
  },
  inibicao: {
    domain: 'Capacidade Inibitória',
    description: 'Índice de controle inibitório: diferença entre tempo de Escolha e Leitura.'
  },
  flexibilidade: {
    domain: 'Flexibilidade Mental',
    description: 'Índice de flexibilidade cognitiva: diferença entre tempo de Alternância e Leitura.'
  }
};

// Interpretação textual por classificação
const getInterpretationText = (classification: string, domain: string): string => {
  switch (classification) {
    case 'Muito Alta':
      return `Desempenho muito acima do esperado — ${domain.toLowerCase()} significativamente superior à média para a faixa etária.`;
    case 'Alta':
      return `Desempenho acima do esperado — ${domain.toLowerCase()} superior à média para a faixa etária.`;
    case 'Média Alta':
      return `Desempenho na faixa média-alta — ${domain.toLowerCase()} dentro do esperado, com tendência acima da média.`;
    case 'Média':
      return `Desempenho na faixa média — ${domain.toLowerCase()} dentro do esperado para a faixa etária.`;
    case 'Média Baixa':
      return `Desempenho na faixa média-baixa — ${domain.toLowerCase()} dentro do esperado, com tendência abaixo da média.`;
    case 'Baixa':
      return `Desempenho abaixo do esperado — ${domain.toLowerCase()} rebaixada em relação à faixa etária.`;
    case 'Muito Baixa':
      return `Desempenho muito abaixo do esperado — ${domain.toLowerCase()} significativamente rebaixada para a faixa etária.`;
    default:
      return '';
  }
};

/** Renderiza o badge de percentil + classificação */
const PercentilBadge = ({ variable, score, age }: { variable: FDTVariable; score: number; age: number }) => {
  const percentile = lookupFDTPercentile(age, variable, score);
  const range = lookupFDTPercentileRange(age, variable, score);
  const classification = getFDTClassification(percentile);
  const color = getFDTClassificationColor(classification);

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
        P{range}
      </Badge>
      <span className={`text-[10px] font-medium ${color}`}>
        {classification}
      </span>
    </div>
  );
};

/** Card de interpretação clínica individual */
const InterpretationCard = ({ 
  variable, 
  label, 
  score, 
  age, 
  isCalculated = false,
  formula
}: { 
  variable: FDTVariable; 
  label: string; 
  score: number; 
  age: number;
  isCalculated?: boolean;
  formula?: string;
}) => {
  const nomenclature = FDT_NOMENCLATURE[variable];
  if (!nomenclature) return null;

  const percentile = lookupFDTPercentile(age, variable, score);
  const range = lookupFDTPercentileRange(age, variable, score);
  const classification = getFDTClassification(percentile);
  const color = getFDTClassificationColor(classification);
  const interpretation = getInterpretationText(classification, nomenclature.domain);

  return (
    <div className="p-3 bg-background rounded-lg border space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-[10px] text-muted-foreground">{nomenclature.domain}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] shrink-0 ${color}`}>
          {classification}
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">Bruto: <strong className="text-foreground">{isCalculated ? score.toFixed(1) : score}</strong></span>
        <span className="text-muted-foreground">Percentil: <strong className="text-foreground">P{range}</strong></span>
      </div>
      {formula && (
        <p className="text-[10px] text-muted-foreground font-mono">{formula}</p>
      )}
      {interpretation && (
        <p className="text-[10px] text-muted-foreground italic leading-relaxed">{interpretation}</p>
      )}
    </div>
  );
};

export default function NeuroTestFDTForm({
  patientAge,
  onResultsChange,
  onRemove
}: NeuroTestFDTFormProps) {
  // Usar strings para os inputs para permitir valor "0"
  const [inputValues, setInputValues] = useState<Record<keyof FDTScores, string>>({
    leitura: '', contagem: '', escolha: '', alternancia: '',
    errosLeitura: '', errosContagem: '', errosEscolha: '', errosAlternancia: ''
  });
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  // Converter strings para números
  const scores: FDTScores = {
    leitura: inputValues.leitura !== '' ? Math.max(0, parseFloat(inputValues.leitura) || 0) : 0,
    contagem: inputValues.contagem !== '' ? Math.max(0, parseFloat(inputValues.contagem) || 0) : 0,
    escolha: inputValues.escolha !== '' ? Math.max(0, parseFloat(inputValues.escolha) || 0) : 0,
    alternancia: inputValues.alternancia !== '' ? Math.max(0, parseFloat(inputValues.alternancia) || 0) : 0,
    errosLeitura: inputValues.errosLeitura !== '' ? Math.max(0, parseInt(inputValues.errosLeitura) || 0) : 0,
    errosContagem: inputValues.errosContagem !== '' ? Math.max(0, parseInt(inputValues.errosContagem) || 0) : 0,
    errosEscolha: inputValues.errosEscolha !== '' ? Math.max(0, parseInt(inputValues.errosEscolha) || 0) : 0,
    errosAlternancia: inputValues.errosAlternancia !== '' ? Math.max(0, parseInt(inputValues.errosAlternancia) || 0) : 0
  };

  // Verificar se há algum input preenchido
  const hasAnyInput = Object.values(inputValues).some(v => v !== '');

  // Calcular resultados quando os scores mudam
  useEffect(() => {
    const inibicao = calculateInibicao(scores.escolha, scores.leitura);
    const flexibilidade = calculateFlexibilidade(scores.alternancia, scores.leitura);

    const allVars: { key: FDTVariable; value: number }[] = [
      { key: 'leitura', value: scores.leitura },
      { key: 'contagem', value: scores.contagem },
      { key: 'escolha', value: scores.escolha },
      { key: 'alternancia', value: scores.alternancia },
      { key: 'errosLeitura', value: scores.errosLeitura },
      { key: 'errosContagem', value: scores.errosContagem },
      { key: 'errosEscolha', value: scores.errosEscolha },
      { key: 'errosAlternancia', value: scores.errosAlternancia },
      { key: 'inibicao', value: inibicao },
      { key: 'flexibilidade', value: flexibilidade }
    ];

    const percentiles: Record<string, number> = {};
    const classifications: Record<string, string> = {};

    allVars.forEach(({ key, value }) => {
      const pct = lookupFDTPercentile(patientAge, key, value);
      percentiles[key] = pct;
      classifications[key] = getFDTClassification(pct);
    });

    const results: FDTResults = {
      rawScores: scores,
      calculatedScores: { inibicao, flexibilidade },
      percentiles: percentiles as any,
      classifications: classifications as any,
      notes
    };

    onResultsChange(results);
  }, [inputValues, notes, patientAge, onResultsChange]);

  const updateInput = (field: keyof FDTScores, value: string) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
  };

  const inibicao = calculateInibicao(scores.escolha, scores.leitura);
  const flexibilidade = calculateFlexibilidade(scores.alternancia, scores.leitura);

  // Campos de tempo
  const tempoFields: { key: keyof FDTScores; fdtVar: FDTVariable; label: string }[] = [
    { key: 'leitura', fdtVar: 'leitura', label: 'Leitura' },
    { key: 'contagem', fdtVar: 'contagem', label: 'Contagem' },
    { key: 'escolha', fdtVar: 'escolha', label: 'Escolha' },
    { key: 'alternancia', fdtVar: 'alternancia', label: 'Alternância' }
  ];

  // Campos de erros
  const erroFields: { key: keyof FDTScores; fdtVar: FDTVariable; label: string }[] = [
    { key: 'errosLeitura', fdtVar: 'errosLeitura', label: 'Leitura' },
    { key: 'errosContagem', fdtVar: 'errosContagem', label: 'Contagem' },
    { key: 'errosEscolha', fdtVar: 'errosEscolha', label: 'Escolha' },
    { key: 'errosAlternancia', fdtVar: 'errosAlternancia', label: 'Alternância' }
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {FDT_TEST.name} - {FDT_TEST.fullName}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {FDT_TEST.description}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Info className="h-3 w-3" />
          <span>Referência: {getFDTAgeGroupName(patientAge)} | Idade: {patientAge} anos</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Instruções */}
        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline w-full">
              <Info className="h-3 w-3" />
              <span>Instruções de aplicação</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showInstructions ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-2.5 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
              <p>• <strong>Leitura</strong>: O paciente lê os números escritos (1-5) o mais rápido possível.</p>
              <p>• <strong>Contagem</strong>: O paciente conta a quantidade de estímulos em cada célula.</p>
              <p>• <strong>Escolha</strong>: O paciente deve dizer a quantidade de estímulos (ignorando o número escrito - incongruente).</p>
              <p>• <strong>Alternância</strong>: O paciente alterna entre ler e contar conforme a moldura.</p>
              <p>• Registre o tempo em segundos e o número de erros para cada etapa.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Tempos */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Tempos (segundos)</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tempoFields.map(({ key, fdtVar, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs sm:text-sm">{label}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={inputValues[key]}
                  onChange={(e) => updateInput(key, e.target.value)}
                  className="h-9 text-sm"
                  placeholder="0"
                />
                {inputValues[key] !== '' && (
                  <PercentilBadge variable={fdtVar} score={scores[key]} age={patientAge} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Erros */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <Label className="text-xs font-semibold text-destructive uppercase tracking-wide">Erros</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {erroFields.map(({ key, fdtVar, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs sm:text-sm">{label}</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={inputValues[key]}
                  onChange={(e) => updateInput(key, e.target.value)}
                  className="h-9 text-sm"
                  placeholder="0"
                />
                {inputValues[key] !== '' && (
                  <PercentilBadge variable={fdtVar} score={scores[key]} age={patientAge} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Escores Calculados */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Calculator className="h-3.5 w-3.5 text-primary" />
            <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Escores Calculados</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Inibição */}
            <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <Label className="font-medium text-xs sm:text-sm">Inibição</Label>
                <span className="text-sm font-bold text-foreground">{inibicao.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Escolha ({scores.escolha}) - Leitura ({scores.leitura})</p>
              {hasAnyInput && (
                <div className="pt-1.5 border-t border-primary/10">
                  <PercentilBadge variable="inibicao" score={inibicao} age={patientAge} />
                </div>
              )}
            </div>
            
            {/* Flexibilidade */}
            <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <Label className="font-medium text-xs sm:text-sm">Flexibilidade</Label>
                <span className="text-sm font-bold text-foreground">{flexibilidade.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Alternância ({scores.alternancia}) - Leitura ({scores.leitura})</p>
              {hasAnyInput && (
                <div className="pt-1.5 border-t border-primary/10">
                  <PercentilBadge variable="flexibilidade" score={flexibilidade} age={patientAge} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cards de Interpretação Clínica */}
        {hasAnyInput && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Interpretação Clínica</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Tempos */}
              {tempoFields.map(({ key, fdtVar, label }) => (
                inputValues[key] !== '' && (
                  <InterpretationCard
                    key={`interp-${key}`}
                    variable={fdtVar}
                    label={`Tempo — ${label}`}
                    score={scores[key]}
                    age={patientAge}
                  />
                )
              ))}
              {/* Erros */}
              {erroFields.map(({ key, fdtVar, label }) => (
                inputValues[key] !== '' && (
                  <InterpretationCard
                    key={`interp-${key}`}
                    variable={fdtVar}
                    label={`Erros — ${label}`}
                    score={scores[key]}
                    age={patientAge}
                  />
                )
              ))}
              {/* Calculados */}
              {hasAnyInput && (
                <>
                  <InterpretationCard
                    variable="inibicao"
                    label="Inibição"
                    score={inibicao}
                    age={patientAge}
                    isCalculated
                    formula={`Escolha (${scores.escolha}) − Leitura (${scores.leitura}) = ${inibicao.toFixed(1)}`}
                  />
                  <InterpretationCard
                    variable="flexibilidade"
                    label="Flexibilidade"
                    score={flexibilidade}
                    age={patientAge}
                    isCalculated
                    formula={`Alternância (${scores.alternancia}) − Leitura (${scores.leitura}) = ${flexibilidade.toFixed(1)}`}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="space-y-1">
          <Label className="text-xs">Obs. do Teste</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comportamento, dificuldades observadas..."
            className="min-h-[50px] resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
