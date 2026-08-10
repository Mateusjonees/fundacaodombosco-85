import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileSignature, Printer, Download, Eye, Trash2, Plus } from 'lucide-react';
import { formatDateBR, getTodayLocalISODate } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatProfessionalCredentials } from '@/utils/professionalCredentials';
import {
  useClinicalDocuments,
  useCreateClinicalDocument,
  useDeleteClinicalDocument,
  ClinicalDocument,
} from '@/hooks/useClinicalDocuments';
import {
  CLINICAL_DOC_LABELS,
  ClinicalDocType,
  downloadClinicalDocPdf,
  printClinicalDocPdf,
} from '@/utils/clinicalDocPdf';

interface ClinicalDocumentManagerProps {
  client: { id: string; name: string; cpf?: string; birth_date?: string };
}

const TYPE_BADGE: Record<string, string> = {
  encaminhamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  exame: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  atestado: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  comparecimento: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

// Textos padrão por tipo de documento
const buildTemplate = (
  type: ClinicalDocType,
  clientName: string,
  fields: { destino: string; motivo: string; dias: string; horaInicio: string; horaFim: string; data: string }
) => {
  const dataBR = formatDateBR(fields.data);
  switch (type) {
    case 'encaminhamento':
      return `Encaminho o(a) paciente ${clientName} para ${fields.destino || '[especialidade/serviço]'}.\n\nMotivo: ${fields.motivo || '[descrever motivo do encaminhamento]'}\n\nColoco-me à disposição para as informações que se fizerem necessárias.`;
    case 'exame':
      return `Solicito para o(a) paciente ${clientName} a realização do(s) seguinte(s) exame(s)/avaliação(ões):\n\n- ${fields.destino || '[exame solicitado]'}\n\nIndicação clínica: ${fields.motivo || '[hipótese diagnóstica / justificativa]'}`;
    case 'atestado':
      return `Atesto, para os devidos fins, que o(a) paciente ${clientName} esteve sob meus cuidados profissionais em ${dataBR}, necessitando de afastamento de suas atividades por ${fields.dias || '[__]'} dia(s) a partir desta data.\n\n${fields.motivo ? `Observação: ${fields.motivo}` : ''}`;
    case 'comparecimento':
      return `Declaro, para os devidos fins, que o(a) paciente ${clientName} compareceu a atendimento nesta instituição no dia ${dataBR}, no período das ${fields.horaInicio || '[__:__]'} às ${fields.horaFim || '[__:__]'}.\n\n${fields.motivo ? `Observação: ${fields.motivo}` : ''}`;
    default:
      return '';
  }
};

export default function ClinicalDocumentManager({ client }: ClinicalDocumentManagerProps) {
  const { user } = useAuth();
  const { profile } = useCurrentUser();
  const { data: documents = [], isLoading } = useClinicalDocuments(client.id);
  const createDoc = useCreateClinicalDocument();
  const deleteDoc = useDeleteClinicalDocument();

  const [open, setOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<ClinicalDocument | null>(null);
  const [docType, setDocType] = useState<ClinicalDocType>('encaminhamento');
  const [docDate, setDocDate] = useState(getTodayLocalISODate());
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [dias, setDias] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [content, setContent] = useState('');
  const [touchedContent, setTouchedContent] = useState(false);

  const professionalName = (profile?.name || user?.email || '').toUpperCase();
  const professionalCredentials = formatProfessionalCredentials(profile as any);

  const previewContent = useMemo(
    () =>
      touchedContent
        ? content
        : buildTemplate(docType, client.name, { destino, motivo, dias, horaInicio, horaFim, data: docDate }),
    [touchedContent, content, docType, client.name, destino, motivo, dias, horaInicio, horaFim, docDate]
  );

  const resetForm = () => {
    setDocType('encaminhamento');
    setDocDate(getTodayLocalISODate());
    setDestino('');
    setMotivo('');
    setDias('');
    setHoraInicio('');
    setHoraFim('');
    setContent('');
    setTouchedContent(false);
  };

  const handleEmit = async (action: 'print' | 'download') => {
    if (!user?.id) return;
    const payload = {
      client_id: client.id,
      employee_id: user.id,
      doc_type: docType,
      title: CLINICAL_DOC_LABELS[docType],
      content: previewContent,
      doc_date: docDate,
      metadata: { destino, motivo, dias, hora_inicio: horaInicio, hora_fim: horaFim },
    };

    await createDoc.mutateAsync(payload);

    const pdfData = { doc_type: docType, title: payload.title, content: previewContent, doc_date: docDate };
    if (action === 'print') {
      await printClinicalDocPdf(pdfData, client, professionalName, professionalCredentials);
    } else {
      await downloadClinicalDocPdf(pdfData, client, professionalName, professionalCredentials);
    }

    setOpen(false);
    resetForm();
  };

  const emitExisting = async (doc: ClinicalDocument, action: 'print' | 'download') => {
    const name = (doc.employee?.name || professionalName).toUpperCase();
    const creds = formatProfessionalCredentials(doc.employee as any) || professionalCredentials;
    const pdfData = { doc_type: doc.doc_type, title: doc.title, content: doc.content, doc_date: doc.doc_date };
    if (action === 'print') await printClinicalDocPdf(pdfData, client, name, creds);
    else await downloadClinicalDocPdf(pdfData, client, name, creds);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <FileSignature className="h-4 w-4" />
            Documentos emitidos
            {documents.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{documents.length}</Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Gerar documento
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : documents.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum documento emitido. Gere encaminhamento, exame, atestado ou declaração de comparecimento.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] border-0 ${TYPE_BADGE[doc.doc_type] || ''}`}>
                      {CLINICAL_DOC_LABELS[doc.doc_type as ClinicalDocType] || doc.doc_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDateBR(doc.doc_date)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {doc.employee?.name || 'Profissional'}
                    {formatProfessionalCredentials(doc.employee as any)
                      ? ` — ${formatProfessionalCredentials(doc.employee as any)}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewDoc(doc)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => emitExisting(doc, 'print')}>
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => emitExisting(doc, 'download')}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {doc.employee_id === user?.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteDoc.mutate({ id: doc.id, client_id: client.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Diálogo de emissão */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar documento</DialogTitle>
            <DialogDescription>
              Emitido por {professionalName}
              {professionalCredentials ? ` — ${professionalCredentials}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={docType}
                  onValueChange={(v) => { setDocType(v as ClinicalDocType); setTouchedContent(false); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLINICAL_DOC_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
              </div>
            </div>

            {(docType === 'encaminhamento' || docType === 'exame') && (
              <div className="space-y-1.5">
                <Label>{docType === 'encaminhamento' ? 'Encaminhar para' : 'Exame solicitado'}</Label>
                <Input
                  value={destino}
                  onChange={(e) => { setDestino(e.target.value); setTouchedContent(false); }}
                  placeholder={docType === 'encaminhamento' ? 'Ex.: Neuropediatria' : 'Ex.: Avaliação audiológica'}
                />
              </div>
            )}

            {docType === 'atestado' && (
              <div className="space-y-1.5">
                <Label>Dias de afastamento</Label>
                <Input
                  type="number"
                  min={0}
                  value={dias}
                  onChange={(e) => { setDias(e.target.value); setTouchedContent(false); }}
                />
              </div>
            )}

            {docType === 'comparecimento' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hora início</Label>
                  <Input type="time" value={horaInicio} onChange={(e) => { setHoraInicio(e.target.value); setTouchedContent(false); }} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora fim</Label>
                  <Input type="time" value={horaFim} onChange={(e) => { setHoraFim(e.target.value); setTouchedContent(false); }} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Observação / motivo</Label>
              <Input
                value={motivo}
                onChange={(e) => { setMotivo(e.target.value); setTouchedContent(false); }}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Texto do documento</Label>
              <Textarea
                rows={8}
                value={previewContent}
                onChange={(e) => { setContent(e.target.value); setTouchedContent(true); }}
              />
              <p className="text-[11px] text-muted-foreground">
                O texto é gerado automaticamente e pode ser editado antes de emitir.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="secondary" disabled={createDoc.isPending} onClick={() => handleEmit('download')}>
              <Download className="h-4 w-4 mr-1.5" /> Salvar e baixar
            </Button>
            <Button disabled={createDoc.isPending} onClick={() => handleEmit('print')}>
              <Printer className="h-4 w-4 mr-1.5" /> Salvar e imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visualização */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewDoc ? CLINICAL_DOC_LABELS[viewDoc.doc_type as ClinicalDocType] || viewDoc.doc_type : ''}
            </DialogTitle>
            <DialogDescription>
              {viewDoc ? `${formatDateBR(viewDoc.doc_date)} — ${viewDoc.employee?.name || ''}` : ''}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-3 leading-relaxed">
            {viewDoc?.content}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => viewDoc && emitExisting(viewDoc, 'download')}>
              <Download className="h-4 w-4 mr-1.5" /> Baixar
            </Button>
            <Button onClick={() => viewDoc && emitExisting(viewDoc, 'print')}>
              <Printer className="h-4 w-4 mr-1.5" /> Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
