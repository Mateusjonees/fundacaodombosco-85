

## Atualizar Gabriel Arcanjo para Recepcionista do Atendimento Floresta

Gabriel Arcanjo de Paula Peixoto (user_id: `72c334c0-97a3-4b9c-a78b-751ceefa8cc9`) atualmente e `intern` sem unidade definida.

### O que sera feito

Atualizar o perfil dele com:
- **Cargo**: `receptionist` (que ja inclui permissoes de `create_clients`, `edit_clients`, `view_clients`, `create_schedules`, `edit_schedules`, `view_schedules`)
- **Unidade**: `atendimento_floresta`

### Operacao

Uma unica query UPDATE na tabela `profiles`:

```sql
UPDATE profiles 
SET employee_role = 'receptionist', unit = 'atendimento_floresta', updated_at = now()
WHERE user_id = '72c334c0-97a3-4b9c-a78b-751ceefa8cc9';
```

Nenhuma alteracao de codigo necessaria -- o cargo de recepcionista ja possui todas as permissoes solicitadas no sistema.

