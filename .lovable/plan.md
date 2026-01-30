

# Plano: Relatorio de Estatisticas de Tempo dos Atendimentos

## Objetivo
Adicionar uma nova aba dedicada ao levantamento de horas/minutos dos atendimentos, com calculos detalhados, filtros por periodo (mes, semana, ano), e agrupamentos por profissional, paciente, tipo de atendimento e unidade.

## Funcionalidades

### Nova Aba "Tempo" no Reports.tsx

A pagina de Relatorios ja possui as seguintes abas:
- Atendimentos, Sessoes, Anamneses, Receitas, Laudos, Desempenho, Analytics

Sera adicionada uma nova aba chamada **"Tempo"** com as seguintes funcionalidades:

### 1. Cards de Resumo (Topo)
- **Total de Horas**: Soma de todas as session_duration convertidas para horas
- **Total de Minutos**: Soma total em minutos
- **Media por Atendimento**: Duracao media em minutos
- **Atendimentos Contabilizados**: Quantidade de atendimentos com duracao registrada

### 2. Filtros de Periodo
- **Agrupamento por**: Dia, Semana, Mes, Ano
- **Periodo**: Selector de mes/data inicial/data final (reutiliza os filtros existentes)
- **Profissional**: Combobox para filtrar por funcionario
- **Paciente**: Combobox para filtrar por paciente
- **Unidade**: MADRE, Floresta, Atendimento Floresta
- **Tipo de Atendimento**: Consulta, Terapia, Avaliacao, etc.

### 3. Tabela de Estatisticas Agrupadas
| Periodo | Atendimentos | Horas Totais | Minutos Totais | Media (min) |
|---------|--------------|--------------|----------------|-------------|
| Jan/2025 | 45 | 67h 30min | 4050 | 90 |
| Fev/2025 | 52 | 78h 15min | 4695 | 90.3 |

### 4. Tabela por Profissional
| Profissional | Atendimentos | Horas | Media | % do Total |
|--------------|--------------|-------|-------|------------|
| Maria Silva | 28 | 42h | 90min | 35% |
| Joao Santos | 17 | 25h 30min | 90min | 21% |

### 5. Tabela por Tipo de Atendimento
| Tipo | Atendimentos | Horas | Media |
|------|--------------|-------|-------|
| Terapia | 35 | 52h 30min | 90min |
| Avaliacao | 15 | 22h 30min | 90min |

### 6. Exportacao PDF
Botao para gerar PDF com todo o relatorio de tempo contendo:
- Resumo geral
- Estatisticas por periodo
- Estatisticas por profissional
- Estatisticas por tipo

## Detalhes Tecnicos

### Arquivo a Modificar

**src/pages/Reports.tsx**

### Novas Funcoes de Calculo

```text
getTotalMinutes()
- Soma session_duration de todos os attendanceReports filtrados

getTotalHours()
- Converte total de minutos para horas decimais

formatHoursMinutes(totalMinutes)
- Formata como "Xh Ymin"

getTimeByPeriod(groupBy: 'day' | 'week' | 'month' | 'year')
- Agrupa atendimentos por periodo
- Retorna array com: periodo, count, totalMinutes, avgMinutes

getTimeByEmployee()
- Agrupa por employee_id
- Retorna: nome, count, totalMinutes, avgMinutes, percentual

getTimeByType()
- Agrupa por attendance_type
- Retorna: tipo, count, totalMinutes, avgMinutes
```

### Nova TabsTrigger e TabsContent

```text
<TabsTrigger value="tempo">
  <Clock className="h-4 w-4 mr-2" />
  Tempo
</TabsTrigger>

<TabsContent value="tempo">
  ... componente completo com cards, tabelas e filtros
</TabsContent>
```

### Estrutura do Layout

```text
+------------------------------------------+
|  [Card]      [Card]      [Card]   [Card] |
|  Total Hrs   Tot. Min    Media    Count  |
+------------------------------------------+
|  Filtros: [Agrupar Por] [Exportar PDF]   |
+------------------------------------------+
|  Tabela de Estatisticas por Periodo      |
|  - Data/Semana/Mes | Atend. | Horas | Med|
+------------------------------------------+
|  [Accordion: Por Profissional]           |
|  [Accordion: Por Tipo de Atendimento]    |
+------------------------------------------+
```

### Dependencia Existente
- Ja existe a funcao `getAverageDuration()` que calcula duracao media
- Campo `session_duration` armazena duracao em minutos (number)
- Filtros de periodo ja existem e serao reutilizados

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| src/pages/Reports.tsx | Adicionar nova aba "Tempo" com estatisticas detalhadas |
| src/pages/Reports.tsx | Novas funcoes de calculo e agrupamento |
| src/pages/Reports.tsx | Funcao de exportar PDF especifico de tempo |

## Resultado Esperado

O usuario podera:
1. Ver o total de horas/minutos trabalhados no periodo
2. Agrupar por dia, semana, mes ou ano
3. Ver estatisticas por profissional individual
4. Ver estatisticas por tipo de atendimento
5. Exportar um PDF com todas as informacoes de tempo
6. Aplicar todos os filtros existentes (funcionario, paciente, unidade, tipo)

