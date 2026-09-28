# Gestão centralizada do estoque por PHELIPE

## Resultado

PHELIPE continuará com acesso total como diretor e terá, dentro do Estoque, uma área para escolher quais funcionários podem consultar ou movimentar materiais.

- Adicionar **MADRE ESCOLA** às unidades de destino e distribuição.
- Permitir cadastrar itens para uma unidade específica ou para o estoque geral.
- Permitir distribuir uma entrada entre várias unidades, inclusive MADRE ESCOLA.
- Trocar o campo livre de destino por uma escolha clara da unidade, mantendo um campo opcional para setor/sala.
- Criar uma aba **Acessos** visível somente à diretoria, com níveis:
  - **Sem acesso**
  - **Somente consulta**
  - **Gestor do estoque** — pode cadastrar, editar, distribuir, retirar e gerar relatórios.
- Mostrar para cada funcionário as unidades às quais terá acesso; PHELIPE, como diretor, verá e administrará todas.

## Segurança

- Guardar os acessos concedidos em uma tabela própria, separados do cargo do funcionário.
- Aplicar as regras também no banco: esconder o estoque de quem não recebeu acesso e bloquear movimentações não autorizadas.
- Manter diretores com acesso total, sem depender de configurações feitas na tela.
- Registrar quem concedeu ou alterou cada acesso.

## Detalhes técnicos

- Criar uma tabela de acesso ao estoque por usuário, com nível e lista de unidades autorizadas, protegida por RLS.
- Atualizar `can_view_stock()` e `can_manage_stock()` para considerar diretor, estoquista e concessões individuais.
- Remover as regras atuais que deixam qualquer funcionário autenticado visualizar o estoque.
- Atualizar a tela e o menu para consultarem a permissão efetiva do banco.
- Preservar o histórico atual de movimentos e os saldos já registrados.

## Verificação

- Confirmar que PHELIPE abre todas as unidades, cria itens, distribui entradas e administra acessos.
- Confirmar que um usuário com consulta apenas não consegue alterar dados.
- Confirmar que um usuário sem acesso não vê o Estoque e não consegue consultar seus dados diretamente.
- Conferir MADRE ESCOLA nos filtros, cadastros, entradas, retiradas e relatórios.
