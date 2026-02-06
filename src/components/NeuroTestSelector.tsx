import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Plus, Search, X } from 'lucide-react';
import { getTestsForAge, type NeuroTestDefinition } from '@/data/neuroTests';

interface NeuroTestSelectorProps {
  patientAge: number;
  selectedTests: string[];
  onSelectTest: (testCode: string) => void;
  onRemoveTest: (testCode: string) => void;
}

export default function NeuroTestSelector({
  patientAge,
  selectedTests,
  onSelectTest,
  onRemoveTest
}: NeuroTestSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const availableTests = getTestsForAge(patientAge);
  
  const filteredTests = availableTests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const unselectedTests = filteredTests.filter(
    test => !selectedTests.includes(test.code)
  );

  if (availableTests.length === 0) {
    return (
      <Card className="border-dashed border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Brain className="h-5 w-5" />
            <span className="text-sm">
              Nenhum teste disponível para pacientes de {patientAge} anos.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Testes Neuropsicológicos
          <Badge variant="secondary" className="ml-auto">
            Idade: {patientAge} anos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Testes selecionados */}
        {selectedTests.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Testes Selecionados</Label>
            <div className="flex flex-wrap gap-2">
              {selectedTests.map(testCode => {
                const test = availableTests.find(t => t.code === testCode);
                if (!test) return null;
                return (
                  <Badge 
                    key={testCode} 
                    variant="default"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    {test.name}
                    <button
                      type="button"
                      onClick={() => onRemoveTest(testCode)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Busca e lista de testes disponíveis */}
        {unselectedTests.length > 0 && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar teste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {unselectedTests.map(test => (
                <button
                  key={test.code}
                  type="button"
                  onClick={() => {
                    onSelectTest(test.code);
                    setSearchTerm(''); // Limpa a busca após selecionar
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <span className="font-medium text-sm">{test.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({test.minAge}-{test.maxAge} anos)
                    </span>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTests.length === 0 && unselectedTests.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Todos os testes disponíveis já foram selecionados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
