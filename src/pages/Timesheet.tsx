import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Timesheet() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Controle de Ponto</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Ponto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidade em desenvolvimento - controle de entrada e saída dos funcionários.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}