import { useState, useEffect, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Brain, X, School } from 'lucide-react';
import { 
  getTSBCStandardScoreOD, 
  getTSBCStandardScoreOI 
} from '@/data/neuroTests/tsbcStandardScores';
import { 
  getTSBCClassification, 
  getTSBCClassificationColor,
  type TSBCResults,
  type TSBCSchoolType
} from '@/data/neuroTests/tsbc';

interface NeuroTestTSBCFormProps {
  patientAge: number;
  onResultsChange: (results: TSBCResults) => void;
  onRemove: () => void;
}

function NeuroTestTSBCForm({ patientAge, onResultsChange, onRemove }: NeuroTestTSBCFormProps) {
  const [ordemDireta, setOrdemDireta] = useState<string>('');
  const [ordemInversa, setOrdemInversa] = useState<string>('');
  const [schoolType, setSchoolType] = useState<TSBCSchoolType>('publica');
  const [notes, setNotes] = useState('');

  // Calcular resultados
  const results = useMemo(() => {
    const od = parseInt(ordemDireta) || 0;
    const oi = parseInt(ordemInversa) || 0;

    if (od === 0 && oi === 0) return null;

    const escorePadraoOD = getTSBCStandardScoreOD(od, patientAge, schoolType) ?? 0;
    const escorePadraoOI = getTSBCStandardScoreOI(oi, patientAge, schoolType) ?? 0;

    const classificacaoOD = getTSBCClassification(escorePadraoOD);
    const classificacaoOI = getTSBCClassification(escorePadraoOI);

    return {
      rawScores: {
        ordemDireta: od,
        ordemInversa: oi,
        schoolType
      },
      calculatedScores: {
        escorePadraoOD,
        escorePadraoOI
      },
      classifications: {
        classificacaoOD,
        classificacaoOI
      },
      notes: notes || undefined
    } as TSBCResults;
  }, [ordemDireta, ordemInversa, schoolType, patientAge, notes]);

  // Notificar pai quando resultados mudam
  useEffect(() => {
    if (results) {
      onResultsChange(results);
    }
  }, [results, onResultsChange]);

  const escorePadraoOD = results?.calculatedScores.escorePadraoOD;
  const escorePadraoOI = results?.calculatedScores.escorePadraoOI;
  const classificacaoOD = results?.classifications.classificacaoOD;
  const classificacaoOI = results?.classifications.classificacaoOI;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            TSBC - Tarefa Span de Blocos (Corsi)
            <Badge variant="outline" className="ml-1 text-xs">{patientAge} anos</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Escola */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <School className="h-4 w-4" />
            Tipo de Escola <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={schoolType}
            onValueChange={(v) => setSchoolType(v as TSBCSchoolType)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="publica" id="escola-publica" />
              <Label htmlFor="escola-publica" className="cursor-pointer">
                Pública
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="privada" id="escola-privada" />
              <Label htmlFor="escola-privada" className="cursor-pointer">
                Privada
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Entradas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Ordem Direta (acertos)
            </Label>
            <Input
              type="number"
              min="0"
              max="16"
              value={ordemDireta}
              onChange={(e) => setOrdemDireta(e.target.value)}
              placeholder="0-16"
              className="text-center"
            />
            {escorePadraoOD !== undefined && escorePadraoOD > 0 && (
              <div className="text-center space-y-1">
                <Badge variant="secondary" className="text-xs">
                  EP: {escorePadraoOD}
                </Badge>
                <p className={`text-xs font-medium ${getTSBCClassificationColor(classificacaoOD || '')}`}>
                  {classificacaoOD}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Ordem Inversa (acertos)
            </Label>
            <Input
              type="number"
              min="0"
              max="16"
              value={ordemInversa}
              onChange={(e) => setOrdemInversa(e.target.value)}
              placeholder="0-16"
              className="text-center"
            />
            {escorePadraoOI !== undefined && escorePadraoOI > 0 && (
              <div className="text-center space-y-1">
                <Badge variant="secondary" className="text-xs">
                  EP: {escorePadraoOI}
                </Badge>
                <p className={`text-xs font-medium ${getTSBCClassificationColor(classificacaoOI || '')}`}>
                  {classificacaoOI}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Escala de classificação */}
        <div className="p-2 bg-muted/30 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">Escala de Classificação (EP):</p>
          <div className="flex flex-wrap gap-1 text-xs">
            <Badge variant="outline" className="text-red-600 dark:text-red-400">&lt;70: Muito Baixa</Badge>
            <Badge variant="outline" className="text-orange-600 dark:text-orange-400">70-84: Baixa</Badge>
            <Badge variant="outline" className="text-gray-600 dark:text-gray-400">85-114: Média</Badge>
            <Badge variant="outline" className="text-blue-600 dark:text-blue-400">115-129: Alta</Badge>
            <Badge variant="outline" className="text-green-600 dark:text-green-400">≥130: Muito Alta</Badge>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Observações (opcional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotações sobre a aplicação..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(NeuroTestTSBCForm);
