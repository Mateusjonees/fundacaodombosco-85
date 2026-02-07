

# Melhorar Página de Instalação com Detecção de Navegador

## O que muda

A página `/install` vai detectar automaticamente o navegador do usuário e mostrar apenas as instruções relevantes para ele, em vez de listar todos os navegadores de uma vez.

## Comportamento por navegador

| Navegador | Experiência |
|-----------|------------|
| Chrome / Edge / Samsung (Android e PC) | Botão "Instalar com 1 Clique" (automático) |
| Safari (iPhone / iPad) | Instruções visuais: "Toque em Compartilhar, depois Adicionar à Tela de Início" |
| Firefox | Instruções: "Abra no Chrome para instalar automaticamente" + instruções manuais |
| Outros | Instruções genéricas simplificadas |

## Sobre o Offline

O sistema ja funciona offline. O Workbox ja faz cache de todos os arquivos estaticos (JS, CSS, HTML, imagens). As chamadas ao Supabase usam estrategia "NetworkFirst" -- tenta buscar online, e se falhar usa o cache local. Nenhuma alteracao necessaria.

## Detalhes Tecnicos

### Arquivo: `src/pages/Install.tsx`

1. Adicionar funcao de deteccao de navegador/plataforma usando `navigator.userAgent`:
   - `isIOS` (Safari)
   - `isAndroid`
   - `isChrome`, `isEdge`, `isFirefox`, `isSamsung`

2. Renderizar instrucoes condicionais:
   - Se Chrome/Edge/Samsung: mostrar botao automatico (ja existe) + fallback manual
   - Se Safari/iOS: mostrar card com 3 passos visuais numerados (Compartilhar > Adicionar a Tela de Inicio)
   - Se Firefox: sugerir abrir no Chrome, com instrucoes manuais como alternativa

3. Adicionar icones visuais para cada passo (usando Lucide icons como `Share`, `Plus`, `Menu`)

4. Manter o estado `isInstalled` para mostrar confirmacao quando ja instalado

### Estrutura visual da pagina

```text
+----------------------------------+
|  <- Voltar    Instalar o Sistema |
+----------------------------------+
|                                  |
|         [Logo FDB]               |
|    "Instale o Sistema FDB"       |
|                                  |
|  [Botao Instalar] (se Chrome)    |
|        -- OU --                  |
|  +------------------------------+|
|  | Detectamos que voce usa       ||
|  | Safari. Siga estes passos:    ||
|  |                               ||
|  | 1. Toque em "Compartilhar"    ||
|  | 2. Role e toque em            ||
|  |    "Adicionar a Tela Inicio"  ||
|  | 3. Confirme tocando "Adicionar"||
|  +------------------------------+|
|                                  |
|   Acesso rapido | Tela cheia     |
+----------------------------------+
```

### Nenhuma alteracao necessaria para offline
A configuracao atual do Workbox no `vite.config.ts` ja garante funcionamento offline.

