import jsPDF from 'jspdf';
import { Medication, Prescription } from '@/hooks/usePrescriptions';
import prescriptionTimbrado from '@/assets/prescription-timbrado-full.jpg';
import fundacaoLogo from '@/assets/fundacao-dom-bosco-saude-logo.png';
import { formatDateBR } from '@/lib/utils';

interface Client {
  name: string;
  cpf?: string;
  birth_date?: string;
}

type PrescriptionPdfOptions = {
  // Margem de segurança interna para evitar corte em impressoras (padrão: 5mm)
  letterheadInsetMm?: number;
  // Offset vertical adicional para ajuste fino
  letterheadOffsetYmm?: number;
};

// Helper to load image as base64
const loadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = src;
  });
};

// Gera PDF com quadrado vazio para escrita manual (para impressão com matriz)
export const generateBlankPrescriptionPdf = async (): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Quadrado vazio centralizado para escrita manual
  const boxX = margin;
  const boxY = margin;
  const boxWidth = pageWidth - (margin * 2);
  const boxHeight = pageHeight - (margin * 2);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  return doc;
};

export const generatePrescriptionPdf = async (
  prescription: Prescription,
  client: Client,
  professionalName: string,
  professionalLicense?: string,
  options?: PrescriptionPdfOptions
): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const header = {
    logoWidth: 35,
    logoHeight: 28,
    logoY: 5,
    titleGapY: 6,
  };
  const headerTitleY = header.logoY + header.logoHeight + header.titleGapY;

  let yPosition = 20;

  // Full page letterhead - no margins
  let timbradoBase64: string | null = null;
  let logoBase64: string | null = null;

  const addLetterhead = () => {
    if (!timbradoBase64) return;
    // Área segura de impressão: inset de 5mm por padrão evita corte em impressoras
    const inset = options?.letterheadInsetMm ?? 5;
    const offsetY = options?.letterheadOffsetYmm ?? 0;
    const x = inset;
    const y = inset + offsetY;
    const w = pageWidth - inset * 2;
    const h = pageHeight - inset * 2;
    doc.addImage(timbradoBase64, 'JPEG', x, y, w, h);
  };

  const addLogoAndTitle = () => {
    if (!logoBase64) return;

    // Logo centralizado com título RECEITUÁRIO abaixo
    const logoX = (pageWidth - header.logoWidth) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, header.logoY, header.logoWidth, header.logoHeight);

    // Título RECEITUÁRIO centralizado logo abaixo da logo
    const titleText = 'RECEITUÁRIO';
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');

    // "Máscara" branca para evitar que elementos do timbrado passem por cima do texto
    const titleWidth = doc.getTextWidth(titleText);
    const titlePadX = 6;
    const titleRectW = titleWidth + titlePadX * 2;
    const titleRectH = 8;
    const titleRectX = (pageWidth - titleRectW) / 2;
    const titleRectY = headerTitleY - 6;
    doc.setFillColor(255, 255, 255);
    doc.rect(titleRectX, titleRectY, titleRectW, titleRectH, 'F');

    doc.setTextColor(0, 102, 153);
    doc.text(titleText, pageWidth / 2, headerTitleY, { align: 'center' });
  };

  // Add letterhead background (full page)
  try {
    timbradoBase64 = await loadImageAsBase64(prescriptionTimbrado);
    addLetterhead();
  } catch (error) {
    console.error('Error loading letterhead:', error);
  }

  // Add logo and title centered
  try {
    logoBase64 = await loadImageAsBase64(fundacaoLogo);
    addLogoAndTitle();
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  // Iniciar conteúdo abaixo do título (evita linha passando pelo "RECEITUÁRIO")
  yPosition = Math.max(yPosition, headerTitleY + 12);
  doc.setTextColor(0, 0, 0);

  // Line separator
  doc.setDrawColor(0, 102, 153);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  // Patient info
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(client.name, margin + 20, yPosition);

  if (client.cpf) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('CPF:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(client.cpf, margin + 12, yPosition);
  }

  if (client.birth_date) {
    const birthDate = formatDateBR(client.birth_date);
    doc.setFont('helvetica', 'bold');
    doc.text('Data de Nascimento:', margin + 70, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(birthDate, margin + 108, yPosition);
  }

  // Data de lançamento - só exibe se show_prescription_date !== false
  if (prescription.show_prescription_date !== false) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Data da Prescrição:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(prescription.prescription_date).toLocaleDateString('pt-BR'), margin + 38, yPosition);
  } else {
    // Manter espaçamento mínimo mesmo sem a data
    yPosition += 3;
  }

  // Line separator
  yPosition += 6;
  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  // Max Y position before footer (leave space for footer graphics)
  const maxContentY = 200;

  // Check if we have the new free-text format (general_instructions contains main content, medications is empty)
  const isFreeTextFormat = (!prescription.medications || prescription.medications.length === 0) && prescription.general_instructions;

  if (isFreeTextFormat) {
    // New simplified format: just show the free text content
    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const contentLines = doc.splitTextToSize(prescription.general_instructions!, pageWidth - 2 * margin);
    
    for (let i = 0; i < contentLines.length; i++) {
      // Check if we need a new page
      if (yPosition > maxContentY) {
        doc.addPage();
        addLetterhead();
        addLogoAndTitle();
        yPosition = 50;
      }
      doc.text(contentLines[i], margin, yPosition);
      yPosition += 6;
    }
  } else {
    // Original format with structured medications
    
    // Diagnosis - only if provided
    if (prescription.diagnosis && prescription.diagnosis.trim() && !prescription.diagnosis.startsWith('prescriptions/')) {
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 153);
      doc.text('Diagnóstico/Indicação:', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      const diagnosisLines = doc.splitTextToSize(prescription.diagnosis, pageWidth - 2 * margin);
      doc.text(diagnosisLines, margin, yPosition);
      yPosition += diagnosisLines.length * 5;
    }

    // Uso Oral section
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 153);
    doc.text('Uso Oral', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    
    yPosition += 6;
    doc.setFontSize(10);

    for (let index = 0; index < prescription.medications.length; index += 1) {
      const med: Medication = prescription.medications[index];
      // Check if we need a new page (leave space for footer)
      if (yPosition > maxContentY) {
        doc.addPage();
        addLetterhead();
        addLogoAndTitle();
        yPosition = 50;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${med.name}${med.dosage ? ' ' + med.dosage : ''}`, margin, yPosition);

      yPosition += 6;
      doc.setFont('helvetica', 'normal');

      const details: string[] = [];
      if (med.frequency) details.push(`Posologia: ${med.frequency}`);
      if (med.duration) details.push(`Duração: ${med.duration}`);

      if (details.length > 0) {
        doc.text(details.join(' | '), margin + 5, yPosition);
        yPosition += 5;
      }

      if (med.instructions) {
        doc.setFont('helvetica', 'italic');
        const instructionLines = doc.splitTextToSize(`Obs: ${med.instructions}`, pageWidth - 2 * margin - 5);
        doc.text(instructionLines, margin + 5, yPosition);
        yPosition += instructionLines.length * 5;
      }

      yPosition += 5;
    }

    // General instructions for old format
    if (prescription.general_instructions) {
      yPosition += 18;
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 153);
      doc.text('ORIENTAÇÕES GERAIS:', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const instructionLines = doc.splitTextToSize(prescription.general_instructions, pageWidth - 2 * margin);
      doc.text(instructionLines, margin, yPosition);
      yPosition += instructionLines.length * 5;
    }
  }

  // Follow-up notes
  if (prescription.follow_up_notes) {
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Retorno:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    const followUpLines = doc.splitTextToSize(prescription.follow_up_notes, pageWidth - 2 * margin - 20);
    doc.text(followUpLines, margin + 18, yPosition);
  }

  // Signature area - positioned above the footer graphics
  yPosition = Math.max(yPosition + 25, 195);
  
  // Ensure signature doesn't overlap with footer
  if (yPosition > maxContentY) {
    yPosition = maxContentY;
  }
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 40, yPosition, pageWidth / 2 + 40, yPosition);
  
  yPosition += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(professionalName, pageWidth / 2, yPosition, { align: 'center' });
  
  if (professionalLicense) {
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(professionalLicense, pageWidth / 2, yPosition, { align: 'center' });
  }

  // Data de impressão - só exibe se show_print_date === true
  if (prescription.show_print_date === true) {
    yPosition += 8;
    doc.setFontSize(9);
    doc.text(`Data de Impressão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
  }

  return doc;
};

export const downloadPrescriptionPdf = async (
  prescription: Prescription,
  client: Client,
  professionalName: string,
  professionalLicense?: string
) => {
  const doc = await generatePrescriptionPdf(prescription, client, professionalName, professionalLicense);
  const fileName = `receita_${client.name.replace(/\s+/g, '_')}_${prescription.prescription_date}.pdf`;
  doc.save(fileName);
};

export const printPrescriptionPdf = async (
  prescription: Prescription,
  client: Client,
  professionalName: string,
  professionalLicense?: string
) => {
  // Área segura de 5mm para evitar corte nas bordas
  const doc = await generatePrescriptionPdf(prescription, client, professionalName, professionalLicense, {
    letterheadInsetMm: 5,
    letterheadOffsetYmm: 0,
  });
  
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  // Usar iframe invisível para impressão - evita que usuário use Ctrl+P na tela errada
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.src = url;
  
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        // Fallback: abrir em nova janela se iframe não funcionar
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
          };
        }
      }
      // Limpar iframe após impressão
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 500);
  };
  
  document.body.appendChild(iframe);
};

// Imprimir página em branco para uso com matriz pré-impressa
export const printBlankPrescriptionPdf = async () => {
  const doc = await generateBlankPrescriptionPdf();
  
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.src = url;
  
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
          };
        }
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 500);
  };
  
  document.body.appendChild(iframe);
};

// Interface para Laudo
interface LaudoData {
  title: string;
  description?: string | null;
  laudo_date: string;
  laudo_type: string;
}

interface LaudoClient {
  name: string;
  cpf?: string;
  birth_date?: string;
}

// Gerar PDF do laudo com conteúdo
export const generateLaudoPdf = async (
  laudo: LaudoData,
  client: LaudoClient,
  professionalName: string,
  professionalLicense?: string
): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let timbradoBase64: string | null = null;
  let logoBase64: string | null = null;

  try {
    timbradoBase64 = await loadImageAsBase64(prescriptionTimbrado);
    logoBase64 = await loadImageAsBase64(fundacaoLogo);
  } catch (e) {
    console.warn('Erro ao carregar imagens:', e);
  }

  const addNewPage = () => {
    doc.addPage();
    if (timbradoBase64) {
      doc.addImage(timbradoBase64, 'JPEG', 5, 5, pageWidth - 10, pageHeight - 10);
    }
  };

  // Background timbrado
  if (timbradoBase64) {
    doc.addImage(timbradoBase64, 'JPEG', 5, 5, pageWidth - 10, pageHeight - 10);
  }

  // Logo e título
  let yPosition = 20;
  if (logoBase64) {
    const logoW = 35;
    const logoH = 28;
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoW) / 2, 5, logoW, logoH);
    yPosition = 40;
  }

  // Máscara branca para título
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPosition - 2, contentWidth, 12, 'F');

  // Título "LAUDO"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('LAUDO', pageWidth / 2, yPosition + 6, { align: 'center' });
  yPosition += 18;

  // Tipo do laudo
  const tipoLabels: Record<string, string> = {
    neuropsicologico: 'Neuropsicológico',
    psicologico: 'Psicológico',
    fonoaudiologico: 'Fonoaudiológico',
    medico: 'Médico',
    outro: 'Outro'
  };
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo: ${tipoLabels[laudo.laudo_type] || laudo.laudo_type}`, margin, yPosition);
  yPosition += 6;

  // Informações do paciente
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(client.name, margin + 22, yPosition);
  yPosition += 6;

  if (client.cpf) {
    doc.setFont('helvetica', 'bold');
    doc.text('CPF:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(client.cpf, margin + 12, yPosition);
    yPosition += 6;
  }

  if (client.birth_date) {
    doc.setFont('helvetica', 'bold');
    doc.text('Data de Nascimento:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateBR(client.birth_date), margin + 42, yPosition);
    yPosition += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Data do Laudo:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateBR(laudo.laudo_date), margin + 32, yPosition);
  yPosition += 12;

  // Linha divisória
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Conteúdo do laudo
  const maxY = pageHeight - 50;

  if (laudo.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(laudo.description, contentWidth);

    for (let i = 0; i < lines.length; i++) {
      if (yPosition > maxY) {
        addNewPage();
        yPosition = 50;
      }
      doc.text(lines[i], margin, yPosition);
      yPosition += 6;
    }
  }

  // Assinatura do profissional
  yPosition = Math.max(yPosition + 20, pageHeight - 45);
  if (yPosition > pageHeight - 30) {
    addNewPage();
    yPosition = pageHeight - 45;
  }

  doc.setDrawColor(0, 0, 0);
  const lineStart = (pageWidth - 70) / 2;
  doc.line(lineStart, yPosition, lineStart + 70, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(professionalName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  if (professionalLicense) {
    doc.setFont('helvetica', 'normal');
    doc.text(professionalLicense, pageWidth / 2, yPosition, { align: 'center' });
  }

  return doc;
};

// Imprimir laudo PDF
export const printLaudoPdf = async (
  laudo: LaudoData,
  client: LaudoClient,
  professionalName: string,
  professionalLicense?: string
) => {
  const doc = await generateLaudoPdf(laudo, client, professionalName, professionalLicense);
  
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.src = url;
  
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
          };
        }
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 500);
  };
  
  document.body.appendChild(iframe);
};

// Download laudo PDF
export const downloadLaudoPdf = async (
  laudo: LaudoData,
  client: LaudoClient,
  professionalName: string,
  professionalLicense?: string
) => {
  const doc = await generateLaudoPdf(laudo, client, professionalName, professionalLicense);
  const fileName = `laudo_${client.name.replace(/\s+/g, '_')}_${laudo.laudo_date}.pdf`;
  doc.save(fileName);
};

// Gerar PDF em branco para laudo (uso com matriz pré-impressa)
export const generateBlankLaudoPdf = async (): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Quadrado vazio centralizado para escrita manual
  const boxX = margin;
  const boxY = margin;
  const boxWidth = pageWidth - (margin * 2);
  const boxHeight = pageHeight - (margin * 2);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  
  return doc;
};

export const printBlankLaudoPdf = async () => {
  const doc = await generateBlankLaudoPdf();
  
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.src = url;
  
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
          };
        }
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 500);
  };
  
  document.body.appendChild(iframe);
};
