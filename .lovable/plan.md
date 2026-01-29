
# Plano: Corrigir Faixas Etárias dos Testes Neuropsicológicos

## Objetivo
Atualizar as definições de idade mínima e máxima de cada teste neuropsicológico para refletir os dados presentes nas tabelas normativas.

---

## Alterações Necessárias

### 1. BPA-2 (Nenhuma alteração necessária)
- **Configuração atual**: 6-81 anos
- **Tabelas disponíveis**: 6 anos até 81+ anos
- **Status**: Correto

### 2. RAVLT
- **Configuração atual**: 6-81 anos  
- **Configuração correta**: 6-89 anos (Tabela 80+ cobre até pelo menos 89 anos)

**Arquivo**: `src/data/neuroTests/ravlt.ts`
```typescript
// De:
minAge: 6,
maxAge: 81,

// Para:
minAge: 6,
maxAge: 89,
```

### 3. FDT
- **Configuração atual**: 6-81 anos  
- **Configuração correta**: 6-99 anos (Tabela 76+ não tem limite superior definido)

**Arquivo**: `src/data/neuroTests/fdt.ts`
```typescript
// De:
minAge: 6,
maxAge: 81,

// Para:
minAge: 6,
maxAge: 99,
```

---

## Resumo Final das Faixas Etárias

| Teste | Idade Mínima | Idade Máxima |
|-------|--------------|--------------|
| BPA-2 | 6 anos | 81 anos |
| RAVLT | 6 anos | 89 anos |
| FDT   | 6 anos | 99 anos |

---

## Impacto da Mudança

- Pacientes com idade entre 82-89 anos terão acesso ao teste RAVLT
- Pacientes com idade entre 82-99 anos terão acesso ao teste FDT
- A seleção de testes na tela de conclusão de atendimento mostrará os testes corretos para cada idade

---

## Arquivos a Modificar

1. `src/data/neuroTests/ravlt.ts` - Alterar maxAge de 81 para 89
2. `src/data/neuroTests/fdt.ts` - Alterar maxAge de 81 para 99
