import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Calendar, Package, FileText, DollarSign, Users } from 'lucide-react';

export function QuickActions() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (path: string) => {
    setIsLoading(true);
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate(path);
    } finally {
      setIsLoading(false);
    }
  };

  const actions = [
    {
      title: 'Novo Paciente',
      description: 'Cadastrar novo paciente',
      icon: UserPlus,
      path: '/clients/new',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Agendar',
      description: 'Novo agendamento',
      icon: Calendar,
      path: '/schedule',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Estoque',
      description: 'Gerenciar estoque',
      icon: Package,
      path: '/stock',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Relatórios',
      description: 'Visualizar relatórios',
      icon: FileText,
      path: '/reports',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Financeiro',
      description: 'Gestão financeira',
      icon: DollarSign,
      path: '/financial',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Funcionários',
      description: 'Gerenciar equipe',
      icon: Users,
      path: '/employees',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  return (
    <Card className="shadow-professional">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.path}
                variant="outline"
                className={`h-20 md:h-24 flex flex-col items-center justify-center gap-1 p-2 md:p-3 transition-all hover:shadow-lg active:scale-95 ${action.color} hover:text-white border-none text-white touch-manipulation`}
                onClick={() => handleAction(action.path)}
                disabled={isLoading}
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-xs font-medium text-center leading-tight">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}