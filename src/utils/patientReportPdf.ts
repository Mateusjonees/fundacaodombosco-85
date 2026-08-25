import jsPDF from 'jspdf';
import { formatDateBR, formatDateTimeBR, formatNowBR } from '@/lib/utils';

// Geração nativa (texto vetorial) do relatório do paciente.
// Evita html2canvas: nada de letras cortadas entre páginas e texto sempre nítido.

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE = 5;

export interface PatientReportData {
  client: any;
  attendanceRecords?: any[];
  employeeReports?: any[];
  medicalRecords?: any[];
  neuroTestResults?: any[];
  paymentRecords?: any[];
  prescriptions?: any[];
  clientNotes?: any[];
  scheduleHistory?: any[];
  laudos?: any[];
  logoDataUrl?: string | null;
}

const brl = (v: number) => `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;

const fmtDate = (d?: string) => {
  if (!d) return 'Não informado';
  const out = formatDateBR(d);
  return out === '-' ? 'Não informado' : out;
};

const fmtDateTime = (d?: string) => formatDateTimeBR(d);

const unitLabel = (u?: string) =>
  u === 'madre' ? 'MADRE' : u === 'floresta' ? 'Floresta' : u === 'atendimento_floresta' ? 'Atendimento Floresta' : u || 'Não informado';

const clean = (v: any) => {
  if (v === null || v === undefined || v === '') return 'Não informado';
  if (typeof v === 'string') return v.replace(/\s+\n/g, '\n').trim();
  return String(v);
};

/** Carrega a logo como dataURL para embutir no PDF. */
export const loadImageAsDataUrl = async (src: string): Promise<string | null> => {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export async function generatePatientReportPdf(data: PatientReportData): Promise<jsPDF> {
  const { client } = data;
  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.setFont('helvetica', 'normal');

  let y = MARGIN;

  const ensure = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN - 8) {
      pdf.addPage();
      y = MARGIN;
    }
  };

  const sectionTitle = (title: string) => {
    ensure(16);
    y += 3;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(17, 24, 39);
    pdf.text(title.toUpperCase(), MARGIN, y);
    y += 2;
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 5;
  };

  const subTitle = (title: string, right?: string) => {
    ensure(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(31, 41, 55);
    pdf.text(title, MARGIN + 2, y);
    if (right) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      const lines = pdf.splitTextToSize(right, CONTENT_W / 2);
      pdf.text(lines, PAGE_W - MARGIN - 2, y, { align: 'right' });
      y += Math.max(0, (lines.length - 1) * 4);
    }
    y += 5;
  };

  /** Campo rótulo + valor com quebra automática de linha. */
  const field = (label: string, value: any, width = CONTENT_W) => {
    const text = clean(value);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    const labelW = pdf.getTextWidth(`${label}: `);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const lines = pdf.splitTextToSize(text, width - labelW - 2);
    ensure(lines.length * LINE + 2);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`${label}:`, MARGIN + 2, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(17, 24, 39);
    pdf.text(lines, MARGIN + 2 + labelW, y);
    y += lines.length * LINE;
  };

  /** Bloco de texto longo com rótulo acima. */
  const block = (label: string, value: any) => {
    const text = clean(value);
    pdf.setFontSize(9);
    const lines = pdf.splitTextToSize(text, CONTENT_W - 6);
    ensure(lines.length * LINE + 9);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`${label}:`, MARGIN + 2, y);
    y += 4.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(17, 24, 39);
    pdf.text(lines, MARGIN + 3, y);
    y += lines.length * LINE + 2;
  };

  const divider = () => {
    ensure(6);
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN + 2, y, PAGE_W - MARGIN - 2, y);
    y += 4;
  };

  const empty = (msg: string) => {
    ensure(7);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text(msg, MARGIN + 2, y);
    y += 6;
  };

  // ---------- Cabeçalho ----------
  if (data.logoDataUrl) {
    try {
      pdf.addImage(data.logoDataUrl, 'PNG', PAGE_W / 2 - 17, y, 34, 20, undefined, 'FAST');
      y += 24;
    } catch {
      /* logo opcional */
    }
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(17, 24, 39);
  pdf.text('RELATÓRIO DO PACIENTE', PAGE_W / 2, y, { align: 'center' });
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(107, 114, 128);
  pdf.text(
    `Gerado em ${formatNowBR(true)}`,
    PAGE_W / 2,
    y,
    { align: 'center' }
  );
  y += 6;

  // ---------- Dados pessoais ----------
  sectionTitle('Dados Pessoais');
  field('Nome Completo', client.name);
  field('CPF', client.cpf);
  const birth = client.birth_date
    ? `${fmtDate(client.birth_date)} (${Math.floor(
        (Date.now() - new Date(client.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      )} anos)`
    : 'Não informado';
  field('Data de Nascimento', birth);
  field('Telefone', client.phone);
  field('Email', client.email);
  field('Unidade', unitLabel(client.unit));
  field('Endereço', client.address);

  if (client.responsible_name || client.responsible_phone) {
    sectionTitle('Responsável');
    field('Nome do Responsável', client.responsible_name);
    field('Telefone do Responsável', client.responsible_phone);
  }

  // ---------- Informações clínicas ----------
  sectionTitle('Informações Clínicas');
  block('Diagnóstico', client.diagnosis);
  block('Queixa Neuropsicológica', client.neuropsych_complaint);
  block('Sintomas Atuais', client.current_symptoms);
  block('Histórico Médico', client.medical_history);

  sectionTitle('Tratamento');
  block('Expectativas do Tratamento', client.treatment_expectations);
  block('Progresso do Tratamento', client.treatment_progress);
  block('Observações Clínicas', client.clinical_observations);

  sectionTitle('Informações Administrativas');
  field('Status', client.is_active ? 'Ativo' : 'Inativo');
  field('Data de Cadastro', fmtDate(client.created_at));

  // ---------- Financeiro ----------
  const payments = data.paymentRecords || [];
  if (payments.length > 0) {
    sectionTitle('Histórico Financeiro');
    const total = payments.reduce((s, p) => s + (p.total_amount || 0), 0);
    const paid = payments.reduce((s, p) => s + (p.amount_paid || 0), 0);
    const remaining = payments.reduce((s, p) => s + (p.amount_remaining || 0), 0);
    field('Total Cobrado', brl(total));
    field('Total Pago', brl(paid));
    field('Total Pendente', brl(remaining));
    y += 2;
    payments.forEach((p) => {
      subTitle(clean(p.description || 'Pagamento'), fmtDate(p.created_at));
      field('Valor', `${brl(p.total_amount || 0)} — pago ${brl(p.amount_paid || 0)} / pendente ${brl(p.amount_remaining || 0)}`);
      field('Status', clean(p.status));
      if (p.payment_method) field('Forma de Pagamento', p.payment_method);
      if (p.installments_total) field('Parcelas', `${p.installments_paid || 0} de ${p.installments_total}`);
      if (p.notes) block('Observações', p.notes);
      divider();
    });
  }

  // ---------- Atendimentos ----------
  const attendances = data.attendanceRecords || [];
  const reports = data.employeeReports || [];
  if (attendances.length > 0 || reports.length > 0) {
    sectionTitle('Histórico de Atendimentos');
    attendances.forEach((r) => {
      subTitle(clean(r.attendance_type || 'Atendimento'), `${fmtDate(r.start_time)} • ${clean(r.professional_name)}`);
      field('Período', `${fmtDateTime(r.start_time)} até ${fmtDateTime(r.end_time)}`);
      if (r.session_duration) field('Duração', `${r.session_duration} minutos`);
      if (r.amount_charged) field('Valor Cobrado', brl(r.amount_charged));
      if (r.session_notes) block('Anotações da Sessão', r.session_notes);
      if (r.observations) block('Observações', r.observations);
      if (r.techniques_used) block('Técnicas Utilizadas', r.techniques_used);
      if (r.patient_response) block('Resposta do Paciente', r.patient_response);
      if (r.next_session_plan) block('Plano para Próxima Sessão', r.next_session_plan);
      divider();
    });
    reports.forEach((r) => {
      subTitle(clean(r.session_type || 'Sessão'), `${fmtDate(r.session_date)} • ${clean(r.profiles?.name || 'Profissional')}`);
      if (r.session_duration) field('Duração', `${r.session_duration} minutos`);
      if (r.session_objectives) block('Objetivos', r.session_objectives);
      if (r.professional_notes) block('Anotações do Profissional', r.professional_notes);
      if (r.techniques_used) block('Técnicas Utilizadas', r.techniques_used);
      if (r.patient_response) block('Resposta do Paciente', r.patient_response);
      if (r.next_session_plan) block('Plano para Próxima Sessão', r.next_session_plan);
      const ratings = [
        r.quality_rating ? `Qualidade ${r.quality_rating}/5` : null,
        r.effort_rating ? `Esforço ${r.effort_rating}/5` : null,
        r.patient_cooperation ? `Cooperação ${r.patient_cooperation}/5` : null,
        r.goal_achievement ? `Metas ${r.goal_achievement}/5` : null
      ].filter(Boolean);
      if (ratings.length) field('Avaliações', ratings.join(' | '));
      divider();
    });
  }

  // ---------- Prontuários ----------
  const records = data.medicalRecords || [];
  if (records.length > 0) {
    sectionTitle('Prontuários');
    records.forEach((m) => {
      subTitle(clean(m.session_type || 'Registro'), `${fmtDate(m.session_date)} • ${clean(m.profiles?.name || 'Profissional')}`);
      if (m.session_duration) field('Duração', `${m.session_duration} minutos`);
      if (m.symptoms) block('Sintomas', m.symptoms);
      if (m.progress_notes) block('Evolução', m.progress_notes);
      if (m.treatment_plan) block('Plano de Tratamento', m.treatment_plan);
      if (m.next_appointment_notes) block('Próximo Atendimento', m.next_appointment_notes);
      divider();
    });
  }

  // ---------- Testes neuropsicológicos ----------
  const neuro = data.neuroTestResults || [];
  if (neuro.length > 0) {
    sectionTitle('Testes Neuropsicológicos');
    neuro.forEach((t) => {
      subTitle(clean(t.test_name || t.test_id || 'Teste'), `${fmtDate(t.applied_at)} • ${clean(t.applier_name || 'Profissional')}`);
      if (t.interpretation) block('Interpretação', t.interpretation);
      if (t.notes) block('Observações', t.notes);
      divider();
    });
  }

  // ---------- Anotações / anamneses ----------
  const notes = data.clientNotes || [];
  if (notes.length > 0) {
    sectionTitle('Anotações e Anamneses');
    notes.forEach((n) => {
      subTitle(clean(n.note_type || 'Anotação'), `${fmtDate(n.created_at)} • ${clean(n.professional_name)}`);
      block('Conteúdo', n.note_text);
      divider();
    });
  }

  // ---------- Receituários ----------
  const prescriptions = data.prescriptions || [];
  if (prescriptions.length > 0) {
    sectionTitle('Receituários');
    prescriptions.forEach((p) => {
      subTitle('Receita', `${fmtDate(p.prescription_date)} • ${clean(p.professional_name)}`);
      if (p.diagnosis) field('Diagnóstico', p.diagnosis);
      if (Array.isArray(p.medications) && p.medications.length > 0) {
        p.medications.forEach((m: any) => {
          field('Medicamento', [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' • '));
        });
      }
      if (p.general_instructions) block('Orientações', p.general_instructions);
      if (p.follow_up_notes) block('Acompanhamento', p.follow_up_notes);
      divider();
    });
  }

  // ---------- Laudos ----------
  const laudos = data.laudos || [];
  if (laudos.length > 0) {
    sectionTitle('Laudos e Devolutivas');
    laudos.forEach((l) => {
      subTitle(clean(l.title || 'Laudo'), `${fmtDate(l.laudo_date)} • ${clean(l.professional_name)}`);
      if (l.laudo_type) field('Tipo', l.laudo_type);
      if (l.status) field('Status', l.status);
      if (l.description) block('Descrição', l.description);
      divider();
    });
  }

  // ---------- Agenda ----------
  const schedules = data.scheduleHistory || [];
  if (schedules.length > 0) {
    sectionTitle('Histórico de Agendamentos');
    schedules.forEach((s) => {
      subTitle(clean(s.title || 'Agendamento'), `${fmtDateTime(s.start_time)} • ${clean(s.professional_name)}`);
      field('Status', clean(s.status));
      if (s.notes) block('Observações', s.notes);
      divider();
    });
  }

  if (
    payments.length === 0 &&
    attendances.length === 0 &&
    reports.length === 0 &&
    records.length === 0 &&
    neuro.length === 0 &&
    notes.length === 0 &&
    prescriptions.length === 0 &&
    laudos.length === 0 &&
    schedules.length === 0
  ) {
    empty('Nenhum histórico clínico ou administrativo registrado.');
  }

  // ---------- Rodapé ----------
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`${clean(client.name)}`, MARGIN, PAGE_H - 8);
    pdf.text(`Página ${i} de ${pages} — Fundação Dom Bosco`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
  }

  return pdf;
}
