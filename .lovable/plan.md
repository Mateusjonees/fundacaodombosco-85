# Corrigir senha no celular e erros visíveis

## Objetivo
Garantir que o campo de senha possa ser tocado, digitado, selecionado e exibido corretamente em iPhone e Android, começando pela tela de login.

## Alterações
- Ajustar o formulário de login para teclado móvel, preenchimento automático e tamanho de texto compatível com iPhone.
- Corrigir o botão de mostrar/ocultar senha para não roubar o foco nem bloquear o toque no campo.
- Fazer a tela acompanhar o teclado virtual sem esconder ou travar os campos.
- Aplicar a mesma proteção aos outros campos de senha do sistema que apresentarem o mesmo padrão.
- Remover o aviso atual da imagem do login e separar avisos normais de notificações bloqueadas de erros reais.

## Validação
- Testar digitação, seleção e mostrar/ocultar senha em viewport de celular.
- Conferir o envio do formulário sem expor credenciais.
- Revisar erros do navegador e confirmar que a aplicação continua compilando.
