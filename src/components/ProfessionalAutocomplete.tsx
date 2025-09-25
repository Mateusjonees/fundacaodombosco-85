import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface ProfessionalAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  roleFilter?: string;
  unitFilter?: string;
  onCreateNew?: () => void;
}

export function ProfessionalAutocomplete({ 
  value, 
  onValueChange, 
  placeholder = "Digite para pesquisar profissional...",
  disabled = false,
  roleFilter,
  unitFilter,
  onCreateNew 
}: ProfessionalAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
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
        loadProfessionals(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, unitFilter]);

  const loadProfessionals = async (search: string) => {
    if (!search && professionals.length === 0) return; // Don't load initially unless searching
    
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, user_id, name, email, phone, employee_role, unit, department')
        .eq('is_active', true)
        .not('employee_role', 'is', null)
        .limit(20);

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
      toast.error('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  // Find selected professional when value changes
  useEffect(() => {
    if (value) {
      const professional = professionals.find(p => p.user_id === value);
      setSelectedProfessional(professional || null);
      if (professional) {
        setSearchTerm(professional.name);
      }
    } else {
      setSelectedProfessional(null);
      setSearchTerm('');
    }
  }, [value, professionals]);

  const filteredProfessionals = useMemo(() => {
    if (!searchTerm) return [];
    return professionals.filter(professional => 
      professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (professional.email && professional.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (professional.phone && professional.phone.includes(searchTerm))
    );
  }, [professionals, searchTerm]);

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

  const handleProfessionalSelect = (professional: Professional) => {
    onValueChange(professional.user_id);
    setSelectedProfessional(professional);
    setSearchTerm(professional.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // Clear selection if input doesn't match selected professional
    if (selectedProfessional && newValue !== selectedProfessional.name) {
      onValueChange('');
      setSelectedProfessional(null);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    onValueChange('');
    setSelectedProfessional(null);
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

      {isOpen && (searchTerm.length >= 2 || filteredProfessionals.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <ScrollArea className="max-h-60">
            {loading ? (
              <div className="p-2 text-center text-muted-foreground">
                Buscando...
              </div>
            ) : (
              <>
                {onCreateNew && searchTerm && filteredProfessionals.length === 0 && (
                  <>
                    <div 
                      className="px-3 py-2 cursor-pointer hover:bg-muted flex items-center gap-2 text-primary"
                      onClick={onCreateNew}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Novo Profissional: "{searchTerm}"</span>
                    </div>
                    <Separator />
                  </>
                )}

                {filteredProfessionals.length > 0 ? (
                  <>
                    <div className="px-2 py-1 text-xs text-muted-foreground bg-muted/30 sticky top-0">
                      {filteredProfessionals.length} profissional{filteredProfessionals.length !== 1 ? 's' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
                    </div>
                    {filteredProfessionals.map((professional) => (
                      <div
                        key={professional.id}
                        className="px-3 py-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleProfessionalSelect(professional)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{professional.name}</span>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {professional.employee_role && (
                              <div>Cargo: {getRoleLabel(professional.employee_role)}</div>
                            )}
                            {professional.email && (
                              <div>Email: {professional.email}</div>
                            )}
                            {professional.phone && (
                              <div>Tel: {professional.phone}</div>
                            )}
                            {professional.unit && (
                              <div>Unidade: {professional.unit}</div>
                            )}
                            {professional.department && (
                              <div>Departamento: {professional.department}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : searchTerm.length >= 2 ? (
                  <div className="p-2 text-center text-muted-foreground">
                    Nenhum profissional encontrado
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
                      <span>Cadastrar novo profissional</span>
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