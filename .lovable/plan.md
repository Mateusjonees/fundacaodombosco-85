
## Alterar nome do app no celular para "Clínica"

O nome que aparece no celular (ícone na tela inicial e splash screen) é controlado pelo manifesto PWA no arquivo `vite.config.ts`.

### Alteração

**Arquivo**: `vite.config.ts`

- `name`: de `'Sistema Fundação Dom Bosco'` para `'Clínica'`
- `short_name`: de `'FDB Sistema'` para `'Clínica'`

O `short_name` é o que aparece embaixo do ícone na tela inicial do celular. O `name` aparece na splash screen ao abrir o app.

### Detalhes técnicos

Linhas 23-24 do `vite.config.ts`:
```
name: 'Clínica',
short_name: 'Clínica',
```

Após a alteração, usuários que já instalaram o app podem precisar desinstalar e reinstalar para ver o novo nome.
