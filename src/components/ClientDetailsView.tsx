import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/FileUpload';
import { ContractGenerator } from '@/components/ContractGenerator';
import { 
  Calendar, 
  Edit, 
  Copy, 
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
  X,
  UserPlus
} from 'lucide-react';

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
  profiles?: { name: string; employee_role: string };
  assigned_at: string;
}

interface Employee {
  user_id: string;
  name: string;
  employee_role: string;
}

interface Appointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  description?: string;
  profiles?: { name: string };
}

interface ClientDetailsViewProps {
  client: Client;
  onEdit: () => void;
  onClose: () => void;
}

export default function ClientDetailsView({ client, onEdit, onClose }: ClientDetailsViewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [assignedProfessionals, setAssignedProfessionals] = useState<AssignedProfessional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [linkProfessionalDialogOpen, setLinkProfessionalDialogOpen] = useState(false);
  const [addAppointmentDialogOpen, setAddAppointmentDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClientData();
  }, [client.id]);

  const loadClientData = async () => {
    await Promise.all([
      loadNotes(),
      loadDocuments(),
      loadAssignedProfessionals(),
      loadAppointments(),
      loadEmployees()
    ]);
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
      // Simplificar a query para evitar erros de relacionamento
      const { data: assignments, error } = await supabase
        .from('client_assignments')
        .select('id, assigned_at, employee_id')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Buscar os dados dos profissionais separadamente
      if (assignments && assignments.length > 0) {
        const employeeIds = assignments.map(a => a.employee_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name, employee_role')
          .in('user_id', employeeIds);

        if (profilesError) throw profilesError;

        const assignedWithProfiles = assignments.map(assignment => ({
          id: assignment.id,
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
    // Navigate to schedule page with client pre-selected
    navigate(`/schedule?client=${client.id}&name=${encodeURIComponent(client.name)}`);
  };

  const loadAppointments = async () => {
    try {
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select(`
          id,
          title,
          start_time,
          end_time,
          status,
          description,
          created_by
        `)
        .eq('client_id', client.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos criadores dos agendamentos
      if (schedules && schedules.length > 0) {
        const creatorIds = [...new Set(schedules.map(s => s.created_by))].filter(id => id);
        let profiles: any[] = [];
        
        if (creatorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, name')
            .in('user_id', creatorIds);
          profiles = profilesData || [];
        }

        const appointmentsWithProfiles = schedules.map(schedule => ({
          ...schedule,
          profiles: profiles.find(p => p.user_id === schedule.created_by) || { name: 'Sistema' }
        }));

        setAppointments(appointmentsWithProfiles);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
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

  const handleRemoveProfessionalLink = async (assignmentId: string) => {
    if (!confirm('Tem certeza que deseja remover este vínculo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('client_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vínculo removido com sucesso!",
      });

      loadAssignedProfessionals();
    } catch (error) {
      console.error('Error removing professional link:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o vínculo.",
      });
    }
  };

  const handleLinkMultipleProfessionals = async () => {
    if (selectedProfessionals.length === 0) return;

    setLoading(true);
    try {
      const assignments = selectedProfessionals.map(professionalId => ({
        client_id: client.id,
        employee_id: professionalId,
        assigned_by: user?.id
      }));

      const { error } = await supabase
        .from('client_assignments')
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedProfessionals.length} profissional(is) vinculado(s) com sucesso!`,
      });

      setSelectedProfessionals([]);
      setMultiSelectMode(false);
      setLinkProfessionalDialogOpen(false);
      loadAssignedProfessionals();
    } catch (error) {
      console.error('Error linking professionals:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível vincular os profissionais.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProfessionalSelection = (professionalId: string) => {
    setSelectedProfessionals(prev => 
      prev.includes(professionalId)
        ? prev.filter(id => id !== professionalId)
        : [...prev, professionalId]
    );
  };

  const getAvailableEmployees = () => {
    const assignedIds = assignedProfessionals.map(ap => ap.profiles?.name ? 
      employees.find(e => e.name === ap.profiles?.name)?.user_id : null
    ).filter(Boolean);
    
    return employees.filter(emp => !assignedIds.includes(emp.user_id));
  };

  const handleLinkProfessional = async () => {
    if (!selectedProfessional) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_assignments')
        .insert({
          client_id: client.id,
          employee_id: selectedProfessional,
          assigned_by: user?.id
        });

      if (error) throw error;

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

  const handleDuplicateClient = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          name: `${client.name} (Cópia)`,
          cpf: '',
          birth_date: client.birth_date,
          email: '',
          phone: client.phone,
          responsible_name: client.responsible_name,
          responsible_phone: client.responsible_phone,
          unit: client.unit,
          address: client.address,
          diagnosis: client.diagnosis,
          medical_history: client.medical_history,
          neuropsych_complaint: client.neuropsych_complaint,
          treatment_expectations: client.treatment_expectations,
          clinical_observations: client.clinical_observations,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente duplicado com sucesso!",
      });
    } catch (error) {
      console.error('Error duplicating client:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível duplicar o cliente.",
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

  const handleToggleClientStatus = async () => {
    const newStatus = !client.is_active;
    const action = newStatus ? 'ativar' : 'inativar';
    
    if (!confirm(`Tem certeza que deseja ${action} este cliente?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: newStatus })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: newStatus ? "Cliente Ativado" : "Cliente Inativado",
        description: `O cliente foi ${newStatus ? 'ativado' : 'inativado'} com sucesso.`,
      });
      
      // Update local client state
      client.is_active = newStatus;
      
      if (!newStatus) {
        onClose();
      }
    } catch (error) {
      console.error(`Error ${action}ing client:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível ${action} o cliente.`,
      });
    }
  };

  const handleActivateClient = async () => {
    await handleToggleClientStatus();
  };

  const handleUploadDocument = () => {
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `client-documents/${client.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

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

      if (dbError) throw dbError;

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
        description: "Não foi possível enviar o documento.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToHistory = () => {
    setAddAppointmentDialogOpen(true);
  };

  const handleAddAppointment = async () => {
    if (!appointmentData.title || !appointmentData.date || !appointmentData.time) return;

    setLoading(true);
    try {
      const startTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
      const endTime = new Date(startTime.getTime() + parseInt(appointmentData.duration) * 60000);

      const { error } = await supabase
        .from('schedules')
        .insert({
          client_id: client.id,
          title: appointmentData.title,
          description: appointmentData.description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'completed',
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Atendimento adicionado ao histórico!",
      });

      setAppointmentData({
        title: '',
        date: '',
        time: '',
        duration: '60',
        description: ''
      });
      setAddAppointmentDialogOpen(false);
      loadAppointments();
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o atendimento.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'madre': return 'Clínica Social (Madre)';
      case 'floresta': return 'Neuro (Floresta)';
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
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Dados
          </Button>
          <Button 
            variant="outline" 
            onClick={handleScheduleAppointment}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Atendimento
          </Button>
          {!client.is_active && (
            <Button 
              variant="default" 
              onClick={handleActivateClient}
            >
              Ativar Cliente
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleToggleClientStatus}
          >
            {client.is_active ? 'Inativar' : 'Ativar'} Cliente
          </Button>
          <Button variant="outline" onClick={onClose}>
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profissionais Vinculados
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleLinkProfessionals}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Vincular
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assignedProfessionals.length > 0 ? (
              <div className="space-y-3">
                {assignedProfessionals.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{assignment.profiles.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.profiles.employee_role}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Vinculado em {formatDate(assignment.assigned_at)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveProfessionalLink(assignment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  {assignedProfessionals.length} profissional{assignedProfessionals.length > 1 ? 'is' : ''} vinculado{assignedProfessionals.length > 1 ? 's' : ''}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">Nenhum profissional vinculado</p>
                <Button 
                  size="sm" 
                  onClick={handleLinkProfessionals}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Vincular Primeiro Profissional
                </Button>
              </div>
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Anexar Documentos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <FileUpload 
                    onFileSelect={(files) => setSelectedFile(files[0])}
                    maxFiles={1}
                    acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']}
                  />
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

      {/* Histórico de Atendimentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Atendimentos
            </CardTitle>
            <Dialog open={addAppointmentDialogOpen} onOpenChange={setAddAppointmentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar ao Histórico
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Atendimento ao Histórico</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentTitle">Título do Atendimento</Label>
                    <Input
                      id="appointmentTitle"
                      value={appointmentData.title}
                      onChange={(e) => setAppointmentData({...appointmentData, title: e.target.value})}
                      placeholder="Ex: Sessão de Neuropsicologia"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appointmentDate">Data</Label>
                      <Input
                        id="appointmentDate"
                        type="date"
                        value={appointmentData.date}
                        onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appointmentTime">Horário</Label>
                      <Input
                        id="appointmentTime"
                        type="time"
                        value={appointmentData.time}
                        onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Select value={appointmentData.duration} onValueChange={(value) => setAppointmentData({...appointmentData, duration: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                        <SelectItem value="90">90 minutos</SelectItem>
                        <SelectItem value="120">120 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDescription">Observações</Label>
                    <Textarea
                      id="appointmentDescription"
                      value={appointmentData.description}
                      onChange={(e) => setAppointmentData({...appointmentData, description: e.target.value})}
                      placeholder="Descreva o que foi realizado na sessão..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddAppointmentDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddAppointment} disabled={loading || !appointmentData.title || !appointmentData.date || !appointmentData.time}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{appointment.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(appointment.start_time)} - {new Date(appointment.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {appointment.description && (
                      <div className="text-sm mt-1">{appointment.description}</div>
                    )}
                  </div>
                  <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                    {appointment.status === 'completed' ? 'Realizado' : appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum atendimento registrado.</p>
          )}
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
            <Dialog open={linkProfessionalDialogOpen} onOpenChange={setLinkProfessionalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Vínculos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Gerenciar Vínculos de Profissionais</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex gap-2 mb-4">
                    <Button 
                      size="sm"
                      variant={!multiSelectMode ? "default" : "outline"}
                      onClick={() => {
                        setMultiSelectMode(false);
                        setSelectedProfessionals([]);
                        setSelectedProfessional('');
                      }}
                    >
                      Vincular Um
                    </Button>
                    <Button 
                      size="sm"
                      variant={multiSelectMode ? "default" : "outline"}
                      onClick={() => {
                        setMultiSelectMode(true);
                        setSelectedProfessional('');
                        setSelectedProfessionals([]);
                      }}
                    >
                      Vincular Múltiplos
                    </Button>
                  </div>

                  {!multiSelectMode ? (
                    <div className="space-y-2">
                      <Label htmlFor="professional">Selecione o Profissional</Label>
                      <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um profissional" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableEmployees().map((employee) => (
                            <SelectItem key={employee.user_id} value={employee.user_id}>
                              {employee.name} - {employee.employee_role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Selecione os Profissionais (múltiplos)</Label>
                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                        {getAvailableEmployees().length > 0 ? (
                          <div className="space-y-2">
                            {getAvailableEmployees().map((employee) => (
                              <div 
                                key={employee.user_id} 
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                  selectedProfessionals.includes(employee.user_id) 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'hover:bg-gray-100'
                                }`}
                                onClick={() => toggleProfessionalSelection(employee.user_id)}
                              >
                                <div>
                                  <div className="font-medium">{employee.name}</div>
                                  <div className="text-sm opacity-70">{employee.employee_role}</div>
                                </div>
                                {selectedProfessionals.includes(employee.user_id) && (
                                  <Plus className="h-4 w-4" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Todos os profissionais já estão vinculados a este cliente.
                          </p>
                        )}
                      </div>
                      {selectedProfessionals.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedProfessionals.length} profissional(is) selecionado(s)
                        </p>
                      )}
                    </div>
                  )}

                  {assignedProfessionals.length > 0 && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium">Profissionais já vinculados:</Label>
                      <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                        {assignedProfessionals.map((assignment) => (
                          <div key={assignment.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{assignment.profiles.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveProfessionalLink(assignment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setLinkProfessionalDialogOpen(false);
                    setMultiSelectMode(false);
                    setSelectedProfessionals([]);
                    setSelectedProfessional('');
                  }}>
                    Cancelar
                  </Button>
                  {!multiSelectMode ? (
                    <Button onClick={handleLinkProfessional} disabled={loading || !selectedProfessional}>
                      {loading ? 'Vinculando...' : 'Vincular'}
                    </Button>
                  ) : (
                    <Button onClick={handleLinkMultipleProfessionals} disabled={loading || selectedProfessionals.length === 0}>
                      {loading ? 'Vinculando...' : `Vincular ${selectedProfessionals.length} Profissional(is)`}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Dados
            </Button>
            <Button variant="outline" onClick={() => handleDuplicateClient()}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar Cliente
            </Button>
            <Button variant="outline" onClick={() => handleGenerateReport()}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
            <ContractGenerator client={client} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}