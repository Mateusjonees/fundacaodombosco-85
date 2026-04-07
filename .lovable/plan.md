

## Plano: Funcionamento Offline Completo do PWA

### Problema Principal

O app tem a infraestrutura offline (IndexedDB, syncQueue, Service Worker), mas **não funciona offline** por 3 razões críticas:

1. **Autenticação bloqueia tudo**: O `AuthProvider` chama `supabase.auth.getSession()` que falha sem internet. Resultado: tela de loading infinita ou tela de login.
2. **Sessão não sobrevive ao reload offline**: Supabase guarda sessão no localStorage, mas o `onAuthStateChange` tenta validar online e falha.
3. **Dados pré-carregados não vão para IndexedDB**: O `useAppPreload` salva apenas no React Query (memória), que se perde ao reabrir o app.

### Solução em 4 Etapas

#### 1. Auth offline-resilient
Modificar `AuthProvider.tsx` para:
- Quando offline, ler sessão do `localStorage` diretamente (Supabase já salva lá)
- Pular validação de perfil (`is_active`, `must_change_password`) quando offline
- Permitir que o app carregue com sessão cached mesmo sem internet

#### 2. Salvar dados críticos no IndexedDB após login
Modificar `useAppPreload.ts` para persistir no IndexedDB:
- Perfil do usuário + permissões
- Lista de clientes vinculados
- Agendamentos da semana
- Dados de funcionários (para coordenadores)

Criar novo store `userSession` no IndexedDB para guardar perfil e role.

#### 3. Hooks com fallback offline real
Garantir que `useClients`, `useSchedules`, `useMedicalRecords` e `useCurrentUser` carreguem do IndexedDB quando offline, sem tentar Supabase primeiro.

#### 4. Ajustar Service Worker / Workbox
- Aumentar cache do Supabase API de 300s para 24h (para dados estáticos como perfil)
- Adicionar `navigateFallbackDenylist: [/^\/~oauth/]`
- Garantir que `devOptions: { enabled: false }` está configurado

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/auth/AuthProvider.tsx` | Fallback offline para sessão cached |
| `src/hooks/useAppPreload.ts` | Persistir dados no IndexedDB |
| `src/utils/offlineDB.ts` | Adicionar store `userSession` (bump DB_VERSION) |
| `src/hooks/useCurrentUser.ts` | Fallback IndexedDB quando offline |
| `src/hooks/useClients.ts` | Já tem fallback, verificar consistência |
| `vite.config.ts` | Ajustar workbox config, adicionar denylist |
| `src/main.tsx` | Guard para não registrar SW em iframe/preview |

### Detalhes Técnicos

**AuthProvider offline**:
```text
getSession() falha?
  → Ler localStorage "sb-vqphtzkdhfzdwbumexhe-auth-token"
  → Se tem sessão válida (não expirada), usar como user
  → Pular check de is_active / must_change_password
  → Marcar flag "offlineSession = true"
```

**IndexedDB novo store**:
```text
DB_VERSION: 1 → 2
Novo store: "user_session" (keyPath: "key")
Conteúdo: { key: "profile", data: { user_id, name, role, permissions, unit } }
```

**Workbox ajustado**:
```text
- Supabase API cache: maxAgeSeconds 86400 (24h) 
- navigateFallbackDenylist: [/^\/~oauth/]
- devOptions: { enabled: false }
```

