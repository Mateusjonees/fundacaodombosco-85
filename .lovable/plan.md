

## Problema Identificado

O botao "Excluir" na tela de detalhes do paciente nao funciona porque o dialog de confirmacao nunca aparece.

### Causa Raiz

No arquivo `src/pages/Clients.tsx`, quando um paciente esta aberto na visualizacao de detalhes, o componente faz um **return antecipado** na linha 650-664 (renderizando apenas o `ClientDetailsView`). O dialog de confirmacao de exclusao esta definido **depois** desse return, na linha 1372, portanto nunca e renderizado quando o usuario esta na tela de detalhes.

```text
Fluxo atual:
  activeClient existe? 
    SIM --> return <ClientDetailsView /> (sai aqui)
    NAO --> renderiza lista + dialog de exclusao (linha 1372)
                                    ^^ nunca alcancado
```

### Solucao

Mover o dialog de confirmacao de exclusao para **dentro** do bloco de return antecipado (linhas 650-664), de forma que ele seja renderizado mesmo quando o usuario esta visualizando os detalhes do paciente.

### Detalhes Tecnicos

**Arquivo:** `src/pages/Clients.tsx`

**Alteracao:** No bloco de return antecipado (linha 650-664), adicionar o dialog de confirmacao de exclusao como elemento irmao do `ClientDetailsView`, dentro de um fragment (`<>...</>`). Isso garantira que o dialog esteja presente no DOM quando `deleteConfirmClient` for definido.

O dialog existente na linha 1372 permanecera para cobrir o cenario de exclusao a partir da lista de pacientes.

