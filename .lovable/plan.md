
# Corrigir Favicon e Melhorar Página de Instalação

## Problema 1: Favicon/Ícone errado na aba do navegador
O ícone que aparece na aba do navegador está usando uma URL externa genérica. Vamos substituir pelo logo da Fundação Dom Bosco que você enviou.

### O que será feito:
- Copiar a imagem do logo enviada para a pasta `public/` do projeto
- Atualizar o `index.html` para apontar para o novo favicon local
- Atualizar os ícones do PWA (192x192 e 512x512) no manifesto para usar o logo correto

## Problema 2: Instalação em todos os navegadores
A tecnologia PWA tem uma limitação: nem todos os navegadores oferecem o botão automático "Instalar". Mas podemos melhorar a experiência:

- **Chrome, Edge, Samsung Internet (Android e PC)**: O botão "Instalar com 1 Clique" funciona automaticamente
- **Safari (iPhone/iPad)**: Não suporta o botão automático - precisa seguir passos manuais
- **Firefox**: Suporte limitado

### O que será feito:
- Manter o botão automático como opção principal (funciona na maioria dos navegadores)
- Simplificar as instruções de fallback para quando o botão não estiver disponível
- Mostrar a logo da Fundação Dom Bosco na página de instalação em vez do ícone genérico

---

## Detalhes Técnicos

### Arquivos a modificar:
1. **Copiar imagem** - `user-uploads://Sem-Título-4.jpg` para `public/favicon.png` e `public/pwa-512x512.png`
2. **`index.html`** - Trocar a URL externa do favicon pela imagem local `/favicon.png`
3. **`src/pages/Install.tsx`** - Substituir o ícone `Smartphone` pelo logo da Fundação Dom Bosco
4. **`vite.config.ts`** - Manter configuração dos ícones PWA apontando para os arquivos atualizados
