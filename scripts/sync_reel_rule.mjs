import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const getRes = await fetch('https://www.konverops.tech/api/instagram/rules');
  const getData = await getRes.json();
  const currentRules = getData.rules || [];

  const newRule = {
    id: 'regra-reel-codigo-autismo-18114422954165890',
    name: 'Reels - Código do Autismo (3 Direitos Vitais)',
    triggerType: 'comment',
    triggerChannels: ['comment'],
    postScope: 'specific',
    storyScope: 'any',
    targetMediaIds: ['18114422954165890'],
    targetStoryIds: [],
    matchMode: 'whole_word',
    wholeWordMatch: true,
    keywords: ['direitos', 'direito', 'codigo', 'cartilha', 'lei', 'leis'],
    excludeKeywords: [],
    replyText: `Aqui está o seu Guia dos Direitos do Código do Autismo, {nome}! 💙⚖️\n\n1️⃣ LAUDO COM VALIDADE INDETERMINADA\n• Fundamento: Leis Estaduais de Laudo Permanente e PL do Código do Autismo.\n• O que diz: Autismo é neurodivergência congênita e permanente. É ilegal o plano de saúde, escola ou órgão público exigir renovação periódica de laudo médico.\n\n2️⃣ TERAPIAS ILIMITADAS (SEM TETO DE SESSÕES)\n• Fundamento: Resolução Normativa ANS nº 539/2022 e Tema 1069 do STJ.\n• O que diz: Se o médico prescreveu 20h/semana de ABA, Fono ou TO, o convênio NÃO pode limitar sessões nem interromper tratamento.\n\n3️⃣ MEDIADOR ESCOLAR SEM TAXA EXTRA\n• Fundamento: Lei Berenice Piana (Lei 12.764/12, art. 3º, IV) e Lei Brasileira de Inclusão (Lei 13.146/15).\n• O que diz: A escola (pública ou particular) é obrigada a fornecer profissional de apoio quando comprovada a necessidade. Cobrar qualquer mensalidade ou taxa extra é CRIME punível com reclusão e multa.\n\n---\n📋 MODELO PARA COPIAR E ENVIAR SE PRECISAR:\n"Com base no art. 3º da Lei Federal 12.764/12 e na Lei 13.146/15, solicito a imediata disponibilização do profissional de apoio escolar / cobertura integral das terapias prescritas no laudo, sem ônus adicional, sob pena de notificação aos órgãos de fiscalização e Ministério Público."\n---\n\n💙 Guarde esta mensagem nos seus favoritos do Direct para consultar e apresentar sempre que precisar! Esperamos que esse guia traga segurança para os direitos do seu pequeno. Estamos sempre por aqui! ✨`,
    publicReplyEnabled: true,
    publicReplyVariations: [
      'Enviei o guia prático dos 3 direitos no seu Direct! Dá uma olhada lá 💙',
      'Separei os detalhes e o modelo no seu Direct! ⚖️✨',
      'Acabei de te enviar no Direct! Dá uma olhadinha lá 💙',
    ],
    requireFollow: true,
    followGateText: 'Oi{nome}! 💙 Para receber o Guia Prático com os 3 Direitos Vitais do Código do Autismo, você precisa seguir o nosso perfil @kit.autismo.\n\nSiga o perfil e depois toque no botão abaixo para desbloquear imediatamente:',
    followGateButtonTitle: '✅ Já segui! Liberar',
    followGateRetryText: 'Ainda não identifiquei que você está seguindo o @kit.autismo, {nome}! 💙\n\nDê uma olhada no nosso perfil, clique em Seguir e depois toque no botão abaixo para eu liberar o guia para você:',
    twoStepCommentOptIn: true,
    twoStepPromptText: 'Oi{nome}! 💙 Separei o Guia Prático com os 3 Direitos Vitais do Código do Autismo que você pediu no nosso Reel!\n\nToque no botão abaixo para desbloquear o conteúdo completo aqui no seu Direct:',
    twoStepButtonTitle: '📄 Liberar Guia',
    humanTypingDelay: true,
    active: true,
    priority: 1,
  };

  const updatedRules = [newRule, ...currentRules.filter((r) => r.id !== newRule.id)];

  // 1. Envia para a API de produção da Konverops
  const postRes = await fetch('https://www.konverops.tech/api/instagram/rules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer konverops-admin-auth-secret-key-2026-kelvin',
    },
    body: JSON.stringify({ rules: updatedRules }),
  });
  const postData = await postRes.json();
  console.log('API Konverops POST Result:', postData);

  // 2. Salva localmente em F:\Startup\konverops\src\data\instagram-rules.json
  const localFile = path.resolve('src/data/instagram-rules.json');
  fs.writeFileSync(localFile, JSON.stringify(updatedRules, null, 2), 'utf8');
  console.log('Saved locally to:', localFile);
}

main().catch(console.error);
