

## Modernizacao do Menu Lateral (Sidebar)

O menu atual usa categorias colapsaveis com linhas conectoras verticais, chevrons e muitos gradientes sobrepostos -- visualmente carregado e com aparencia de sistema antigo. A proposta e um design **flat, limpo e moderno**, inspirado em apps como Linear, Notion e Vercel.

---

### Mudancas Visuais Principais

**1. Remover elementos visuais pesados:**
- Eliminar linhas conectoras verticais/horizontais entre itens
- Remover gradientes de fundo nas categorias
- Remover blur/glow ao redor do logo e avatar
- Simplificar o badge de item ativo (sem bolinha branca)

**2. Novo estilo de categorias:**
- Labels de categoria como texto simples (`text-[11px] uppercase tracking-widest text-muted-foreground`) sem icone de categoria
- Sem animacao de chevron -- categorias sempre abertas (flat list com separadores visuais)
- Espacamento maior entre grupos para clareza visual

**3. Novo estilo de itens de menu:**
- Icones monocromaticos (sem fundo colorido por categoria)
- Item ativo: `bg-accent text-accent-foreground font-medium` com borda lateral esquerda (`border-l-2 border-primary`)
- Hover sutil: `hover:bg-muted/60`
- Padding reduzido, `rounded-lg` em vez de `rounded-xl`
- Texto `text-[13px]` uniforme

**4. Header simplificado:**
- Logo menor, sem glow/blur
- Texto "Fundacao Dom Bosco" limpo, sem Sparkles icon

**5. Footer do usuario:**
- Card simples sem gradiente de fundo
- Remover glow no avatar
- Manter dropdown funcional

---

### Arquivos Modificados

- `src/components/layout/AppSidebar.tsx` -- reescrever estilos dos itens, categorias e header
- `src/index.css` -- remover/simplificar variaveis de sidebar desnecessarias (opcional, menor impacto)

### O que NAO muda

- Toda a logica de permissoes e rotas permanece identica
- Collapsible behavior no desktop permanece (mas com visual mais limpo)
- Mobile bottom nav permanece igual
- Tooltips no modo colapsado permanecem

