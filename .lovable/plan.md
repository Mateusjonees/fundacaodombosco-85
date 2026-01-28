

# Plano: Melhorar Navegacao de Pacientes

## Problemas Identificados

1. **Scroll nao vai para o topo**: Ao clicar em um paciente, a pagina permanece no mesmo ponto de scroll (geralmente no final da lista)
2. **Perda de estado ao atualizar**: Ao chamar `window.location.reload()` ou atualizar a pagina, o cliente selecionado e perdido
3. **Transicao confusa**: Ao selecionar um paciente diferente, nao ha scroll automatico para o topo

---

## Solucoes

### 1. Scroll para o Topo ao Selecionar Paciente

Adicionar `window.scrollTo(0, 0)` sempre que `setSelectedClient` for chamado.

### 2. Persistir Cliente Selecionado na URL

Usar parametros de URL (`?clientId=xxx`) para manter o estado do cliente selecionado:
- Quando selecionar um paciente: adicionar `clientId` na URL
- Ao carregar a pagina: verificar se existe `clientId` e reabrir o paciente
- Ao voltar para lista: remover o parametro da URL

### 3. Substituir window.location.reload() por React Query

Trocar `window.location.reload()` por invalidacao de cache do React Query, mantendo o cliente selecionado.

---

## Alteracoes

### `src/pages/Clients.tsx`

1. **Criar funcao `handleSelectClient`**:

```typescript
const handleSelectClient = (client: Client) => {
  setSelectedClient(client);
  setSearchParams({ clientId: client.id }, { replace: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

2. **Atualizar efeito de restauracao**:

O codigo ja tem um useEffect que verifica `clientId` na URL (linhas 163-174). Adicionar scroll ao topo quando restaurar:

```typescript
useEffect(() => {
  const clientId = searchParams.get('clientId');
  if (clientId && clients.length > 0) {
    const clientToOpen = clients.find(c => c.id === clientId);
    if (clientToOpen) {
      setSelectedClient(clientToOpen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}, [searchParams, clients]);
```

3. **Atualizar referencias a setSelectedClient**:

- Linha 997: `onView={() => setSelectedClient(client)}` -> `onView={() => handleSelectClient(client)}`
- Linha 1077: `onClick={() => setSelectedClient(client)}` -> `onClick={() => handleSelectClient(client)}`

4. **Atualizar onBack para remover clientId**:

```typescript
const handleBackToList = () => {
  setSelectedClient(null);
  searchParams.delete('clientId');
  setSearchParams(searchParams, { replace: true });
};
```

5. **Trocar window.location.reload()**:

Usar `queryClient.invalidateQueries(['clients'])` ao inves de `window.location.reload()`:

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Substituir window.location.reload() por:
queryClient.invalidateQueries({ queryKey: ['clients'] });
```

---

## Fluxo Resultante

```text
Usuario clica em paciente
        |
        v
handleSelectClient() e chamado
        |
        +---> setSelectedClient(client)
        |
        +---> setSearchParams({ clientId: client.id })
        |
        +---> window.scrollTo({ top: 0 })
        |
        v
Pagina de detalhes aparece no topo

Usuario atualiza pagina (F5)
        |
        v
URL mantem ?clientId=xxx
        |
        v
useEffect detecta clientId
        |
        v
Reabre o mesmo paciente automaticamente
```

---

## Arquivos a Modificar

### `src/pages/Clients.tsx`

1. Adicionar funcao `handleSelectClient` com scroll e persistencia de URL
2. Adicionar funcao `handleBackToList` para limpar URL
3. Atualizar todos os pontos que chamam `setSelectedClient` para usar `handleSelectClient`
4. Substituir `window.location.reload()` por invalidacao de cache
5. Adicionar scroll ao topo no useEffect de restauracao

---

## Resultado

Apos implementacao:
- Ao clicar em um paciente, pagina vai para o topo instantaneamente
- Ao atualizar a pagina (F5), o mesmo paciente permanece aberto
- Navegacao entre pacientes sempre mostra conteudo do topo
- URL reflete o paciente selecionado (permite compartilhar link direto)
- Nenhum reload completo - experiencia mais fluida

