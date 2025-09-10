import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MedicalRecords() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Prontuários</h1>
      <Card>
        <CardHeader>
          <CardTitle>Prontuários Médicos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidade em desenvolvimento - sistema completo de prontuários.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}