export default function Home() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Background Glow Accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-emerald-500/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-[700px] -left-40 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-[1400px] -right-40 w-[600px] h-[600px] bg-emerald-500/5 blur-[140px] rounded-full" />

      {/* Grid Pattern Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Navigation Bar */}
      <header className="relative z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 font-mono text-lg font-black text-black shadow-lg shadow-emerald-500/20">
              K
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg font-bold tracking-tight text-white">
                konverops<span className="text-emerald-400">.tech</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                Engenharia de Vendas & Mídia
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <a href="#solucoes" className="transition hover:text-white">
              Soluções
            </a>
            <a href="#arquitetura" className="transition hover:text-white">
              Infraestrutura
            </a>
            <a href="#inteligencia" className="transition hover:text-white">
              Inteligência Artificial
            </a>
            <a href="#metodologia" className="transition hover:text-white">
              Metodologia
            </a>
            <a href="#sobre" className="transition hover:text-white">
              Sobre
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operações Ativas
            </div>
            <a
              href="mailto:contato@konverops.tech"
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 shadow-sm shadow-emerald-500/20"
            >
              Agendar Reunião
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-20 text-center lg:pt-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md mb-8">
          <span className="text-emerald-400 font-semibold font-mono">ENGENHARIA DE VENDAS</span>
          <span className="text-zinc-600">•</span>
          <span>AQUISIÇÃO & TRÁFEGO AVANÇADO B2B E VAREJO</span>
        </div>

        <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Engenharia de Vendas &{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Infraestrutura de Performance.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Transformamos orçamento de mídia em receita previsível. Combinamos gestão avançada de{" "}
          <strong className="text-zinc-200">Meta Ads</strong>, páginas ultrarrápidas em{" "}
          <strong className="text-zinc-200">Next.js</strong>, agentes conversacionais inteligentes e
          modelos preditivos de IA para escalar operações comerciais com rigor técnico.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:contato@konverops.tech?subject=Diagnóstico%20de%20Performance%20-%20Konverops"
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-400 px-8 font-semibold text-black transition hover:bg-emerald-300 shadow-lg shadow-emerald-500/25"
          >
            <span>Solicitar Diagnóstico Comercial</span>
            <span className="text-base font-bold">→</span>
          </a>
          <a
            href="#solucoes"
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-8 font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            Conhecer Nossas Soluções
          </a>
        </div>

        {/* Key Metrics Bar */}
        <div className="mt-16 grid grid-cols-2 gap-4 border-y border-zinc-800/80 py-8 sm:grid-cols-4 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">+98%</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Precisão de Telemetria CAPI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">&lt; 0.8s</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Carregamento de Páginas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">3.8x</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">ROAS Médio em Campanhas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">24/7</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Atendimento Automatizado</div>
          </div>
        </div>

        {/* Real-time Telemetry Dashboard Mockup */}
        <div id="arquitetura" className="mt-16 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left shadow-2xl backdrop-blur-xl max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Konverops Telemetry Node: Monitoramento em Tempo Real
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
              <span>SISTEMAS OPERACIONAIS</span>
              <span>•</span>
              <span className="text-emerald-400">LATÊNCIA OTIMIZADA</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <span className="text-xs text-zinc-500 font-mono uppercase">Mídia Paga (Meta Ads)</span>
              <p className="mt-2 text-xl font-bold font-mono text-white">R$ 185.000+</p>
              <span className="text-xs text-emerald-400">Orçamento sob Gestão Ativa</span>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                <span>Custo por Lead: Otimizado</span>
                <span className="text-emerald-400">ROAS: 4.2x</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <span className="text-xs text-zinc-500 font-mono uppercase">Infraestrutura Web (Next.js)</span>
              <p className="mt-2 text-xl font-bold font-mono text-emerald-400">&lt; 700 ms</p>
              <span className="text-xs text-zinc-400">Edge Network • Core Web Vitals Alto</span>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                <span>Taxa de Retenção: 91.6%</span>
                <span className="text-emerald-400">Conversão: Alta</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <span className="text-xs text-zinc-500 font-mono uppercase">Modelos de IA & Triagem</span>
              <p className="mt-2 text-xl font-bold font-mono text-cyan-400">Ativo</p>
              <span className="text-xs text-zinc-400">Análise Preditiva de Criativos</span>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                <span>Fadiga de Anúncio: Baixa</span>
                <span className="text-cyan-400">Automação: 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="solucoes" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Nossas Soluções
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Infraestrutura completa de aquisição para empresas que buscam escala.
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            Eliminamos os gargalos entre investimento em anúncios, velocidade de página e atendimento comercial.
            Tudo é desenhado para maximizar a conversão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pilar 1 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition hover:border-emerald-500/40 hover:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 font-mono text-xl font-bold text-emerald-400 border border-emerald-500/20">
              01
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Gestão Avançada de Tráfego Pago (Meta Ads)</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Estratégias avançadas de compra de mídia e escala para varejo, negócios locais e B2B. 
              Realizamos testes contínuos de criativos, segmentações orientadas a ticket médio alto e 
              distribuição inteligente de orçamento focada exclusivamente no retorno sobre investimento (ROAS).
            </p>
            <ul className="mt-6 space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Escala horizontal e vertical com controle de CAC
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Mitigação sistemática de fadiga de anúncios
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Otimização orientada a vendas reais e faturamento
              </li>
            </ul>
          </div>

          {/* Pilar 2 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition hover:border-emerald-500/40 hover:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 font-mono text-xl font-bold text-teal-400 border border-teal-500/20">
              02
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Desenvolvimento Web & Landing Pages Ultrarrápidas</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Páginas pesadas e lentas desperdiçam até 50% dos cliques pagos. Desenvolvemos landing pages 
              sob medida com arquitetura moderna em <strong>Next.js</strong>, bancos de dados em nuvem e 
              carregamento instantâneo para garantir que nenhum lead se perca no clique.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Carregamento sub-segundo (&lt; 0.8s) em qualquer dispositivo
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Design mobile-first otimizado para tomada de ação
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Integração direta com formulários e webhooks seguros
              </li>
            </ul>
          </div>

          {/* Pilar 3 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition hover:border-emerald-500/40 hover:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 font-mono text-xl font-bold text-cyan-400 border border-cyan-500/20">
              03
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Chatbots Inteligentes & Automação Comercial</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Respostas instantâneas são cruciais para fechar negócios. Implementamos agentes conversacionais e 
              chatbots com inteligência artificial para WhatsApp e canais digitais, qualificando o lead em tempo real 
              e transferindo para o vendedor apenas os contatos com real intenção de compra.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Triagem e qualificação de leads 24 horas por dia
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Distribuição automática de contatos para corretores ou vendedores
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Notificações instantâneas em CRMs e canais internos
              </li>
            </ul>
          </div>

          {/* Pilar 4 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition hover:border-emerald-500/40 hover:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 font-mono text-xl font-bold text-emerald-400 border border-emerald-500/20">
              04
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Telemetria de Dados & Dashboards Executivos</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Instalamos rastreamento server-side via API de Conversões (Meta CAPI) para garantir dados precisos 
              mesmo com bloqueadores de anúncios. Entregamos painéis em tempo real no <strong>Looker Studio</strong>, 
              dando total clareza sobre investimento, custo por aquisição e faturamento gerado.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Rastreamento direto no servidor com alta taxa de correspondência
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Atribuição transparente de receita por campanha
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Painéis claros sem métricas de vaidade
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI & Automation Engine */}
      <section id="inteligencia" className="relative z-10 border-y border-zinc-800/60 bg-zinc-900/20 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium text-cyan-400 mb-6">
                INTELIGÊNCIA COMPUTACIONAL & IA
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Como aplicamos modelos de IA na otimização de campanhas.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-400">
                Utilizamos modelos avançados de inteligência artificial integrados aos nossos fluxos de trabalho 
                para processar grandes volumes de métricas e tomar decisões de tráfego com velocidade e precisão.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <h4 className="font-semibold text-white text-sm">1. Análise Preditiva de Métricas de Leilão</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    Algoritmos que monitoram variações de custo por clique e frequência para antecipar o momento exato de renovar os criativos.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <h4 className="font-semibold text-white text-sm">2. Geração e Teste de Variações Textuais</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    Modelos de linguagem ajustados para produzir dezenas de ganchos e copys persuasivas direcionadas ao perfil de cada segmento.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <h4 className="font-semibold text-white text-sm">3. Chatbots com Compreensão Contextual</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    Atendimento que compreende dúvidas reais do cliente, analisa contexto e conduz a conversa com naturalidade até a conversão.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-zinc-500">
                <span>konverops.internal / analytics-engine</span>
                <span className="text-emerald-400">200 OK • Status: Ativo</span>
              </div>
              <pre className="mt-4 overflow-x-auto text-zinc-300 leading-relaxed">
{`{
  "system": "Konverops Media & Performance Engine",
  "pipeline": "campaign_optimization_node",
  "data_inputs": {
    "channel": "Meta Ads (CAPI Server-Side)",
    "events_analyzed_24h": 142850,
    "roas_current": 4.18
  },
  "ai_recommendation": {
    "action": "Escalar conjunto CBO_02 em +20%",
    "reasoning": "Taxa de conversão consistente com custo por aquisição 18% abaixo da meta. Sugerida nova bateria de testes de criativos."
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section id="metodologia" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Metodologia
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            O Método Engenharia de Vendas
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            Estrutura em quatro etapas para construir crescimento previsível para o seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <span className="font-mono text-2xl font-bold text-emerald-400">01</span>
            <h3 className="mt-4 font-bold text-white">Diagnóstico & Dados</h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Auditoria dos canais de tráfego, telemetria de pixels, gargalos de atendimento e histórico de conversão.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <span className="font-mono text-2xl font-bold text-teal-400">02</span>
            <h3 className="mt-4 font-bold text-white">Arquitetura de Conversão</h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Desenvolvimento de páginas de alta velocidade e estruturação de agentes inteligentes de WhatsApp e canais de contato.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <span className="font-mono text-2xl font-bold text-cyan-400">03</span>
            <h3 className="mt-4 font-bold text-white">Aquisição & Escala</h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Execução de campanhas orientadas a retorno financeiro real, segmentadas para o perfil ideal de comprador.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <span className="font-mono text-2xl font-bold text-emerald-400">04</span>
            <h3 className="mt-4 font-bold text-white">Otimização Contínua</h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Acompanhamento em dashboards executivos, testes A/B sistemáticos e refinamento diário de performance.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section id="sobre" className="relative z-10 border-t border-zinc-800/60 bg-zinc-900/30 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 font-mono text-2xl font-black text-black shadow-xl shadow-emerald-500/20">
            KN
          </div>
          <h3 className="mt-6 text-2xl font-bold text-white">Kelvin Nunes Gonzaga</h3>
          <p className="font-mono text-xs uppercase tracking-wider text-emerald-400 mt-1">
            Fundador & Especialista em Performance
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400 max-w-2xl mx-auto">
            Atuo na interseção entre compra de mídia estratégica e tecnologia. A <strong>Konverops</strong> nasceu 
            com a missão de aplicar rigor de dados, desenvolvimento moderno e inteligência artificial para que 
            empresas em crescimento escalem suas vendas com previsibilidade e sem desperdício de orçamento.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-400">
            <span>CNPJ ATIVO</span>
            <span>•</span>
            <span>SÃO PAULO - BRASIL</span>
            <span>•</span>
            <a href="mailto:contato@konverops.tech" className="text-emerald-400 hover:underline">
              contato@konverops.tech
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-12 lg:p-16 shadow-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Pronto para profissionalizar sua aquisição de clientes?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
            Vamos desenhar a estratégia ideal para sua empresa, unindo tráfego de alta conversão e tecnologia.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:contato@konverops.tech?subject=Contato%20Konverops%20-%20Diagnóstico"
              className="flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-400 px-8 font-semibold text-black transition hover:bg-emerald-300 shadow-lg shadow-emerald-500/25"
            >
              Falar com Nossos Especialistas
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/60 bg-zinc-950 py-12 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-zinc-300">Konverops</span>
            <span>•</span>
            <span>Engenharia de Vendas & Mídia</span>
          </div>
          <div>
            © 2026 Konverops. Todos os direitos reservados.
          </div>
          <div className="font-mono text-zinc-400">
            konverops.tech
          </div>
        </div>
      </footer>
    </div>
  );
}
