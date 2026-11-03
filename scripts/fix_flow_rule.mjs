import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const getRes = await fetch('https://www.konverops.tech/api/instagram/rules');
  const getData = await getRes.json();
  const currentRules = getData.rules || [];

  const part1Rights = `Aqui está o seu Guia dos Direitos do Código do Autismo, {nome}! 💙⚖️\n\n1️⃣ LAUDO COM VALIDADE INDETERMINADA\n• Autismo não é doença, não passa e não tem cura. Exigir renovação periódica de laudo médico para manter terapias, escola ou benefícios é ilegal (PL do Código do Autismo e leis estaduais).\n\n2️⃣ TERAPIAS ILIMITADAS\n• Resolução ANS nº 539/2022 e STJ (Tema 1.069 / Tema 1.295): planos de saúde são proibidos de fixar teto ou limite de sessões (ABA, Fono, TO) com prescrição médica.\n\n3️⃣ APOIO ESCOLAR GRATUITO\n• Lei Berenice Piana (Lei 12.764/12) e LBI (Lei 13.146/15): a escola (pública ou particular) é obrigada a fornecer profissional de apoio sem cobrar nenhuma taxa extra. Cobrança adicional é crime!`;

  const part2Model = `📋 MODELO PARA COPIAR E ENVIAR SE PRECISAR:\n\n"Com base no art. 3º da Lei Federal 12.764/12 e no Tema 1.069 do STJ, solicito a imediata disponibilização do profissional de apoio escolar / cobertura integral das terapias prescritas no laudo, sem ônus adicional, sob pena de notificação aos órgãos de fiscalização e Ministério Público."\n\n💙 Guarde esta mensagem nos seus favoritos do Direct para consultar e apresentar sempre que precisar! Esperamos que esse guia traga segurança para os direitos do seu pequeno. Estamos sempre por aqui! ✨`;

  console.log(`Part 1 length: ${part1Rights.length} chars`);
  console.log(`Part 2 length: ${part2Model.length} chars`);

  const updatedRule = {
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
    keywords: ['direitos', 'direito', 'direto', 'diretos', 'codigo', 'código', 'cartilha', 'lei', 'leis'],
    excludeKeywords: [],
    replyText: part1Rights,
    followUpEnabled: true,
    followUpText: part2Model,
    publicReplyEnabled: true,
    publicReplyVariations: [
      'Enviei o guia prático dos 3 direitos no seu Direct! Dá uma olhada lá 💙',
      'Separei os detalhes e o modelo no seu Direct! ⚖️✨',
      'Acabei de te enviar no Direct! Dá uma olhadinha lá 💙',
    ],
    requireFollow: false,
    twoStepCommentOptIn: true,
    twoStepPromptText: 'Oi{nome}! 💙 Separei o Guia Prático com os 3 Direitos Vitais do Código do Autismo que você pediu no nosso Reel!\n\nToque no botão abaixo para desbloquear o conteúdo completo aqui no seu Direct:',
    twoStepButtonTitle: '📄 Liberar Guia',
    humanTypingDelay: true,
    active: true,
    priority: 1,
  };

  const updatedRules = [updatedRule, ...currentRules.filter((r) => r.id !== updatedRule.id)];

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
  const localFile = path.resolve('F:/Startup/konverops/src/data/instagram-rules.json');
  fs.writeFileSync(localFile, JSON.stringify(updatedRules, null, 2), 'utf8');
  console.log('Saved locally to:', localFile);
}

main().catch(console.error);
