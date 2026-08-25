import jsPDF from 'jspdf';
import prescriptionTimbrado from '@/assets/prescription-timbrado-full.jpg';
import fundacaoLogo from '@/assets/fundacao-dom-bosco-saude-logo.png';
import { formatDateBR } from '@/lib/utils';

export type ClinicalDocType = 'encaminhamento' | 'exame' | 'atestado' | 'comparecimento';

export const CLINICAL_DOC_LABELS: Record<ClinicalDocType, string> = {
  encaminhamento: 'Encaminhamento',
  exame: 'Solicitação de Exame',
  atestado: 'Atestado',
  comparecimento: 'Declaração de Comparecimento',
};

export interface ClinicalDocPdfData {
  doc_type: string;
  title?: string | null;
  content: string;
  doc_date: string;
}

export interface ClinicalDocClient {
  name: string;
  cpf?: string | null;
  birth_date?: string | null;
}

// Carrega imagem como base64 para embutir no PDF
const loadImageAsBase64 = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = src;
  });

export const generateClinicalDocPdf = async (
  docData: ClinicalDocPdfData,
  client: ClinicalDocClient,
  professionalName: string,
  professionalCredentials?: string
): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let timbradoBase64: string | null = null;
  let logoBase64: string | null = null;
  try {
    timbradoBase64 = await loadImageAsBase64(prescriptionTimbrado);
    logoBase64 = await loadImageAsBase64(fundacaoLogo);
  } catch (e) {
    console.warn('Erro ao carregar imagens do documento:', e);
  }

  const drawBackground = () => {
    if (timbradoBase64) {
      doc.addImage(timbradoBase64, 'JPEG', 5, 5, pageWidth - 10, pageHeight - 10);
    }
  };

  drawBackground();

  let y = 20;
  if (logoBase64) {
    const logoW = 35;
    const logoH = 28;
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoW) / 2, 5, logoW, logoH);
    y = 42;
  }

  // Máscara branca atrás do título para legibilidade
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y - 2, contentWidth, 12, 'F');

  const label = CLINICAL_DOC_LABELS[docData.doc_type as ClinicalDocType] || docData.doc_type;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text((docData.title?.trim() || label).toUpperCase(), pageWidth / 2, y + 6, { align: 'center' });
  y += 18;

  // Dados do paciente
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', margin, y);
  doc.setFont('helvetica', 'normal');
  const nameLines: string[] = doc.splitTextToSize(client.name, contentWidth - 22);
  nameLines.forEach((line, i) => doc.text(line, margin + 22, y + i * 6));
  y += nameLines.length * 6;

  if (client.cpf) {
    doc.setFont('helvetica', 'bold');
    doc.text('CPF:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(client.cpf, margin + 12, y);
    y += 6;
  }
  if (client.birth_date) {
    doc.setFont('helvetica', 'bold');
    doc.text('Data de Nascimento:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateBR(client.birth_date), margin + 42, y);
    y += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Data:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateBR(docData.doc_date), margin + 14, y);
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Corpo do documento
  const maxY = pageHeight - 55;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const lines: string[] = doc.splitTextToSize(docData.content || '', contentWidth);
  lines.forEach((line) => {
    if (y > maxY) {
      doc.addPage();
      drawBackground();
      y = 45;
    }
    doc.text(line, margin, y);
    y += 6;
  });

  // Assinatura
  y = Math.max(y + 20, pageHeight - 45);
  if (y > pageHeight - 30) {
    doc.addPage();
    drawBackground();
    y = pageHeight - 45;
  }
  doc.setDrawColor(0, 0, 0);
  const lineStart = (pageWidth - 70) / 2;
  doc.line(lineStart, y, lineStart + 70, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(professionalName, pageWidth / 2, y, { align: 'center' });
  if (professionalCredentials) {
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(professionalCredentials, pageWidth / 2, y, { align: 'center' });
  }

  return doc;
};

export const downloadClinicalDocPdf = async (
  docData: ClinicalDocPdfData,
  client: ClinicalDocClient,
  professionalName: string,
  professionalCredentials?: string
) => {
  const pdf = await generateClinicalDocPdf(docData, client, professionalName, professionalCredentials);
  pdf.save(`${docData.doc_type}_${client.name.replace(/\s+/g, '_')}_${docData.doc_date}.pdf`);
};

export const printClinicalDocPdf = async (
  docData: ClinicalDocPdfData,
  client: ClinicalDocClient,
  professionalName: string,
  professionalCredentials?: string
) => {
  const pdf = await generateClinicalDocPdf(docData, client, professionalName, professionalCredentials);
  await printPdfDoc(pdf, `${docData.doc_type}_${client.name.replace(/\s+/g, '_')}_${docData.doc_date}.pdf`);
};

