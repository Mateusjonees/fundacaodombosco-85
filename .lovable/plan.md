
# Plan: Fix All Neuro Test Percentile + Classification Display

## Problem Summary
The user wants ALL neuro tests to display results consistently like the RAVLT example: `P<5 • Inferior`, `P25 • Médio Inferior`, etc. Currently:

1. **Key mismatches in save logic** — Some tests save percentiles/classifications with keys that don't match the display config (e.g., PCFO saves `geral` but display expects `escorePadrao`; FVA saves `classificacaoAnimais` but display expects `percentilAnimais`)
2. **Empty percentiles** — Some tests (FDT, PCFO) save empty `percentiles` objects despite the form producing valid data
3. **Missing percentile ranges** — Tests like TIN, PCFO, TSBC, TRILHAS use Standard Scores (EP) instead of percentile ranges, but should display the EP value with classification

## What Needs to Change

### 1. Fix CompleteAttendanceDialog.tsx — Save Logic Key Alignment

For each test, ensure `percentiles` and `classifications` JSON objects use the **exact same keys** as `getTestConfig()` expects:

| Test | Display Keys | Current Save Keys (broken) | Fix |
|------|-------------|---------------------------|-----|
| FDT | `inibicao`, `flexibilidade` | Empty `{}` | Save `fdtResults.percentiles` and `fdtResults.classifications` directly (already correct in code, but verify `|| {}` isn't swallowing data) |
| PCFO | `escorePadrao` | `geral` (classification) | Map `classifications: { escorePadrao: pcfoResults.classifications.geral }` |
| FVA | `percentilAnimais`, `percentilFrutas`, `percentilPares` | `classificacaoAnimais` etc. | Already fixed in previous iteration — verify |
| TIN | `escorePadrao` | correct percentiles but classifications may use wrong key | Verify `tinResults.classifications` key matches `escorePadrao` |
| TSBC | `escorePadraoOD`, `escorePadraoOI` | `classificacaoOD`, `classificacaoOI` | Already mapped — verify |
| TRILHAS | `trilhaA`, `trilhaB` | `sequenciasA`, `sequenciasB` | Already mapped — verify |
| TRPP | `total` | correct | Verify |
| BNTBR | `percentil` | correct | Verify |
| FAS | `percentil` | correct | Verify |
| TOM | `percentil` | correct | Verify |
| TAYLOR | `copia`, `reproducaoMemoria` | correct | Verify |
| FPT_INFANTIL | `desenhosUnicos` | correct | Verify |
| FPT_ADULTO | `desenhosUnicos` | correct | Verify |
| TMT_ADULTO | `tempoA`, `tempoB`, `tempoBA` | passthrough | Verify keys match |
| HAYLING_ADULTO | `parteA`, `parteB`, `total` | passthrough | Verify |
| HAYLING_INFANTIL | `parteATempo`, `parteBTempo`, `parteBErros`, `inibicaoBA` | correct | Already working |
| TFV | `fluenciaLivre`, `fluenciaFonemica`, `fluenciaSemantica` | correct | Already working |

### 2. Fix Display for Standard Score Tests (TIN, PCFO, TSBC, TRILHAS, TRPP)

These tests use **Escore Padrão** (EP) instead of percentile. The badge should show `EP{value} • {classification}` instead of `P{value} • ...`. Update the rendering in both `PatientNeuroTestHistory.tsx` and `NeuroTestResults.tsx` to detect when a test uses EP and display accordingly.

### 3. Fix Calculated Scores Display for RAVLT

The RAVLT "Escores Calculados" section (ALT, Vel. Esquecimento, Int. Proativa, Int. Retroativa) should show their qualitative interpretation badges in the results table. Currently the RAVLT save logic injects these classifications but the display may show them as `-` if the `percentiles` field doesn't have entries for these keys.

For calculated indices without normative percentiles (ALT, VE, IP, IR):
- Don't show a percentile prefix, just the classification badge (e.g., `Curva +`, `Prejuízo`, `Interferência`)

### Files to Edit

1. **`src/components/CompleteAttendanceDialog.tsx`** — Fix key mappings for PCFO, and ensure all tests save with correct aligned keys
2. **`src/components/PatientNeuroTestHistory.tsx`** — Update badge rendering to handle EP-based tests (prefix `EP` instead of `P` for standard score tests)
3. **`src/components/NeuroTestResults.tsx`** — Same badge rendering updates for consistency

### Technical Approach

Add a helper set of EP-based test codes: `['TIN', 'PCFO', 'TSBC', 'TRILHAS', 'TRILHAS_PRE_ESCOLAR', 'TRPP']`

In the badge rendering logic:
```
const isEPTest = EP_TESTS.includes(testCode);
const prefix = isEPTest ? 'EP' : 'P';
// Display: "{prefix}{value} • {classification}"
```

For RAVLT calculated indices (alt, velocidadeEsquecimento, etc.), show only the classification without a P prefix since they don't have normative percentiles.
