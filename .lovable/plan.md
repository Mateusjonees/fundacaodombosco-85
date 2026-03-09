

# Botao de Rotacao de Tela para Mobile/Tablet

## O que sera feito
Adicionar um botao flutuante visivel apenas em dispositivos moveis e tablets que permite ao usuario alternar a orientacao da tela entre retrato (portrait) e paisagem (landscape) usando a Screen Orientation API do navegador.

## Como vai funcionar
- Um botao flutuante aparecera no canto inferior direito da tela, acima da barra de navegacao inferior
- Ao clicar, a tela alternara entre orientacao retrato e paisagem
- O icone do botao mudara conforme a orientacao atual (smartphone vertical ou horizontal)
- O botao so aparecera em dispositivos moveis e tablets (telas menores que 1024px)
- Em navegadores que nao suportam a API de orientacao, o botao nao sera exibido

## Detalhes Tecnicos

### 1. Novo componente: `src/components/ScreenOrientationToggle.tsx`
- Utilizara a API `screen.orientation.lock()` para alternar entre `portrait` e `landscape`
- Verificara suporte do navegador antes de exibir o botao
- Usara o hook `useIsMobile` existente e uma verificacao de largura maxima (1024px) para incluir tablets
- Icone do lucide-react: `RotateCcw` ou `Smartphone`
- Estilo: botao circular flutuante com `fixed`, posicionado acima da nav inferior (`bottom-20`)

### 2. Integracao no `MainApp.tsx`
- Importar e renderizar o componente `ScreenOrientationToggle` ao lado do `MobileBottomNav`

### 3. Tratamento de erros
- Nem todos os navegadores suportam `screen.orientation.lock()` (Safari iOS tem suporte limitado)
- Caso o navegador nao suporte, o botao nao sera renderizado
- Em caso de falha ao rotacionar, exibira um toast informando o usuario

