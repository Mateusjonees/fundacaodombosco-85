import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Edit, 
  FileText, 
  Trash2, 
  Plus, 
  Users, 
  MapPin, 
  Phone, 
  Mail,
  User,
  Activity,
  Upload,
  History,
  ArrowLeft,
  UserX,
  RotateCcw,
  AlertTriangle,
  UserPlus,
  Minus
} from 'lucide-react';
import { ContractGenerator } from './ContractGenerator';
import ServiceHistory from './ServiceHistory';
import ClientPaymentManager from './ClientPaymentManager';

interface Client {
  id: string;
  name: string;
  cpf?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  responsible_name?: string;
  responsible_phone?: string;
  unit?: string;
  address?: string;
  diagnosis?: string;
  medical_history?: string;
  neuropsych_complaint?: string;
  treatment_expectations?: string;
  clinical_observations?: string;
  is_active: boolean;
  created_at: string;
}

interface ClientNote {
  id: string;
  note_text: string;
  note_type: string;
  created_at: string;
  profiles?: { name: string };
}

interface ClientDocument {
  id: string;
  document_name: string;
  document_type: string;
  uploaded_at: string;
  profiles?: { name: string };
}

interface AssignedProfessional {
  id: string;
  employee_id: string;
  is_active: boolean;
  profiles?: { name: string; employee_role: string };
  assigned_at: string;
}

interface Employee {
  user_id: string;
  name: string;
  employee_role: string;
}

interface ClientDetailsViewProps {
  client: Client;
  onEdit: () => void;
  onBack?: () => void;
  onRefresh?: () => void;
}

export default function ClientDetailsView({ client, onEdit, onBack, onRefresh }: ClientDetailsViewProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [assignedProfessionals, setAssignedProfessionals] = useState<AssignedProfessional[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newNote, setNewNote] = useState('');
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [linkProfessionalDialogOpen, setLinkProfessionalDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(['']); // Array para múltiplas seleções
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<any[]>([]);
  const { toast } = useToast();

  // Helper function to check if user is coordinator or director
  const isCoordinatorOrDirector = () => {
    return userProfile?.employee_role === 'director' || 
           userProfile?.employee_role === 'coordinator_madre' || 
           userProfile?.employee_role === 'coordinator_floresta';
  };

  useEffect(() => {
    loadClientData();
  }, [client.id]);

  const loadClientData = async () => {
    await Promise.all([
      loadNotes(),
      loadDocuments(), 
      loadAssignedProfessionals(),
      loadEmployees(),
      loadUserProfile(),
      loadAvailableEmployees(),
      loadCurrentAssignments()
    ]);
  };

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadNotes = async () => {
    try {
      // Buscar notas separadamente para evitar erros de relacionamento
      const { data: notesData, error } = await supabase
        .from('client_notes')
        .select('id, note_text, note_type, created_at, created_by')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos criadores das notas
      if (notesData && notesData.length > 0) {
        const creatorIds = [...new Set(notesData.map(n => n.created_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', creatorIds);

        const notesWithProfiles = notesData.map(note => ({
          ...note,
          profiles: profiles?.find(p => p.user_id === note.created_by) || undefined
        }));

        setNotes(notesWithProfiles);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select(`
          id,
          document_name,
          document_type,
          uploaded_at,
          profiles:uploaded_by (name)
        `)
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadAssignedProfessionals = async () => {
    try {
      const { data: assignments, error } = await supabase
        .from('client_assignments')
        .select('id, assigned_at, employee_id, is_active')
        .eq('client_id', client.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      if (assignments && assignments.length > 0) {
        const employeeIds = assignments.map(a => a.employee_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name, employee_role')
          .in('user_id', employeeIds);

        if (profilesError) throw profilesError;

        const assignedWithProfiles = assignments.map(assignment => ({
          id: assignment.id,
          employee_id: assignment.employee_id,
          is_active: assignment.is_active,
          assigned_at: assignment.assigned_at,
          profiles: profiles?.find(p => p.user_id === assignment.employee_id) || { name: 'N/A', employee_role: 'N/A' }
        }));

        setAssignedProfessionals(assignedWithProfiles);
      } else {
        setAssignedProfessionals([]);
      }
    } catch (error) {
      console.error('Error loading assigned professionals:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_notes')
        .insert({
          client_id: client.id,
          note_text: newNote.trim(),
          created_by: user?.id,
          note_type: 'general'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Nota adicionada com sucesso!",
      });

      setNewNote('');
      setAddNoteDialogOpen(false);
      loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar a nota.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleScheduleAppointment = () => {
    // Use React Router navigate instead of window.location.href
    const searchParams = new URLSearchParams();
    searchParams.set('client_id', client.id);
    searchParams.set('client_name', client.name);
    window.location.href = `/schedule?${searchParams.toString()}`;
  };

  const loadEmployees = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(profiles || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleLinkProfessionals = () => {
    setLinkProfessionalDialogOpen(true);
  };

  const handleLinkProfessional = async () => {
    if (!selectedProfessional) return;

    setLoading(true);
    try {
      // Verificar se já existe vinculação
      const { data: existing, error: checkError } = await supabase
        .from('client_assignments')
        .select('id, is_active')
        .eq('client_id', client.id)
        .eq('employee_id', selectedProfessional)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        if (!existing.is_active) {
          // Reativar vinculação existente
          const { error: updateError } = await supabase
            .from('client_assignments')
            .update({ 
              is_active: true,
              assigned_by: user?.id 
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        } else {
          toast({
            variant: "destructive",
            title: "Já vinculado",
            description: "Este profissional já está vinculado a este paciente.",
          });
          setLoading(false);
          return;
        }
      } else {
        // Criar nova vinculação
        const { error } = await supabase
          .from('client_assignments')
          .insert({
            client_id: client.id,
            employee_id: selectedProfessional,
            assigned_by: user?.id
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Profissional vinculado com sucesso!",
      });

      setSelectedProfessional('');
      setLinkProfessionalDialogOpen(false);
      loadAssignedProfessionals();
    } catch (error) {
      console.error('Error linking professional:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível vincular o profissional.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfessional = async (assignmentId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja remover este profissional do cliente?');
    
    if (!confirmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Profissional removido com sucesso!",
      });

      loadAssignedProfessionals();
    } catch (error) {
      console.error('Error removing professional:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o profissional.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateClient = async () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja ${client.is_active ? 'desativar' : 'reativar'} o cliente "${client.name}"?`
    );
    
    if (!confirmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !client.is_active })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Cliente ${client.is_active ? 'desativado' : 'reativado'} com sucesso!`,
      });

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating client status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do cliente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProfessional = async () => {
    // Filtrar apenas seleções válidas (não vazias)
    const validEmployees = selectedEmployees.filter(emp => emp && emp.trim() !== '');
    
    if (validEmployees.length === 0) return;

    try {
      // Verificar e criar/reativar vinculações
      for (const employeeId of validEmployees) {
        // Verificar se já existe uma vinculação
        const { data: existing, error: checkError } = await supabase
          .from('client_assignments')
          .select('id, is_active')
          .eq('client_id', client.id)
          .eq('employee_id', employeeId)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          // Se existe mas está inativa, reativar
          if (!existing.is_active) {
            const { error: updateError } = await supabase
              .from('client_assignments')
              .update({ 
                is_active: true,
                assigned_by: user?.id 
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
          }
          // Se já existe e está ativa, apenas continuar
        } else {
          // Criar nova vinculação
          const { error: insertError } = await supabase
            .from('client_assignments')
            .insert({
              client_id: client.id,
              employee_id: employeeId,
              assigned_by: user?.id
            });

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Sucesso",
        description: `${validEmployees.length} profissional(is) vinculado(s) com sucesso!`,
      });
      
      setIsAssignDialogOpen(false);
      setSelectedEmployees(['']); // Reset para um campo vazio
      loadCurrentAssignments();
      loadAvailableEmployees();
    } catch (error) {
      console.error('Error assigning professionals:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível vincular os profissionais.",
      });
    }
  };

  const addEmployeeField = () => {
    setSelectedEmployees([...selectedEmployees, '']);
  };

  const removeEmployeeField = (index: number) => {
    if (selectedEmployees.length > 1) {
      const newEmployees = selectedEmployees.filter((_, i) => i !== index);
      setSelectedEmployees(newEmployees);
    }
  };

  const updateEmployeeSelection = (index: number, value: string) => {
    const newEmployees = [...selectedEmployees];
    newEmployees[index] = value;
    setSelectedEmployees(newEmployees);
  };

  const loadAvailableEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, name, employee_role')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadCurrentAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('client_assignments')
        .select(`
          id,
          employee_id,
          assigned_at,
          is_active,
          profiles!client_assignments_employee_id_fkey (
            name,
            employee_role
          )
        `)
        .eq('client_id', client.id)
        .eq('is_active', true);

      if (error) throw error;
      setCurrentAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('client_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vinculação removida com sucesso!",
      });
      
      loadCurrentAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a vinculação.",
      });
    }
  };

  const handleGenerateReport = () => {
    const reportContent = `
RELATÓRIO DO CLIENTE
====================

Nome: ${client.name}
ID: ${client.id}
CPF: ${client.cpf || 'Não informado'}
Data de Nascimento: ${client.birth_date ? formatDate(client.birth_date) : 'Não informado'}
Email: ${client.email || 'Não informado'}
Telefone: ${client.phone || 'Não informado'}

DADOS CLÍNICOS
==============

Diagnóstico: ${client.diagnosis || 'Nenhum'}
Histórico Médico: ${client.medical_history || 'Nenhum'}
Queixa Neuropsicológica: ${client.neuropsych_complaint || 'Nenhum'}
Expectativas do Tratamento: ${client.treatment_expectations || 'Não informado'}

OBSERVAÇÕES
===========

${client.clinical_observations || 'Nenhuma observação registrada'}

NOTAS REGISTRADAS
=================

${notes.map(note => `
Data: ${formatDateTime(note.created_at)}
Criado por: ${note.profiles?.name || 'Usuário'}
Nota: ${note.note_text}
`).join('\n')}

DOCUMENTOS ANEXADOS
==================

${documents.map(doc => `
- ${doc.document_name} (${doc.document_type || 'Documento'})
  Enviado em: ${formatDateTime(doc.uploaded_at)}
  Por: ${doc.profiles?.name || 'Usuário'}
`).join('\n')}

Relatório gerado em: ${new Date().toLocaleString('pt-BR')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-${client.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório Gerado",
      description: "O relatório foi baixado com sucesso!",
    });
  };

  const handleDeleteClient = async () => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Cliente Excluído",
        description: "O cliente foi marcado como inativo.",
      });
      
      onBack && onBack();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o cliente.",
      });
    }
  };

  const handleUploadDocument = () => {
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      console.log('No file selected');
      return;
    }

    console.log('Starting file upload:', selectedFile.name, 'for client:', client.id);
    setLoading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `client-documents/${client.id}/${fileName}`;

      console.log('Uploading to storage:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Storage upload successful, saving to database');
      // Save document record to database
      const { error: dbError } = await supabase
        .from('client_documents')
        .insert({
          client_id: client.id,
          document_name: selectedFile.name,
          document_type: fileExt || 'document',
          file_path: filePath,
          file_size: selectedFile.size,
          uploaded_by: user?.id
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      console.log('Document uploaded successfully');
      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso!",
      });

      setSelectedFile(null);
      setUploadDialogOpen(false);
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível enviar o documento: ${error.message || error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'madre': return 'MADRE';
      case 'floresta': return 'Floresta';
      default: return unit || 'Não informado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">ID: {client.id}</p>
        </div>
        <div className="flex gap-2">
          {isCoordinatorOrDirector() && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Dados
            </Button>
          )}
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.cpf && (
              <div>
                <strong>CPF:</strong> {client.cpf}
              </div>
            )}
            {client.birth_date && (
              <div>
                <strong>Data de Nasc.:</strong> {formatDate(client.birth_date)}
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <strong>Email:</strong> {client.email}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <strong>Telefone:</strong> {client.phone}
              </div>
            )}
            {client.responsible_name && (
              <div>
                <strong>Responsável:</strong> {client.responsible_name}
                {client.responsible_phone && ` - ${client.responsible_phone}`}
              </div>
            )}
            <div>
              <strong>Unidade:</strong> {getUnitLabel(client.unit || '')}
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{client.address || 'Não informado'}</p>
          </CardContent>
        </Card>

        {/* Profissional Vinculado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Profissional Vinculado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedProfessionals.length > 0 ? (
              <div className="space-y-2">
                {assignedProfessionals.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{assignment.profiles.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.profiles.employee_role}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {formatDate(assignment.assigned_at)}
                    </Badge>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground mt-2">
                  {assignedProfessionals.length} profissional{assignedProfessionals.length > 1 ? 'is' : ''} vinculado{assignedProfessionals.length > 1 ? 's' : ''}.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum profissional vinculado</p>
            )}
          </CardContent>
        </Card>

        {/* Informações Clínicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Informações Clínicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong>Diagnóstico Principal:</strong>
              <p>{client.diagnosis || 'Nenhum'}</p>
            </div>
            <div>
              <strong>Histórico Médico:</strong>
              <p>{client.medical_history || 'Nenhum'}</p>
            </div>
            <div>
              <strong>Queixa Neuropsicológica:</strong>
              <p>{client.neuropsych_complaint || 'Nenhum'}</p>
            </div>
            <div>
              <strong>Expectativas do Tratamento:</strong>
              <p>{client.treatment_expectations || 'Não informado'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {client.clinical_observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{client.clinical_observations}</p>
          </CardContent>
        </Card>
      )}

      {/* Notas do Cliente */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas do Cliente
            </CardTitle>
            <Dialog open={addNoteDialogOpen} onOpenChange={setAddNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Nota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Nota</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="newNote">Nota</Label>
                    <Textarea
                      id="newNote"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Digite sua nota aqui..."
                      rows={5}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAddNoteDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddNote} disabled={loading || !newNote.trim()}>
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      {note.profiles?.name || 'Usuário'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(note.created_at)}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma nota registrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Documentos Anexados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Documentos Anexados
            </CardTitle>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Anexar Documento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Anexar Documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Arquivo</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleFileUpload} disabled={loading || !selectedFile}>
                    {loading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{doc.document_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Enviado por {doc.profiles?.name || 'Usuário'} em {formatDateTime(doc.uploaded_at)}
                    </div>
                  </div>
                  <Badge variant="outline">{doc.document_type || 'Documento'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum documento anexado.</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="professionals">Profissionais Vinculados</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="contracts">Contratos</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Nome:</span>
                    <span>{client.name}</span>
                  </div>
                  
                  {client.cpf && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">CPF:</span>
                      <span>{client.cpf}</span>
                    </div>
                  )}
                  
                  {client.birth_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Data de Nascimento:</span>
                      <span>{formatDate(client.birth_date)}</span>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Telefone:</span>
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Email:</span>
                      <span>{client.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {client.responsible_name && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Responsável:</span>
                        <span>{client.responsible_name}</span>
                      </div>
                      
                      {client.responsible_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">Tel. Responsável:</span>
                          <span>{client.responsible_phone}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {client.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <div>
                        <span className="font-medium">Endereço:</span>
                        <p className="mt-1">{client.address}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Unidade:</span>
                    <Badge variant={client.unit === 'madre' ? 'default' : 'secondary'}>
                      {client.unit === 'madre' ? 'MADRE' : 'Floresta'}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="professionals" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Profissionais Vinculados</h3>
                  {userProfile?.employee_role && ['director', 'coordinator_madre', 'coordinator_floresta'].includes(userProfile.employee_role) && (
                    <Dialog open={linkProfessionalDialogOpen} onOpenChange={setLinkProfessionalDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Vincular Profissional
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Vincular Profissional ao Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="professional">Selecione o Profissional</Label>
                            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                              <SelectTrigger>
                                <SelectValue placeholder="Escolha um profissional" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.filter(emp => 
                                  !assignedProfessionals.some(assigned => assigned.employee_id === emp.user_id)
                                ).map((employee) => (
                                  <SelectItem key={employee.user_id} value={employee.user_id}>
                                    {employee.name} - {employee.employee_role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setLinkProfessionalDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleLinkProfessional} disabled={loading || !selectedProfessional}>
                            {loading ? 'Vinculando...' : 'Vincular'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {assignedProfessionals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Data de Vinculação</TableHead>
                        <TableHead>Status</TableHead>
                        {userProfile?.employee_role && ['director', 'coordinator_madre', 'coordinator_floresta'].includes(userProfile.employee_role) && (
                          <TableHead>Ações</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedProfessionals.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.profiles?.name || 'Nome não encontrado'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {assignment.profiles?.employee_role || 'Função não definida'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(assignment.assigned_at)}</TableCell>
                          <TableCell>
                            <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
                              {assignment.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          {userProfile?.employee_role && ['director', 'coordinator_madre', 'coordinator_floresta'].includes(userProfile.employee_role) && (
                            <TableCell>
                              {assignment.is_active && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveProfessional(assignment.id)}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Remover
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum profissional vinculado a este cliente.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <ClientPaymentManager 
                clientId={client.id} 
                clientName={client.name}
                userProfile={userProfile}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <ServiceHistory clientId={client.id} />
            </TabsContent>

            <TabsContent value="contracts" className="mt-6">
              <ContractGenerator client={client} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleScheduleAppointment()}>
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Novo Atendimento
            </Button>
            {isCoordinatorOrDirector() && (
              <>
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Dados
                </Button>
                <Button 
                  onClick={() => {
                    setIsAssignDialogOpen(true);
                    setSelectedEmployees(['']); // Reset
                    loadAvailableEmployees();
                    loadCurrentAssignments();
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Vincular Profissional
                </Button>
                <Button variant="outline" onClick={() => handleGenerateReport()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
                {client.is_active ? (
                  <Button variant="destructive" size="sm" onClick={() => handleDeactivateClient()}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Desativar Cliente
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={() => handleDeactivateClient()}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reativar Cliente
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Vincular Profissional */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vincular Profissional ao Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Profissionais Já Vinculados */}
            {currentAssignments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Profissionais Vinculados:</h4>
                <div className="space-y-2">
                  {currentAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                      <span>{assignment.profiles?.name} - {assignment.profiles?.employee_role}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveAssignment(assignment.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adicionar Novos Profissionais */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Selecionar Profissionais:</Label>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={addEmployeeField}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              
              {selectedEmployees.map((selectedEmployee, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select 
                    value={selectedEmployee} 
                    onValueChange={(value) => updateEmployeeSelection(index, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Escolha um profissional" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      {availableEmployees
                        .filter(emp => {
                          // Não mostrar se já está vinculado
                          const isAlreadyAssigned = currentAssignments.some((a: any) => a.employee_id === emp.user_id);
                          // Não mostrar se já foi selecionado em outro campo
                          const isAlreadySelected = selectedEmployees.some((selEmp, selIndex) => 
                            selIndex !== index && selEmp === emp.user_id
                          );
                          return !isAlreadyAssigned && !isAlreadySelected;
                        })
                        .map((employee: any) => (
                        <SelectItem key={employee.user_id} value={employee.user_id}>
                          {employee.name} - {employee.employee_role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedEmployees.length > 1 && (
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeEmployeeField(index)}
                      className="px-2"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAssignDialogOpen(false);
                setSelectedEmployees(['']); // Reset
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAssignProfessional} disabled={!selectedEmployees.some(emp => emp && emp.trim() !== '')}>
              Vincular Selecionados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}