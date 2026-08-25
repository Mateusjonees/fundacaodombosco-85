import type jsPDF from 'jspdf';

/**
 * Impressão robusta de PDFs gerados com jsPDF.
 * - Usa autoPrint (dispara o diálogo mesmo quando o visualizador nativo assume o iframe)
 * - Mantém o iframe vivo até o usuário fechar o diálogo (afterprint) — remover cedo cancela a impressão
 * - Fallback: abre em nova aba; se bloqueado, faz download do arquivo
 */
export const printPdfDoc = async (doc: jsPDF, fileName = 'documento.pdf') => {
  // Faz o visualizador abrir o diálogo de impressão automaticamente
  try {
    doc.autoPrint();
  } catch {
    // autoPrint indisponível: seguimos com o print() manual
  }

  const url = URL.createObjectURL(doc.output('blob'));

  const cleanup = (iframe: HTMLIFrameElement) => {
    if (iframe.parentNode) document.body.removeChild(iframe);
    URL.revokeObjectURL(url);
  };

  const openFallback = () => {
    const win = window.open(url, '_blank');
    if (!win) {
      // Popup bloqueado: baixa o arquivo para o usuário imprimir manualmente
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.border = 'none';
  iframe.src = url;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    // Espera o diálogo do navegador ser resolvido antes de remover o iframe
    setTimeout(() => cleanup(iframe), 2000);
  };

  iframe.onload = () => {
    setTimeout(() => {
      try {
        const win = iframe.contentWindow;
        if (!win) throw new Error('sem contentWindow');
        win.focus();
        win.addEventListener?.('afterprint', finish);
        win.print();
        // Se o afterprint não disparar (visualizador nativo), limpa depois de um tempo generoso
        setTimeout(finish, 60000);
      } catch {
        cleanup(iframe);
        openFallback();
      }
    }, 300);
  };

  iframe.onerror = () => {
    cleanup(iframe);
    openFallback();
  };

  document.body.appendChild(iframe);
};
