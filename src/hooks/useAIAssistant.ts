import { useState, useCallback, useRef } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './use-toast';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export const useAIAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { userRole, userName, userUnit } = useCurrentUser();
  const { toast } = useToast();

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          role: userRole,
          userName,
          unit: userUnit,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const errorMsg = err.error || 'Erro ao comunicar com a IA';
        toast({ variant: 'destructive', title: 'Erro', description: errorMsg });
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const snap = assistantSoFar;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snap } : m));
          }
          return [...prev, { role: 'assistant', content: snap }];
        });
      };

      const processLine = (line: string) => {
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') return true;
        if (!line.startsWith('data: ')) return true;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return false;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) upsert(content);
        } catch {
          return false; // partial JSON
        }
        return true;
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          const line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (!processLine(line)) {
            streamDone = true;
            break;
          }
        }
      }

      // flush remaining
      if (textBuffer.trim()) {
        for (const raw of textBuffer.split('\n')) {
          if (raw.trim()) processLine(raw);
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('AI chat error:', e);
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha na conexão com a IA.' });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading, userRole, userName, userUnit, toast]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, stopStream, clearMessages };
};
