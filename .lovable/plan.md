## Remover painel institucional da tela de login

O usuário quer remover o painel lateral com o gradiente azul/verde que exibe "Cuidado clínico que transforma vidas.", lista de recursos, citação e selos das unidades (MADRE, Floresta, Atendimento Floresta).

### Alteração

No arquivo `src/components/auth/LoginForm.tsx`:

1. Remover todo o bloco `RIGHT: Institutional panel (desktop only)` (linhas 210–288) — o painel com gradiente, título, lista de features, citação e selos.
2. Ajustar o container do formulário de login: trocar `lg:w-1/2` por `w-full` para que o formulário ocupe a tela inteira no desktop.
3. Remover os imports não utilizados após a remoção: `Users`, `Calendar`, `FileText`, `Brain`, `Heart`.

### Resultado esperado
Tela de login com apenas o formulário centralizado, sem o painel institucional ao lado. Mobile não é afetado.