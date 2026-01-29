import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FVA_TEST, 
  getFVAClassification, 
  getFVAClassificationColor,
  type FVAResults 
} from '@/data/neuroTests/fva';
import { calculateFVAPercentiles, hasFruitAndPairsNorms } from '@/data/neuroTests/fvaPercentiles';

interface NeuroTestFVAFormProps {
  patientAge: number;
  onResultsChange: (results: FVAResults | null) => void;
  initialData?: FVAResults;
}

const NeuroTestFVAForm: React.FC<NeuroTestFVAFormProps> = ({
  patientAge,
  onResultsChange,
  initialData
}) => {
  const [animais, setAnimais] = useState<string>(initialData?.rawScores.animais?.toString() || '');
  const [frutas, setFrutas] = useState<string>(initialData?.rawScores.frutas?.toString() || '');
  const [pares, setPares] = useState<string>(initialData?.rawScores.pares?.toString() || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  
  const [results, setResults] = useState<FVAResults | null>(null);
  
  const hasFullNorms = hasFruitAndPairsNorms(patientAge);

  useEffect(() => {
    const animaisNum = parseInt(animais) || 0;
    const frutasNum = parseInt(frutas) || 0;
    const paresNum = parseInt(pares) || 0;
    
    if (animaisNum === 0) {
      setResults(null);
      onResultsChange(null);
      return;
    }
    
    const percentiles = calculateFVAPercentiles(patientAge, animaisNum, frutasNum, paresNum);
    
    if (!percentiles) {
      setResults(null);
      onResultsChange(null);
      return;
    }
    
    const newResults: FVAResults = {
      rawScores: {
        animais: animaisNum,
        frutas: frutasNum,
        pares: paresNum
      },
      calculatedScores: {
        percentilAnimais: percentiles.percentilAnimais,
        percentilFrutas: percentiles.percentilFrutas,
        percentilPares: percentiles.percentilPares
      },
      classifications: {
        classificacaoAnimais: getFVAClassification(percentiles.percentilAnimais),
        classificacaoFrutas: percentiles.percentilFrutas !== 'N/A' 
          ? getFVAClassification(percentiles.percentilFrutas) 
          : 'N/A',
        classificacaoPares: percentiles.percentilPares !== 'N/A' 
          ? getFVAClassification(percentiles.percentilPares) 
          : 'N/A'
      },
      notes
    };
    
    setResults(newResults);
    onResultsChange(newResults);
  }, [animais, frutas, pares, notes, patientAge, onResultsChange]);

  const isAgeValid = patientAge >= FVA_TEST.minAge && patientAge <= FVA_TEST.maxAge;

  if (!isAgeValid) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          O teste FVA é aplicável para idades entre {FVA_TEST.minAge} e {FVA_TEST.maxAge} anos.
          Idade do paciente: {patientAge} anos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {FVA_TEST.fullName}
            <Badge variant="outline">{patientAge} anos</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{FVA_TEST.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasFullNorms && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Para crianças de 7-10 anos, apenas a categoria <strong>Animais</strong> possui normas disponíveis.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Pontuações brutas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="animais">Animais (Total de Acertos)</Label>
              <Input
                id="animais"
                type="number"
                min="0"
                max="50"
                value={animais}
                onChange={(e) => setAnimais(e.target.value)}
                placeholder="Ex: 15"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="frutas">
                Frutas (Total de Acertos)
                {!hasFullNorms && <span className="text-xs text-muted-foreground ml-1">(sem norma)</span>}
              </Label>
              <Input
                id="frutas"
                type="number"
                min="0"
                max="50"
                value={frutas}
                onChange={(e) => setFrutas(e.target.value)}
                placeholder="Ex: 12"
                disabled={!hasFullNorms}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pares">
                Pares (Total de Pares)
                {!hasFullNorms && <span className="text-xs text-muted-foreground ml-1">(sem norma)</span>}
              </Label>
              <Input
                id="pares"
                type="number"
                min="0"
                max="30"
                value={pares}
                onChange={(e) => setPares(e.target.value)}
                placeholder="Ex: 8"
                disabled={!hasFullNorms}
              />
            </div>
          </div>
          
          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a aplicação do teste..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Resultados calculados */}
      {results && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Resultados Calculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Animais */}
              <div className="p-3 bg-background rounded-lg border">
                <h4 className="font-medium text-sm mb-2">Animais</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pontuação:</span>
                    <span className="font-medium">{results.rawScores.animais}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentil:</span>
                    <span className="font-medium">{results.calculatedScores.percentilAnimais}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classificação:</span>
                    <span className={`font-medium ${getFVAClassificationColor(results.classifications.classificacaoAnimais)}`}>
                      {results.classifications.classificacaoAnimais}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Frutas */}
              <div className="p-3 bg-background rounded-lg border">
                <h4 className="font-medium text-sm mb-2">Frutas</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pontuação:</span>
                    <span className="font-medium">{results.rawScores.frutas || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentil:</span>
                    <span className="font-medium">{results.calculatedScores.percentilFrutas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classificação:</span>
                    <span className={`font-medium ${getFVAClassificationColor(results.classifications.classificacaoFrutas)}`}>
                      {results.classifications.classificacaoFrutas}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Pares */}
              <div className="p-3 bg-background rounded-lg border">
                <h4 className="font-medium text-sm mb-2">Pares (Alternada)</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pontuação:</span>
                    <span className="font-medium">{results.rawScores.pares || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentil:</span>
                    <span className="font-medium">{results.calculatedScores.percentilPares}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classificação:</span>
                    <span className={`font-medium ${getFVAClassificationColor(results.classifications.classificacaoPares)}`}>
                      {results.classifications.classificacaoPares}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NeuroTestFVAForm;
