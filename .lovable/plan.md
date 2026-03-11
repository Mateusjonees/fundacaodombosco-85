

## Verificação: Permissões da Tatiana (Neuro Avaliação)

### Situação Atual — Já Configurado

Tatiana Souto da Silveira (`coordinator_floresta`) **já possui** as permissões solicitadas:

1. **Visualizar aba Financeiro**: Ela tem a permissão `view_financial` concedida na tabela `user_specific_permissions` e seu cargo `coordinator_floresta` está incluído na lista de acesso do `Financial.tsx`.

2. **Interagir na aba "A Receber"**: A variável `canMarkPayments` inclui `coordinator_floresta`, permitindo que ela marque parcelas como pagas.

3. **Restrição inteligente**: Como `isCoordinatorOnly` é `true` para ela, o sistema automaticamente oculta as outras abas (Receitas, Despesas, Notas, Projeção, Inadimplência, Centro Custo), exibindo apenas a aba **"A Receber"**.

### Conclusão

Nenhuma alteração de código ou banco de dados é necessária. Tatiana já pode:
- Acessar `/financial` pelo menu lateral
- Visualizar a aba "A Receber" com todos os contratos pendentes
- Marcar parcelas individuais como pagas

Se ela estiver relatando problemas de acesso, pode ser necessário verificar se ela está logada corretamente ou se há algum cache de permissões desatualizado (basta fazer logout e login novamente).

