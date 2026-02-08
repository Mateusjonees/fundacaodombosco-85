

## Navegação mobile otimizada com barra inferior

### O que muda
Adicionar uma **barra de navegação fixa na parte inferior da tela** (bottom tab bar) no celular, com os itens mais usados acessíveis com 1 toque -- sem precisar abrir o menu lateral.

### Como vai funcionar

- **Barra inferior** visível apenas no celular (abaixo de 768px) com 5 ícones fixos:
  - Painel (Home)
  - Agenda (Calendar)
  - Pacientes (Users)
  - Mensagens (MessageSquare)
  - Menu (hamburguer -- abre o sidebar drawer com todos os itens)

- O item ativo fica destacado com cor primária
- A barra fica fixa no rodapé, sempre visível durante a navegação
- O botão "Menu" abre o sidebar lateral existente (drawer) para acessar todos os outros itens

### Ajustes complementares

- **Sidebar mobile**: os itens dentro do drawer ficam com categorias **todas expandidas por padrão** no celular, sem necessidade de clicar para abrir cada grupo -- rolagem vertical contínua para acesso rápido
- **Padding inferior**: adicionar espaço no conteúdo principal para não ficar atrás da barra inferior
- O `SidebarTrigger` no header continua funcionando normalmente

### Detalhes técnicos

**Novo arquivo**: `src/components/layout/MobileBottomNav.tsx`
- Componente com 5 botões fixos usando `fixed bottom-0` e `z-50`
- Usa `useIsMobile()` para renderizar apenas em telas pequenas
- Usa `react-router-dom` NavLink para navegação
- O botão "Menu" chama `setOpenMobile(true)` do contexto do Sidebar

**Arquivo editado**: `src/components/MainApp.tsx`
- Importar e renderizar `MobileBottomNav` dentro do `SidebarProvider`
- Adicionar `pb-16 md:pb-0` no container principal para compensar a barra inferior

**Arquivo editado**: `src/components/layout/AppSidebar.tsx`
- No mobile, inicializar `openCategories` com todas as categorias abertas por padrão para eliminar cliques extras

