
# Plano: Corrigir Cálculo de Idade para Percentis BPA-2

## Problema Identificado

O sistema está calculando a idade do paciente de forma incorreta, fazendo com que os percentis sejam buscados na tabela errada.

### Causa Raiz

No arquivo `CompleteAttendanceDialog.tsx`, a idade está sendo calculada usando:

```typescript
const age = differenceInYears(new Date(), parseISO(data.birth_date));
```

Isso pode causar problemas de timezone. O sistema já possui uma função `calculateAgeBR` em `src/lib/utils.ts` que evita esses problemas, mas ela não está sendo usada.

### Exemplo do Paciente Atual

- **Paciente**: ADRIANA LOUZADA PEREIRA
- **Data de Nascimento**: 1969-09-28
- **Idade Correta**: 56 anos (ainda não fez aniversário em 2026)
- **Faixa Etária BPA-2**: 51-60 anos

---

## Solução

### Arquivo: `src/components/CompleteAttendanceDialog.tsx`

**Mudança 1**: Importar `calculateAgeBR` em vez de `differenceInYears`

```typescript
// ANTES
import { differenceInYears, parseISO } from 'date-fns';

// DEPOIS
import { getTodayLocalISODate, calculateAgeBR } from '@/lib/utils';
```

**Mudança 2**: Usar `calculateAgeBR` no cálculo de idade

```typescript
// ANTES
if (data.birth_date) {
  const age = differenceInYears(new Date(), parseISO(data.birth_date));
  setPatientAge(age);
}

// DEPOIS
if (data.birth_date) {
  const age = calculateAgeBR(data.birth_date);
  setPatientAge(age ?? 0);
}
```

---

## Fluxo Corrigido

```text
1. Usuario abre dialog "Finalizar Atendimento"
2. Sistema busca birth_date do paciente ("1969-09-28")
3. calculateAgeBR("1969-09-28") retorna 56
4. Tabela BPA2_PERCENTILES[56] = TABLE_51_60
5. Percentis sao buscados na tabela correta (51-60 anos)
6. Classificacoes sao calculadas corretamente
```

---

## Validação

Após a correção, para a paciente ADRIANA LOUZADA PEREIRA (56 anos, faixa 51-60):

| Subteste | Escore | Tabela Correta (51-60) |
|----------|--------|------------------------|
| AC = 92  | P50=92 | Percentil 50 (Médio) |
| AD = 104 | P50=104 | Percentil 50 (Médio) |
| AA = 114 | P50=114 | Percentil 50 (Médio) |
| AG = 310 | P25=275, P30=290, P40=314 | Percentil 30 (Médio Inferior) |

---

## Resumo das Alterações

| Arquivo | Mudança |
|---------|---------|
| `CompleteAttendanceDialog.tsx` | Trocar `differenceInYears` por `calculateAgeBR` para cálculo de idade sem problemas de timezone |

---

## Resultado Esperado

- A idade do paciente será calculada corretamente
- Os percentis serão buscados na tabela normativa correta
- As classificações refletirão os dados oficiais do manual BPA-2
