
## Correção do erro "forwardRef" no domínio personalizado

### Problema identificado
O erro `Cannot read properties of undefined (reading 'forwardRef')` acontece porque a configuração de build (`manualChunks`) separa o React em um chunk (`vendor-react`) e as bibliotecas de UI (Radix UI) em outros chunks (`vendor-ui-core`, `vendor-ui-form`). Quando o navegador carrega esses arquivos, o chunk de UI pode executar **antes** do React estar disponível, causando o crash.

Isso funciona no preview do Lovable porque o modo de desenvolvimento não usa essa separação de chunks -- só acontece no build de produção (Vercel).

### Solução
Remover a configuração `manualChunks` que está causando o conflito. O Vite/Rollup vai gerenciar automaticamente a divisão de código de forma segura, garantindo que as dependências sejam carregadas na ordem correta.

### Detalhes técnicos

**Arquivo**: `vite.config.ts`

Remover todo o bloco `manualChunks` da configuração de build:

```text
Antes:
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui-core': [...],
          'vendor-ui-form': [...],
          ...
        },
      },
    },
  },

Depois:
  build: {
    target: 'es2020',
    cssCodeSplit: true,
  },
```

A opção `dedupe` já adicionada anteriormente continuará ativa para evitar instâncias duplicadas do React. A remoção do `manualChunks` resolve o problema de ordem de carregamento sem impacto negativo no desempenho -- o Vite faz code-splitting automaticamente de forma eficiente.

Após a alteração, será necessário fazer um novo deploy no Vercel para que a correção entre em vigor no domínio `sistemafundacaodombosco.org`.
