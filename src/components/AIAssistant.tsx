import { useState, useRef, useEffect, memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, Square, Trash2, Bot, User } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MessageBubble = memo(({ role, content }: { role: 'user' | 'assistant'; content: string }) => (
  <div className={cn('flex gap-2.5 mb-4', role === 'user' ? 'justify-end' : 'justify-start')}>
    {role === 'assistant' && (
      <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
        <Bot className="h-4 w-4 text-primary" />
      </div>
    )}
    <div className={cn(
      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
      role === 'user'
        ? 'bg-primary text-primary-foreground rounded-br-md'
        : 'bg-muted rounded-bl-md'
    )}>
      {role === 'assistant' ? (
        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{content}</p>
      )}
    </div>
    {role === 'user' && (
      <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center mt-0.5">
        <User className="h-4 w-4 text-primary" />
      </div>
    )}
  </div>
));
MessageBubble.displayName = 'MessageBubble';

export const AIAssistant = ({ open, onOpenChange }: AIAssistantProps) => {
  const { messages, isLoading, sendMessage, stopStream, clearMessages } = useAIAssistant();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[440px] p-0 flex flex-col gap-0">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Assistente IA
            </SheetTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3 py-12">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-sm font-medium">Como posso ajudar?</p>
              <p className="text-xs max-w-[280px]">
                Pergunte sobre agendamentos, pacientes, funcionalidades do sistema e muito mais.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => <MessageBubble key={i} role={msg.role} content={msg.content} />)
          )}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-2.5 mb-4">
              <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[40px] max-h-[120px]"
              style={{ height: 'auto', overflow: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            {isLoading ? (
              <Button size="icon" variant="destructive" onClick={stopStream} className="h-10 w-10 rounded-xl shrink-0">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="h-10 w-10 rounded-xl shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
