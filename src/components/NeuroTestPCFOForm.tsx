import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getPCFOStandardScore, suggestSchoolingLevel, type PCFOSchoolingLevel } from '@/data/neuroTests/pcfoStandardScores';
import { getPCFOClassification, getPCFOClassificationColor } from '@/data/neuroTests/pcfo';

interface NeuroTestPCFOFormProps {
  patientAge: number;
  onResultsChange: (results: PCFOResults | null) => void;
}

export interface PCFOResults {
  testCode: string;
  testName: string;
  patientAge: number;
  rawScores: {
    acertos: number;
    schoolingLevel: PCFOSchoolingLevel;
  };
  calculatedScores: {
    pontuacao: number;
    escorePadrao: number | null;
  };
  classifications: {
    geral: string;
  };
  notes: string;
}

const NeuroTestPCFOForm = ({ patientAge, onResultsChange }: NeuroTestPCFOFormProps) => {
  const [acertos, setAcertos] = useState<string>('');
  const [schoolingLevel, setSchoolingLevel] = useState<PCFOSchoolingLevel>(
    suggestSchoolingLevel(patientAge)
  );
  const [notes, setNotes] = useState('');
  const [results, setResults] = useState<PCFOResults | null>(null);

  useEffect(() => {
    calculateResults();
  }, [acertos, schoolingLevel, notes, patientAge]);

  const calculateResults = () => {
    const acertosNum = parseInt(acertos) || 0;

    // Validar entrada
    if (acertosNum < 0 || acertosNum > 40 || !acertos) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    // Calcular pontuação e escore padrão
    const pontuacao = acertosNum;
    const escorePadrao = getPCFOStandardScore(pontuacao, patientAge, schoolingLevel);

    // Determinar classificação
    const classification = escorePadrao !== null 
      ? getPCFOClassification(escorePadrao)
      : 'Não disponível';

    const newResults: PCFOResults = {
      testCode: 'PCFO',
      testName: 'Prova de Consciência Fonológica por produção Oral',
      patientAge,
      rawScores: {
        acertos: acertosNum,
        schoolingLevel
      },
      calculatedScores: {
        pontuacao,
        escorePadrao
      },
      classifications: {
        geral: classification
      },
      notes
    };

    setResults(newResults);
    onResultsChange(newResults);
  };

  const escorePadrao = results?.calculatedScores.escorePadrao;
  const classification = results?.classifications.geral || '';
  const classificationColor = getPCFOClassificationColor(classification);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            PCFO - Prova de Consciência Fonológica por produção Oral
            <Badge variant="outline">3-14 anos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nível escolar (importante para crianças de 6 anos) */}
          {patientAge === 6 && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">
                Nível Escolar (criança de 6 anos)
              </Label>
              <RadioGroup
                value={schoolingLevel}
                onValueChange={(value) => setSchoolingLevel(value as PCFOSchoolingLevel)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="infantil" id="infantil" />
                  <Label htmlFor="infantil" className="cursor-pointer">
                    Educação Infantil
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fundamental" id="fundamental" />
                  <Label htmlFor="fundamental" className="cursor-pointer">
                    Ensino Fundamental
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Selecione o nível escolar atual da criança para usar a tabela normativa correta.
              </p>
            </div>
          )}

          {/* Campo de entrada */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="acertos">Total de Acertos (0-40)</Label>
              <Input
                id="acertos"
                type="number"
                min="0"
                max="40"
                value={acertos}
                onChange={(e) => setAcertos(e.target.value)}
                placeholder="Digite o total de acertos"
              />
            </div>
          </div>

          {/* Resultados calculados */}
          {results && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Resultados Calculados</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Pontuação Bruta:</span>
                  <span className="ml-2 font-medium">{results.calculatedScores.pontuacao}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nível Escolar:</span>
                  <span className="ml-2 font-medium">
                    {schoolingLevel === 'infantil' ? 'Educação Infantil' : 'Ensino Fundamental'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Escore Padrão:</span>
                  <span className="ml-2 font-medium">
                    {escorePadrao !== null ? escorePadrao : 'N/D'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Classificação:</span>
                  <span className={`ml-2 font-medium ${classificationColor}`}>
                    {classification}
                  </span>
                </div>
              </div>

              {escorePadrao === null && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Escore padrão não disponível para esta combinação de idade/pontuação/nível escolar.
                </p>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="pcfo-notes">Observações</Label>
            <Textarea
              id="pcfo-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a aplicação do teste..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NeuroTestPCFOForm;
