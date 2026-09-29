import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const STOCK_UNITS = [
  { value: 'madre', label: 'MADRE' },
  { value: 'madre_escola', label: 'MADRE ESCOLA' },
  { value: 'floresta', label: 'Floresta' },
  { value: 'atendimento_floresta', label: 'Atendimento Floresta' },
];

type AccessLevel = 'none' | 'viewer' | 'manager';

interface ProfileRow {
  user_id: string;
  name: string;
  employee_role: string | null;
}

interface AccessRow {
  user_id: string;
  access_level: 'viewer' | 'manager';
  allowed_units: string[];
}

export const StockAccessManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [accessRows, setAccessRows] = useState<AccessRow[]>([]);
  const [search, setSearch] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAccess = async () => {
    setLoading(true);
    const [profilesResult, accessResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, name, employee_role')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('stock_user_access')
        .select('user_id, access_level, allowed_units'),
    ]);

    if (profilesResult.error || accessResult.error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar acessos',
        description: profilesResult.error?.message || accessResult.error?.message,
      });
    } else {
      setProfiles((profilesResult.data || []) as ProfileRow[]);
      setAccessRows((accessResult.data || []) as AccessRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAccess();
  }, []);

  const visibleProfiles = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return profiles.filter((profile) => !term || profile.name.toLocaleLowerCase('pt-BR').includes(term));
  }, [profiles, search]);

  const accessFor = (userId: string) => accessRows.find((row) => row.user_id === userId);

  const saveAccess = async (profile: ProfileRow, level: AccessLevel, units?: string[]) => {
    if (!user?.id || profile.employee_role === 'director') return;
    setSavingUserId(profile.user_id);

    if (level === 'none') {
      const { error } = await supabase.from('stock_user_access').delete().eq('user_id', profile.user_id);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao remover acesso', description: error.message });
      } else {
        setAccessRows((current) => current.filter((row) => row.user_id !== profile.user_id));
        toast({ title: 'Acesso ao estoque removido' });
      }
      setSavingUserId(null);
      return;
    }

    const current = accessFor(profile.user_id);
    const allowedUnits = units ?? current?.allowed_units ?? ['todas'];
    const { data, error } = await supabase
      .from('stock_user_access')
      .upsert({
        user_id: profile.user_id,
        access_level: level,
        allowed_units: allowedUnits.length > 0 ? allowedUnits : ['todas'],
        granted_by: user.id,
      })
      .select('user_id, access_level, allowed_units')
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar acesso', description: error.message });
    } else {
      setAccessRows((currentRows) => [
        ...currentRows.filter((row) => row.user_id !== profile.user_id),
        data as AccessRow,
      ]);
      await queryClient.invalidateQueries({ queryKey: ['stock-access', profile.user_id] });
      toast({ title: 'Acesso ao estoque atualizado' });
    }
    setSavingUserId(null);
  };

  const toggleUnit = (profile: ProfileRow, unitValue: string, checked: boolean) => {
    const current = accessFor(profile.user_id);
    if (!current) return;

    const withoutAll = current.allowed_units.filter((unit) => unit !== 'todas');
    const nextUnits = checked
      ? [...new Set([...withoutAll, unitValue])]
      : withoutAll.filter((unit) => unit !== unitValue);
    saveAccess(profile, current.access_level, nextUnits.length > 0 ? nextUnits : ['todas']);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" /> Acesso ao estoque
        </CardTitle>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar funcionário..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead className="w-[220px]">Nível</TableHead>
              <TableHead>Unidades autorizadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            )}
            {!loading && visibleProfiles.map((profile) => {
              const isDirector = profile.employee_role === 'director';
              const access = accessFor(profile.user_id);
              const level: AccessLevel = isDirector ? 'manager' : access?.access_level ?? 'none';
              const allUnits = isDirector || access?.allowed_units.includes('todas');

              return (
                <TableRow key={profile.user_id}>
                  <TableCell>
                    <p className="font-medium">{profile.name}</p>
                    {isDirector && <Badge variant="secondary" className="mt-1">Acesso total automático</Badge>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={level}
                      disabled={isDirector || savingUserId === profile.user_id}
                      onValueChange={(value: AccessLevel) => saveAccess(profile, value)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem acesso</SelectItem>
                        <SelectItem value="viewer">Somente consulta</SelectItem>
                        <SelectItem value="manager">Gestor do estoque</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {level === 'none' ? (
                      <span className="text-sm text-muted-foreground">Nenhuma unidade</span>
                    ) : allUnits ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Todas as unidades</Badge>
                        {!isDirector && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={savingUserId === profile.user_id}
                            onClick={() => saveAccess(profile, level, ['madre'])}
                          >
                            Restringir
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {STOCK_UNITS.map((unit) => (
                          <Label key={unit.value} className="flex items-center gap-2 text-sm font-normal">
                            <Checkbox
                              checked={access?.allowed_units.includes(unit.value) ?? false}
                              disabled={savingUserId === profile.user_id}
                              onCheckedChange={(checked) => toggleUnit(profile, unit.value, checked === true)}
                            />
                            {unit.label}
                          </Label>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={savingUserId === profile.user_id}
                          onClick={() => saveAccess(profile, level, ['todas'])}
                        >
                          Liberar todas
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};