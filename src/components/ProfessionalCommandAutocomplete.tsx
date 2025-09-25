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

interface Professional {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  employee_role?: string;
  unit?: string;
  department?: string;
}

interface ProfessionalCommandAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  roleFilter?: string;
  unitFilter?: string;
}

export function ProfessionalCommandAutocomplete({ 
  value, 
  onValueChange, 
  placeholder = "Selecione um profissional...",
  disabled = false,
  roleFilter,
  unitFilter
}: ProfessionalCommandAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm === '') {
        loadProfessionals(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, unitFilter]);

  const loadProfessionals = async (search: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, user_id, name, email, phone, employee_role, unit, department')
        .eq('is_active', true)
        .not('employee_role', 'is', null)
        .limit(50);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('employee_role', roleFilter as any);
      }

      if (unitFilter && unitFilter !== 'all') {
        query = query.eq('unit', unitFilter);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      toast({ 
        description: 'Erro ao carregar profissionais',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (open && professionals.length === 0) {
      loadProfessionals('');
    }
  }, [open]);

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'director': 'Diretor',
      'coordinator_madre': 'Coordenador Madre', 
      'coordinator_floresta': 'Coordenador Floresta',
      'administrative': 'Administrativo',
      'staff': 'Staff',
      'receptionist': 'Recepcionista',
      'financeiro': 'Financeiro'
    };
    return roleLabels[role] || role;
  };

  const selectedProfessional = professionals.find(prof => prof.user_id === value);

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
          {selectedProfessional ? selectedProfessional.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar profissional por nome, email ou telefone..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhum profissional encontrado.</CommandEmpty>
                <CommandGroup>
                  {professionals.map((professional) => (
                    <CommandItem
                      key={professional.id}
                      value={`${professional.name} ${professional.email || ''} ${professional.phone || ''}`}
                      onSelect={() => {
                        onValueChange(professional.user_id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === professional.user_id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{professional.name}</span>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {professional.employee_role && (
                            <div>Cargo: {getRoleLabel(professional.employee_role)}</div>
                          )}
                          {professional.email && <div>Email: {professional.email}</div>}
                          {professional.phone && <div>Tel: {professional.phone}</div>}
                          {professional.unit && <div>Unidade: {professional.unit}</div>}
                          {professional.department && <div>Depto: {professional.department}</div>}
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