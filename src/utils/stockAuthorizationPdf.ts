import jsPDF from 'jspdf';
import fundacaoLogo from '@/assets/fundacao-dom-bosco-saude-logo.png';
import { formatDateBR } from '@/lib/utils';

export interface StockAuthorizationData {
  itemName: string;
  quantity: number;
  unitLabel?: string | null;
  clinicUnitLabel?: string | null;
  responsibleName: string;
  destination?: string | null;
  withdrawalDate: string;
  expectedReturnDate?: string | null;
  reason?: string | null;
  issuedBy?: string | null;
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
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });

/** Gera o Termo de Responsabilidade de retirada de material (para impressão e assinatura) */
export const generateStockAuthorizationPdf = async (data: StockAuthorizationData): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let logo: string | null = null;
  try {
    logo = await loadImageAsBase64(fundacaoLogo);
  } catch (e) {
    console.warn('[Termo de retirada] logo indisponível', e);
  }

  // Cabeçalho institucional
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 0, pageWidth, 34, 'F');
  if (logo) doc.addImage(logo, 'PNG', margin, 5, 26, 24);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FUNDAÇÃO DOM BOSCO', logo ? margin + 32 : margin, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Almoxarifado e Controle de Estoque', logo ? margin + 32 : margin, 21);
  if (data.clinicUnitLabel) {
    doc.text(`Unidade: ${data.clinicUnitLabel}`, logo ? margin + 32 : margin, 26.5);
  }

  let y = 46;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TERMO DE RESPONSABILIDADE DE RETIRADA DE MATERIAL', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Quadro com os dados da retirada
  const rows: Array<[string, string]> = [
    ['Responsável pela retirada', data.responsibleName || '—'],
    ['Material', data.itemName],
    ['Quantidade', `${data.quantity} ${data.unitLabel || 'unidade(s)'}`],
    ['Data da retirada', formatDateBR(data.withdrawalDate)],
    ['Previsão de devolução', data.expectedReturnDate ? formatDateBR(data.expectedReturnDate) : 'Material de consumo (sem devolução)'],
    ['Destino / Setor', data.destination || '—'],
    ['Finalidade', data.reason || 'Uso interno'],
  ];

  const rowH = 9;
  doc.setFontSize(10);
  rows.forEach(([label, value], i) => {
    const top = y + i * rowH;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(margin, top, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin + 3, top + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const lines: string[] = doc.splitTextToSize(String(value), contentWidth - 70);
    doc.text(lines[0] || '—', margin + 62, top + 6);
  });
  y += rows.length * rowH + 12;

  // Declaração
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DECLARAÇÃO', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const declaration =
    `Eu, ${data.responsibleName || '____________________________'}, declaro haver retirado do almoxarifado da Fundação Dom Bosco o material descrito acima, ` +
    `assumindo total responsabilidade por sua guarda, conservação e uso adequado. ` +
    (data.expectedReturnDate
      ? `Comprometo-me a devolvê-lo em perfeitas condições até ${formatDateBR(data.expectedReturnDate)}, `
      : 'Declaro que o material se destina a consumo interno, ') +
    `respondendo por eventuais danos, extravios ou uso indevido, nos termos das normas internas da instituição.`;
  const declLines: string[] = doc.splitTextToSize(declaration, contentWidth);
  doc.text(declLines, margin, y, { lineHeightFactor: 1.6 });
  y += declLines.length * 6 + 18;

  // Assinaturas
  doc.setDrawColor(100, 116, 139);
  const sigW = (contentWidth - 14) / 2;
  doc.line(margin, y, margin + sigW, y);
  doc.line(margin + sigW + 14, y, pageWidth - margin, y);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura do responsável pela retirada', margin, y + 5);
  doc.text('Assinatura do responsável pelo almoxarifado', margin + sigW + 14, y + 5);
  doc.setFontSize(8);
  doc.text(data.responsibleName || '', margin, y + 10);
  doc.text(data.issuedBy || '', margin + sigW + 14, y + 10);

  y += 26;
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CONTROLE DE DEVOLUÇÃO (uso do almoxarifado)', margin + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data da devolução: ____ / ____ / ______      Condições do material: ( ) Ok  ( ) Avariado', margin + 3, y + 13);
  doc.text('Recebido por: ______________________________________________', margin + 3, y + 19);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento gerado pelo sistema em ${formatDateBR(new Date().toISOString().slice(0, 10))}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' },
  );

  return doc;
};
