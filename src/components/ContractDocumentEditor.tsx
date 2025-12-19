import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import timbradoFooter from '@/assets/contract-timbrado-footer.jpg';
import logoFundacao from '@/assets/fundacao-dom-bosco-logo-main.png';

interface ContractDocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  previewData?: Record<string, string>;
}

export function ContractDocumentEditor({ 
  content, 
  onChange, 
  readOnly = false,
  previewData 
}: ContractDocumentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Substitui variáveis por dados de preview
  const displayContent = previewData
    ? Object.entries(previewData).reduce(
        (text, [key, value]) => text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
        content
      )
    : content;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && !readOnly) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 600)}px`;
    }
  }, [content, readOnly]);

  return (
    <ScrollArea className="h-full">
      <div className="flex justify-center py-6 px-4 bg-muted/50 min-h-full">
        {/* Página A4 */}
        <div 
          className="bg-white shadow-xl rounded-sm w-full max-w-[210mm] relative flex flex-col"
          style={{
            minHeight: '297mm',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {/* Cabeçalho com Logo - Apenas primeira página */}
          <div className="flex justify-center pt-8 pb-4">
            <img 
              src={logoFundacao} 
              alt="Fundação Dom Bosco" 
              className="h-20 object-contain"
            />
          </div>

          {/* Área de Conteúdo Editável */}
          <div className="flex-1 px-12 pb-10">
            {readOnly ? (
              <div 
                className="whitespace-pre-wrap text-sm leading-7 text-gray-800"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {displayContent || 'Conteúdo do contrato aparecerá aqui...'}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Digite o conteúdo do contrato aqui...

Dica: Use as variáveis do painel lateral para inserir dados dinâmicos como {{NOME_CONTRATANTE}}, {{VALOR}}, etc."
                className="w-full min-h-[600px] resize-none border-0 focus:outline-none focus:ring-0 text-sm leading-7 text-gray-800 bg-transparent placeholder:text-gray-400"
                style={{ 
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              />
            )}
          </div>

          {/* Rodapé - Imagem exata do documento Word */}
          <div className="mt-auto">
            <img 
              src={timbradoFooter} 
              alt="Papel Timbrado - Fundação Dom Bosco" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
