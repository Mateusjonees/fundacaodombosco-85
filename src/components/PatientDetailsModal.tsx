import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ClientDetailsView from './ClientDetailsView';

interface PatientDetailsModalProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PatientDetailsModal = ({ clientId, open, onOpenChange }: PatientDetailsModalProps) => {
  const { data: client, isLoading } = useQuery({
    queryKey: ['patient-details-modal', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
    staleTime: 60000,
  });

  const handleBack = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-6xl h-[95vh] max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : client ? (
          <div className="flex-1 overflow-y-auto">
            <ClientDetailsView 
              client={client} 
              onEdit={() => {}} 
              onBack={handleBack}
              onRefresh={() => {}}
            />
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <p>Paciente não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
