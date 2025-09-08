import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Eye } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  address?: string;
  responsible_name?: string;
  responsible_phone?: string;
  medical_info?: string;
  status: string;
  created_at: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    birth_date: '',
    address: '',
    responsible_name: '',
    responsible_phone: '',
    medical_info: '',
    status: 'active'
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .insert([newClient]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });
      
      setIsDialogOpen(false);
      setNewClient({
        name: '',
        phone: '',
        email: '',
        birth_date: '',
        address: '',
        responsible_name: '',
        responsible_phone: '',
        medical_info: '',
        status: 'active'
      });
      loadClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o cliente.",
      });
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={newClient.birth_date}
                  onChange={(e) => setNewClient({ ...newClient, birth_date: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible_name">Nome do Responsável</Label>
                <Input
                  id="responsible_name"
                  value={newClient.responsible_name}
                  onChange={(e) => setNewClient({ ...newClient, responsible_name: e.target.value })}
                  placeholder="Nome do responsável (se menor de idade)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible_phone">Telefone do Responsável</Label>
                <Input
                  id="responsible_phone"
                  value={newClient.responsible_phone}
                  onChange={(e) => setNewClient({ ...newClient, responsible_phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="medical_info">Informações Médicas</Label>
                <Textarea
                  id="medical_info"
                  value={newClient.medical_info}
                  onChange={(e) => setNewClient({ ...newClient, medical_info: e.target.value })}
                  placeholder="Alergias, medicamentos, condições especiais, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newClient.status} onValueChange={(value) => setNewClient({ ...newClient, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateClient} disabled={!newClient.name}>
                Cadastrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando clientes...</p>
          ) : filteredClients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? 'Nenhum cliente encontrado com o termo de busca.' : 'Nenhum cliente cadastrado.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? "default" : "secondary"}>
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}