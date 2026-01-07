import jsPDF from 'jspdf';
import { Medication, Prescription } from '@/hooks/usePrescriptions';
import logoHeader from '@/assets/fundacao-dom-bosco-logo-header.png';
import logoFooter from '@/assets/fundacao-dom-bosco-logo-optimized.png';

interface Client {
  name: string;
  cpf?: string;
  birth_date?: string;
}

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
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const generatePrescriptionPdf = async (
  prescription: Prescription,
  client: Client,
  professionalName: string,
  professionalLicense?: string
): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 15;

  // Load and add header logo
  try {
    const logoBase64 = await loadImageAsBase64(logoHeader);
    const logoWidth = 50;
    const logoHeight = 20;
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, yPosition, logoWidth, logoHeight);
    yPosition += logoHeight + 5;
  } catch (error) {
    console.error('Error loading header logo:', error);
    yPosition += 10;
  }

  // Header text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FUNDAÇÃO DOM BOSCO', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Clínica de Neuropsicologia e Desenvolvimento', pageWidth / 2, yPosition, { align: 'center' });

  // Line separator
  yPosition += 8;
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  // Title
  yPosition += 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEITUÁRIO', pageWidth / 2, yPosition, { align: 'center' });

  // Service type badge
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const serviceTypeText = prescription.service_type === 'sus' ? 'ATENDIMENTO SUS' : 'ATENDIMENTO PRIVATIVO';
  doc.text(serviceTypeText, pageWidth / 2, yPosition, { align: 'center' });

  // Patient info
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(client.name, margin + 22, yPosition);

  if (client.cpf) {
    yPosition += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('CPF:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(client.cpf, margin + 12, yPosition);
  }

  if (client.birth_date) {
    const birthDate = new Date(client.birth_date).toLocaleDateString('pt-BR');
    doc.setFont('helvetica', 'bold');
    doc.text('Data de Nasc.:', margin + 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(birthDate, margin + 110, yPosition);
  }

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Data da Prescrição:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(prescription.prescription_date).toLocaleDateString('pt-BR'), margin + 42, yPosition);

  // Line separator
  yPosition += 8;
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  // Diagnosis (if any)
  if (prescription.diagnosis) {
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnóstico/Indicação:', margin, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    const diagnosisLines = doc.splitTextToSize(prescription.diagnosis, pageWidth - 2 * margin);
    doc.text(diagnosisLines, margin, yPosition);
    yPosition += diagnosisLines.length * 5;
  }

  // Medications
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAMENTOS:', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);

  prescription.medications.forEach((med: Medication, index: number) => {
    // Check if we need a new page (leave space for footer)
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
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
  });

  // General instructions
  if (prescription.general_instructions) {
    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('ORIENTAÇÕES GERAIS:', margin, yPosition);
    
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    const instructionLines = doc.splitTextToSize(prescription.general_instructions, pageWidth - 2 * margin);
    doc.text(instructionLines, margin, yPosition);
    yPosition += instructionLines.length * 5;
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

  // Signature area
  yPosition = Math.max(yPosition + 25, 200);
  
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

  yPosition += 8;
  doc.setFontSize(9);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });

  // Footer with logo and address
  const footerY = pageHeight - 30;
  
  // Add footer logo
  try {
    const footerLogoBase64 = await loadImageAsBase64(logoFooter);
    const footerLogoWidth = 25;
    const footerLogoHeight = 15;
    doc.addImage(footerLogoBase64, 'PNG', (pageWidth - footerLogoWidth) / 2, footerY - 5, footerLogoWidth, footerLogoHeight);
  } catch (error) {
    console.error('Error loading footer logo:', error);
  }

  // Footer text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Rua Madre Cecília, 1234 - Centro - Belo Horizonte/MG - CEP: 30000-000', pageWidth / 2, footerY + 15, { align: 'center' });
  doc.text('Tel: (31) 3333-0000 | www.fundacaodombosco.org.br', pageWidth / 2, footerY + 20, { align: 'center' });
  doc.setTextColor(0);

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
  const doc = await generatePrescriptionPdf(prescription, client, professionalName, professionalLicense);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
