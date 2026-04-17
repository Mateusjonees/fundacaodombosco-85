
User wants a split-screen login: left side = current login form, right side = something visual about Fundação Dom Bosco referente ao sistema.

Current LoginForm is centered with bubbles background. I'll restructure to a 50/50 split on desktop, keeping mobile as the current centered layout.

## Plano: Login com Layout Dividido (Split-Screen)

### Visão Geral
Transformar a tela de login em layout dividido 50/50 no desktop. Lado esquerdo mantém o formulário de login (atual). Lado direito ganha um painel visual institucional da Fundação Dom Bosco referente ao sistema clínico.

### Layout Desktop (≥1024px)

```text
┌────────────────────────┬────────────────────────┐
│                        │  ░░░ Gradiente azul ░░ │
│   [Logo FDB]           │                        │
│                        │   "Cuidado clínico     │
│   Bem-vindo de volta   │    que transforma      │
│                        │    vidas."             │
│   [Email]              │                        │
│   [Senha]              │   ✓ Gestão de Pacientes│
│   [Entrar →]           │   ✓ Agenda Inteligente │
│                        │   ✓ Prontuário Digital │
│   Instalar app         │   ✓ Avaliação Neuropsi │
│                        │                        │
│                        │   "Há mais de 60 anos  │
│                        │   transformando vidas" │
│                        │                        │
│                        │   [Selo MADRE/Floresta]│
└────────────────────────┴────────────────────────┘
```

### Lado Direito — Conteúdo

- **Background**: gradiente sutil usando as cores institucionais (azul MADRE → verde Floresta) com bolhas decorativas suaves (reaproveitando estilo atual).
- **Headline**: "Cuidado clínico que transforma vidas."
- **Subtítulo**: "Sistema integrado de gestão da Fundação Dom Bosco — Clínica Social, Neuropsicologia e Atendimento Floresta."
- **Lista de recursos** (4 ícones lucide-react com check):
  - Gestão completa de pacientes
  - Agenda e prontuário digital
  - Avaliação neuropsicológica (45+ testes)
  - Relatórios e laudos clínicos
- **Citação institucional**: "Há mais de 60 anos transformando vidas com dignidade e cuidado."
- **Badges de unidades** no rodapé: três pílulas coloridas (MADRE azul, Floresta verde, Atendimento Floresta roxo) — alinhadas com `mem://style/padronizacao-cores-unidades`.

### Mobile (<1024px)
Mantém o layout atual (formulário centralizado com bolhas). O painel direito fica oculto (`hidden lg:flex`) para preservar a UX mobile e o foco no login.

### Mudanças Técnicas

**Arquivo único alterado**: `src/components/auth/LoginForm.tsx`

- Wrapper externo vira `flex` com duas colunas no desktop:
  - Esquerda: `w-full lg:w-1/2` — conteúdo atual do form
  - Direita: `hidden lg:flex lg:w-1/2` — novo painel institucional
- Reaproveita classes existentes (`login-bubble`, paleta de tokens).
- Sem alteração em `index.css`, `App.tsx` ou rotas.
- Sem novas dependências (ícones já vêm do lucide-react).

### Considerações
- Acessibilidade: imagens decorativas com `aria-hidden`, headline como `<h2>`.
- Performance: nenhuma imagem nova pesada; tudo CSS + ícones SVG inline.
- Consistência: cores e tipografia seguem os tokens do design system já definidos.
