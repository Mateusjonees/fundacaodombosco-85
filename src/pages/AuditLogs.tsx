import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageTransition } from '@/components/ui/page-transition';

const PAGE_SIZE = 25;

const AuditLogs = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, entityFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (actionFilter !== 'all') query = query.eq('action', actionFilter);
      if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data || [], count: count || 0 };
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-map'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, name');
      if (error) throw error;
      return data;
    },
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Sistema';
    return profiles.find((p: any) => p.user_id === userId)?.name || userId.slice(0, 8);
  };

  const logs = data?.logs || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filtered = search
    ? logs.filter((l: any) => 
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
        getUserName(l.user_id).toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const getActionColor = (action: string) => {
    if (action?.includes('delete')) return 'bg-destructive/10 text-destructive';
    if (action?.includes('create') || action?.includes('insert')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (action?.includes('update') || action?.includes('edit')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (action?.includes('login') || action?.includes('logout')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
            <p className="text-sm text-muted-foreground">Histórico de ações do sistema ({totalCount} registros)</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Ação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Ações</SelectItem>
              <SelectItem value="create">Criação</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
              <SelectItem value="login_success">Login</SelectItem>
              <SelectItem value="logout_success">Logout</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={v => { setEntityFilter(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Entidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="auth">Autenticação</SelectItem>
              <SelectItem value="client">Paciente</SelectItem>
              <SelectItem value="schedule">Agenda</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="employee">Funcionário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <p className="p-4 text-muted-foreground text-sm">Carregando...</p> :
            filtered.length === 0 ? <p className="p-4 text-muted-foreground text-sm">Nenhum registro encontrado</p> :
            <div className="divide-y">
              {filtered.map((log: any) => (
                <div key={log.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs ${getActionColor(log.action)}`}>{log.action}</Badge>
                      <div>
                        <p className="text-sm font-medium">{getUserName(log.user_id)}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.entity_type}{log.entity_id ? ` • ${log.entity_id.slice(0, 8)}...` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AuditLogs;
