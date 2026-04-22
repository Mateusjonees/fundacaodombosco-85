

## Correção do FDT — Valor Zero e Cards de Interpretação

### Problema 1: Valor ZERO nos erros (e tempos)
O campo de input usa `value={scores[key] || ''}` — quando o valor é `0`, JavaScript avalia `0 || ''` como string vazia, apagando o número digitado. Além disso, o badge de percentil só aparece quando `scores[key] > 0`, ignorando o zero como resultado válido.

### Problema 2: Nomenclatura e interpretação textual
Não existem cards textuais explicando a interpretação clínica de cada variável do FDT (Leitura, Contagem, Escolha, Alternância, Erros, Inibição, Flexibilidade).

### Correções

#### 1. Corrigir leitura do valor zero (`NeuroTestFDTForm.tsx`)
- Trocar `value={scores[key] || ''}` por uma verificação explícita: `value={scores[key] === 0 && !fieldTouched ? '' : scores[key]}` ou mais simples: usar string state para os inputs, convertendo para número no cálculo
- Abordagem mais limpa: mudar para `value={scores[key] !== undefined ? scores[key] : ''}` — como o estado sempre tem um número, basta usar `value={scores[key]}` diretamente (mostrará "0")
- Corrigir a condição dos badges: trocar `scores[key] > 0` por `scores[key] >= 0` (ou simplesmente `true`, pois o valor sempre existe) para que o percentil apareça mesmo com zero

#### 2. Adicionar cards de interpretação textual (`NeuroTestFDTForm.tsx`)
- Criar um mapeamento de nomenclatura clínica por variável do FDT com descrições curtas:
  - **Leitura**: Velocidade de processamento automático
  - **Contagem**: Velocidade de processamento controlado
  - **Escolha**: Controle inibitório (atenção seletiva)
  - **Alternância**: Flexibilidade cognitiva (alternância atencional)
  - **Erros Leitura/Contagem/Escolha/Alternância**: Acurácia em cada etapa
  - **Inibição**: Capacidade de inibir resposta automática
  - **Flexibilidade**: Capacidade de alternar entre regras
- Cada resultado (tempo e erro) terá um card individual exibindo: nome da variável, valor bruto, percentil, classificação e uma breve interpretação textual baseada na classificação obtida
- Exemplo de interpretação: "Desempenho na faixa Média — velocidade de processamento automático dentro do esperado para a faixa etária"

### Arquivos alterados
- `src/components/NeuroTestFDTForm.tsx` — corrigir value/zero, adicionar cards interpretativos

