import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  unit?: string;
  birth_date?: string;
}

interface PatientAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  unitFilter?: string;
  onCreateNew?: () => void;
}

export function PatientAutocomplete({ 
  value, 
  onValueChange, 
  placeholder = "Digite para pesquisar paciente...",
  disabled = false,
  unitFilter,
  onCreateNew 
}: PatientAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm === '') {
        loadClients(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, unitFilter]);

  const loadClients = async (search: string) => {
    if (!search && clients.length === 0) return; // Don't load initially unless searching
    
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('id, name, cpf, phone, email, unit, birth_date')
        .eq('is_active', true)
        .limit(20);

      if (search) {
        query = query.or(`name.ilike.%${search}%,cpf.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (unitFilter && unitFilter !== 'all') {
        query = query.eq('unit', unitFilter);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  // Find selected client when value changes
  useEffect(() => {
    if (value) {
      const client = clients.find(c => c.id === value);
      setSelectedClient(client || null);
      if (client) {
        setSearchTerm(client.name);
      }
    } else {
      setSelectedClient(null);
      setSearchTerm('');
    }
  }, [value, clients]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return [];
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.cpf && client.cpf.includes(searchTerm)) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

  const calculateAge = (birthDate: string | undefined) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return `${age - 1} anos`;
    }
    return `${age} anos`;
  };

  const handleClientSelect = (client: Client) => {
    onValueChange(client.id);
    setSelectedClient(client);
    setSearchTerm(client.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // Clear selection if input doesn't match selected client
    if (selectedClient && newValue !== selectedClient.name) {
      onValueChange('');
      setSelectedClient(null);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    onValueChange('');
    setSelectedClient(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10 bg-muted/20 border-primary/20 focus:border-primary focus:ring-primary"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (searchTerm.length >= 2 || filteredClients.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <ScrollArea className="max-h-60">
            {loading ? (
              <div className="p-2 text-center text-muted-foreground">
                Buscando...
              </div>
            ) : (
              <>
                {onCreateNew && searchTerm && filteredClients.length === 0 && (
                  <>
                    <div 
                      className="px-3 py-2 cursor-pointer hover:bg-muted flex items-center gap-2 text-primary"
                      onClick={onCreateNew}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Novo Paciente: "{searchTerm}"</span>
                    </div>
                    <Separator />
                  </>
                )}

                {filteredClients.length > 0 ? (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground bg-muted/30 sticky top-0">
                      {filteredClients.length} paciente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
                    </div>
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="px-3 py-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleClientSelect(client)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {client.cpf && (
                              <div>CPF: {client.cpf}</div>
                            )}
                            {client.phone && (
                              <div>Tel: {client.phone}</div>
                            )}
                            {client.email && (
                              <div>Email: {client.email}</div>
                            )}
                            {client.unit && (
                              <div>Unidade: {client.unit}</div>
                            )}
                            {client.birth_date && (
                              <div>Idade: {calculateAge(client.birth_date)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : searchTerm.length >= 2 ? (
                  <div className="p-2 text-center text-muted-foreground">
                    Nenhum paciente encontrado
                  </div>
                ) : null}

                {onCreateNew && searchTerm.length >= 2 && (
                  <>
                    <Separator />
                    <div 
                      className="px-3 py-2 cursor-pointer hover:bg-muted flex items-center gap-2 text-primary"
                      onClick={onCreateNew}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Cadastrar novo paciente</span>
                    </div>
                  </>
                )}
              </>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}