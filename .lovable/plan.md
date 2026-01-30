
# Plano: Adicionar Botao de Copiar Linha Individual nos Testes

## Contexto
O sistema de testes neuropsicologicos exibe os resultados em tabelas com colunas: Variavel, Bruto, Percentil, Classificacao. Atualmente existe apenas o botao "Copiar para Laudo" que copia todos os dados do teste. O usuario quer poder copiar **cada linha individualmente**.

## Objetivo
Adicionar um botao de copiar ao lado de cada linha na tabela de resultados dos testes, permitindo copiar apenas aquela linha especifica para usar em laudos ou documentos.

## Implementacao

### Arquivos a Modificar

**1. src/components/PatientNeuroTestHistory.tsx**
- Adicionar botao de copiar em cada linha da tabela de resultados (linhas 570-595)
- O botao ficara na ultima coluna ou como um icone discreto
- Formato do texto copiado: `[Nome do Teste] - [Variavel]: Bruto [valor], Percentil [valor], Classificacao [valor]`

**2. src/components/NeuroTestResults.tsx**
- Este componente tambem exibe resultados de testes (usado na validacao de atendimentos)
- Aplicar a mesma logica de botao de copiar por linha

## Detalhes Tecnicos

### Formato do Texto Copiado
Exemplo para BPA-2:
```
BPA-2 - Atencao Concentrada (AC): Bruto 85, Percentil 50, Classificacao Media
```

### Layout do Botao
- Icone pequeno de clipboard (ClipboardCopy) no inicio ou fim de cada linha
- Aparece ao passar o mouse (hover) para nao poluir visualmente
- Ao clicar, mostra toast de confirmacao "Linha copiada!"

### Alteracoes na Tabela
```text
Antes:
| Variavel           | Bruto | Percentil | Classificacao |
| Atencao Concentrada|   85  |     50    |     Media     |

Depois:
| Variavel           | Bruto | Percentil | Classificacao | Copiar |
| Atencao Concentrada|   85  |     50    |     Media     |   [icon] |
```

Ou alternativamente, o icone pode ficar na coluna Variavel, antes do nome.

## Resumo das Mudancas

| Arquivo | Mudanca |
|---------|---------|
| PatientNeuroTestHistory.tsx | Adicionar coluna/botao de copiar em cada linha da tabela |
| NeuroTestResults.tsx | Mesma funcionalidade para consistencia |

## Beneficios
- Permite copiar resultados individuais para laudos
- Maior flexibilidade ao compor documentos clinicos
- Interacao rapida sem precisar copiar e editar texto completo
