import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import fundacaoLogo from '@/assets/fundacao-dom-bosco-logo-main.png';

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
          className="bg-white shadow-xl rounded-sm w-full max-w-[210mm] relative"
          style={{
            minHeight: '297mm',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {/* Cabeçalho com Logo */}
          <div className="px-10 pt-8 pb-6 border-b border-gray-100">
            <div className="flex flex-col items-center text-center">
              <img 
                src={fundacaoLogo} 
                alt="Fundação Dom Bosco" 
                className="h-16 w-auto mb-3 object-contain"
              />
              <div className="text-xs text-gray-500 tracking-wider uppercase">
                Fundação Dom Bosco Saúde
              </div>
            </div>
          </div>

          {/* Linha decorativa azul */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600" />

          {/* Área de Conteúdo Editável */}
          <div className="px-12 py-8" style={{ minHeight: 'calc(297mm - 200px)' }}>
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

          {/* Rodapé */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* Elementos visuais decorativos */}
            <div className="relative">
              {/* Barra azul lateral esquerda */}
              <div className="absolute left-0 bottom-0 w-2 h-32 bg-gradient-to-t from-blue-600 to-blue-400 rounded-tr-full" />
              
              {/* Círculos decorativos */}
              <div className="absolute left-4 bottom-16 w-6 h-6 rounded-full bg-blue-500/20" />
              <div className="absolute left-8 bottom-10 w-4 h-4 rounded-full bg-blue-500/30" />
              
              {/* Conteúdo do rodapé */}
              <div className="px-10 py-6 bg-gradient-to-t from-gray-50 to-transparent">
                {/* Linha separadora */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />
                
                {/* Endereços das unidades */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-gray-500 text-center mb-4">
                  <div>
                    <div className="font-semibold text-gray-600 mb-1">Unidade Floresta</div>
                    <div>Rua Urucuia, 18 - Floresta</div>
                    <div>Belo Horizonte - MG</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-600 mb-1">Unidade Sion</div>
                    <div>Rua Patagônia, 164 - Sion</div>
                    <div>Belo Horizonte - MG</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-600 mb-1">Contato</div>
                    <div>contato@fundacaodombosco.com.br</div>
                    <div>(31) 3287-1889</div>
                  </div>
                </div>

                {/* Logo pequeno e CNPJ */}
                <div className="flex justify-between items-center">
                  <div className="text-[9px] text-gray-400">
                    CNPJ: 17.278.904/0001-86
                  </div>
                  <img 
                    src={fundacaoLogo} 
                    alt="Fundação Dom Bosco" 
                    className="h-6 w-auto opacity-50"
                  />
                </div>

                {/* Aviso LGPD */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[8px] text-gray-400 text-center leading-relaxed">
                    Este documento contém informações confidenciais protegidas pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                    A reprodução ou divulgação não autorizada é proibida.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
