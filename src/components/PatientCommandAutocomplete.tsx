import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  unit?: string;
}

interface PatientCommandAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  unitFilter?: string;
}

export function PatientCommandAutocomplete({ 
  value, 
  onValueChange, 
  placeholder = "Selecione um paciente...",
  disabled = false,
  unitFilter
}: PatientCommandAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm === '') {
        loadClients(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, unitFilter]);

  const loadClients = async (search: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('id, name, cpf, phone, email, unit')
        .eq('is_active', true)
        .limit(50);

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
      toast({ 
        description: 'Erro ao carregar pacientes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (open && clients.length === 0) {
      loadClients('');
    }
  }, [open]);

  const selectedClient = clients.find(client => client.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedClient ? selectedClient.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar paciente por nome, CPF, telefone ou email..." 
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Buscando...
                </div>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
                    {searchTerm && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tente buscar por nome, CPF, telefone ou email
                      </p>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={`${client.name} ${client.cpf || ''} ${client.phone || ''} ${client.email || ''}`}
                      onSelect={() => {
                        onValueChange(client.id);
                        setOpen(false);
                        setSearchTerm('');
                      }}
                      className="p-3 cursor-pointer"
                    >
                      <div className="flex items-start w-full gap-3">
                        <Check
                          className={cn(
                            "mt-1 h-4 w-4 shrink-0",
                            value === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{client.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {client.cpf && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">CPF:</span>
                                <span>{client.cpf}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Tel:</span>
                                <span>{client.phone}</span>
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Email:</span>
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            {client.unit && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Unidade:</span>
                                <span className="capitalize">{client.unit}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}