import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Messages() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mensagens</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidade em desenvolvimento - comunicação interna entre funcionários.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}