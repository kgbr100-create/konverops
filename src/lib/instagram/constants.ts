export const DEFAULT_PUBLIC_REPLY_VARIATIONS: string[] = [
  'Acabei de te enviar no Direct! 💙 Dá uma olhadinha na sua caixa de mensagens!',
  'Enviado no seu Direct com muito carinho! ✨ Olha lá na sua caixa de entrada!',
  'Te mandei agora mesmo no Direct! 💙 Se não aparecer na aba principal, confere nas Solicitações de Mensagem!',
  'Prontinho! Acabei de mandar o material no seu Direct! 💙✨',
];

export const DEFAULT_FOLLOW_GATE_TEXT =
  'Oi{nome}! 💙 Vi que você ainda não segue o @kit.autismo!\n\nSiga nosso perfil rapidinho e toque no botão abaixo para eu liberar seu acesso gratuitamente aqui no Direct:';

export const DEFAULT_FOLLOW_GATE_RETRY_TEXT =
  'Oi{nome}! 💙 Ainda não apareceu aqui pra mim que você seguiu o @kit.autismo.\n\nToque em "Abrir @kit.autismo", clique em Seguir lá no perfil e depois toque no botão de confirmação abaixo:';

export const DEFAULT_TWO_STEP_PROMPT_TEXT =
  'Oi{nome}! 💙 Separei o conteúdo que você pediu no nosso post!\n\nToque no botão abaixo para eu liberar o acesso completo aqui no seu Direct:';

/** Templates rápidos de 2 Etapas (Opening DM) para não ficar engessado em "Guia" */
export const TWO_STEP_TEMPLATES = [
  {
    id: 'material',
    label: '🎁 Material / Kit Prático',
    promptText:
      'Oi{nome}! 💙 Separei o material prático que você pediu no nosso post!\n\nToque no botão abaixo para receber o acesso completo aqui no seu Direct:',
    buttonTitle: '🎁 Liberar Material',
  },
  {
    id: 'tutorial',
    label: '🎬 Tutorial / Passo a Passo',
    promptText:
      'Oi{nome}! 💙 Preparei o tutorial passo a passo que você comentou no post!\n\nToque no botão abaixo para assistir e aplicar hoje mesmo:',
    buttonTitle: '🎬 Ver Tutorial',
  },
  {
    id: 'guia',
    label: '📄 Guia / PDF Visual',
    promptText:
      'Oi{nome}! 💙 Seu Guia Visual já está separado aqui pra você!\n\nToque no botão abaixo para abrir o guia completo no seu Direct:',
    buttonTitle: '📄 Abrir meu Guia',
  },
  {
    id: 'aula',
    label: '▶️ Aula / Vídeo Exclusivo',
    promptText:
      'Oi{nome}! 💙 Que bom ver seu comentário! Separei o link da aula exclusiva pra você.\n\nToque no botão abaixo para liberar o vídeo:',
    buttonTitle: '▶️ Assistir Aula',
  },
  {
    id: 'link',
    label: '🔗 Link Direto / Ferramenta',
    promptText:
      'Oi{nome}! 💙 Separei o link direto com as orientações que você pediu!\n\nToque no botão abaixo para acessar:',
    buttonTitle: '🔗 Receber o Link',
  },
];
