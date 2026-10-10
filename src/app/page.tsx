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
                Sales Engineering & Media
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <a href="#capacidades" className="transition hover:text-white">
              Capacidades
            </a>
            <a href="#arquitetura" className="transition hover:text-white">
              Arquitetura
            </a>
            <a href="#inteligencia-artificial" className="transition hover:text-white">
              IA & Dados
            </a>
            <a href="#metodologia" className="transition hover:text-white">
              Metodologia
            </a>
            <a href="#fundador" className="transition hover:text-white">
              Fundador
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistemas Operacionais
            </div>
            <a
              href="mailto:contato@konverops.tech"
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 shadow-sm shadow-emerald-500/20"
            >
              Falar com Engenheiro
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-20 text-center lg:pt-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md mb-8">
          <span className="text-emerald-400 font-semibold">ANTHROPIC STARTUP ECOSYSTEM</span>
          <span className="text-zinc-600">•</span>
          <span>META ADS SCALE ARCHITECTURE</span>
        </div>

        <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Engenharia de Vendas &{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Infraestrutura de Performance.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Transformamos investimento em mídia paga em receita previsível. Combinamos gestão
          avançada de <strong>Meta Ads</strong>, páginas ultrarrápidas em <strong>Next.js</strong>,
          automação comercial inteligente e telemetria preditiva com <strong>Claude (Anthropic)</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:contato@konverops.tech?subject=Diagnóstico%20Técnico%20de%20Mídia"
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-400 px-8 font-semibold text-black transition hover:bg-emerald-300 shadow-lg shadow-emerald-500/25"
          >
            <span>Agendar Diagnóstico Técnico</span>
            <span className="text-base font-bold">→</span>
          </a>
          <a
            href="#capacidades"
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-8 font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            Ver Capacidades da Stack
          </a>
        </div>

        {/* Key Metrics Bar */}
        <div className="mt-16 grid grid-cols-2 gap-4 border-y border-zinc-800/80 py-8 sm:grid-cols-4 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">+98.4%</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Precisão CAPI Server</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">&lt; 0.8s</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Tempo de Carregamento</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">3.8x</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">ROAS Médio de Escala</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">24/7</div>
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Triagem de Leads Ativa</div>
          </div>
        </div>

        {/* Real-time Telemetry Dashboard Mockup */}
        <div id="arquitetura" className="mt-16 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left shadow-2xl backdrop-blur-xl max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Konverops Engine Node: Live Media Telemetry
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
              <span>REGION: GRU-BRA</span>
              <span>•</span>
              <span className="text-emerald-400">STATUS: HEALTHY</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <span className="text-xs text-zinc-500 font-mono uppercase">Aquisição (Meta Ads Engine)</span>
              <p className="mt-2 text-xl font-bold font-mono text-white">R$ 142.850</p>
              <span className="text-xs text-emerald-400">Volume de Mídia Gerenciado</span>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                <span>CPA Alvo: R$ 18,20</span>
                <span className="text-emerald-400">ROAS: 4.2x</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <span className="text-xs text-zinc-500 font-mono uppercase">Infraestrutura Web (Next.js)</span>
              <p className="mt-2 text-xl font-bold font-mono text-emerald-400">620 ms</p>
              <span className="text-xs text-zinc-400">Edge Latency • Core Web Vitals 99/100</span>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                <span>Bounce Rate: 8.4%</span>
                <span className="text-emerald-400">Conversion: 14.8%</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <span className="text-xs text-zinc-500 font-mono uppercase">IA Telemetry (Claude Sonnet 3.5)</span>
              <p className="mt-2 text-xl font-bold font-mono text-cyan-400">Ativo</p>
              <span className="text-xs text-zinc-400">Otimização Contínua de Audiências</span>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-900 pt-2 font-mono">
                <span>Creative Fatigue: 0%</span>
                <span className="text-cyan-400">Auto-Refine: ON</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="capacidades" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Capacidades Operacionais
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Não somos uma agência tradicional. Somos engenheiros de crescimento.
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            A maioria dos negócios perde dinheiro porque separa a compra de tráfego da infraestrutura técnica.
            Na Konverops, operamos toda a esteira como um sistema único integrado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pilar 1 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition hover:border-emerald-500/40 hover:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 font-mono text-xl font-bold text-emerald-400 border border-emerald-500/20">
              01
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Gestão & Compra de Mídia Paga (Meta Ads)</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Compramos mídia com rigor matemático. Estratégias de escala para varejo físico, comércio local e B2B. 
              Realizamos testes multivariados de criativos, isolamento de públicos, calibração de lances e 
              distribuição inteligente de orçamento (CBO/ABO) focada estritamente em ROAS e lucro líquido.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Escala horizontal e vertical de campanhas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Proteção de margem e combate a fadiga de anúncios
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Segmentação orientada a ticket médio qualificado
              </li>
            </ul>
          </div>

          {/* Pilar 2 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition hover:border-emerald-500/40 hover:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 font-mono text-xl font-bold text-teal-400 border border-teal-500/20">
              02
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Engenharia Web & Landing Pages (Next.js / Supabase)</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Páginas lentas no WordPress destroem o retorno do seu anúncio antes do primeiro segundo.
              Construímos landing pages sob medida em <strong>Next.js</strong> com carregamento em milissegundos, 
              infraestrutura serverless na Vercel e bancos de dados <strong>Supabase</strong> para captura instantânea.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Carregamento sub-segundo (&lt; 0.8s) em conexões 4G
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Arquitetura mobile-first ultra responsiva
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Integração segura de formulários e webhooks
              </li>
            </ul>
          </div>

          {/* Pilar 3 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition hover:border-emerald-500/40 hover:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 font-mono text-xl font-bold text-cyan-400 border border-cyan-500/20">
              03
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Automação Comercial & Atendimento (Manychat)</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Lead que espera 10 minutos para ser atendido compra do concorrente. Implementamos automações 
              conversacionais no WhatsApp e Direct que respondem em 3 segundos, filtram o lead qualificado 
              e entregam o comprador pronto no colo do seu time de fechamento.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Qualificação automática de poder de compra
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Roteamento inteligente de vendedores
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Disparo de avisos em tempo real via CRM e Asaas
              </li>
            </ul>
          </div>

          {/* Pilar 4 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 transition hover:border-emerald-500/40 hover:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 font-mono text-xl font-bold text-emerald-400 border border-emerald-500/20">
              04
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Telemetria & Business Intelligence (Looker Studio)</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Configuramos a <strong>Meta Conversions API (CAPI)</strong> via servidor para blindar seu rastreamento 
              contra bloqueadores do iOS. Construímos dashboards executivos no <strong>Looker Studio</strong> onde 
              você acompanha CAC, LTV e ROAS em tempo real, sem planilhas confusas.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Rastreamento confiável server-side sem perdas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Atribuição exata de receita por canal e criativo
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Painéis executivos transparentes 24/7
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI & Anthropic Integration */}
      <section id="inteligencia-artificial" className="relative z-10 border-y border-zinc-800/60 bg-zinc-900/20 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium text-cyan-400 mb-6">
                CLAUDE FOR STARTUPS PROGRAM APPLICANT
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Como usamos modelos de IA da Anthropic na gestão de tráfego.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-400">
                A Konverops utiliza a API oficial do Claude para processar grandes volumes de métricas de anúncios e
                acelerar a tomada de decisão comercial em tempo real.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <h4 className="font-semibold text-white text-sm">1. Análise Preditiva de Métricas de Leilão</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    Processamento contínuo de CTR, CPC e conversões para identificar tendências de saturação antes que o ROAS caia.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <h4 className="font-semibold text-white text-sm">2. Geração Dinâmica de Copys Persuasivas</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    O modelo gera dezenas de variações contextuais de títulos, descrições e roteiros de anúncios para testes A/B instantâneos.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <h4 className="font-semibold text-white text-sm">3. Orquestração Conversacional Inteligente</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    IA integrada às esteiras Manychat para responder dúvidas contextuais e guiar o lead até o agendamento de venda.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-zinc-500">
                <span>api.anthropic.com/v1/messages</span>
                <span className="text-emerald-400">200 OK • 142ms</span>
              </div>
              <pre className="mt-4 overflow-x-auto text-zinc-300 leading-relaxed">
{`{
  "model": "claude-3-5-sonnet-20241022",
  "system": "Konverops Media Engine: Optimize Ad Creatives",
  "analysis": {
    "campaign_id": "meta_retail_scale_v4",
    "metrics": {
      "impressions": 482910,
      "roas": 4.82,
      "cpa": 17.40
    },
    "recommendation": "Aumentar orçamento em +25% no conjunto CBO_02. Fadiga detectada no criativo_03; substituir por copy_variacao_B gerada pela IA."
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
            Processo de Execução
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            O Método Engenharia de Vendas
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            Quatro etapas claras para transformar investimento em faturamento com previsibilidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <span className="font-mono text-2xl font-bold text-emerald-400">01</span>
            <h3 className="mt-4 font-bold text-white">Diagnóstico & Telemetria</h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Auditoria de pixels, APIs de conversão, dados históricos de tráfego e gargalos no atendimento.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <span className="font-mono text-2xl font-bold text-teal-400">02</span>
            <h3 className="mt-4 font-bold text-white">Arquitetura de Conversão</h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Construção da landing page ultrarrápida (Next.js) e configuração dos fluxos automatizados no Manychat.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <span className="font-mono text-2xl font-bold text-cyan-400">03</span>
            <h3 className="mt-4 font-bold text-white">Aquisição & Escala</h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Lançamento das campanhas no Meta Ads com segmentação orientada a compradores de alto valor.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <span className="font-mono text-2xl font-bold text-emerald-400">04</span>
            <h3 className="mt-4 font-bold text-white">Otimização Contínua</h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Análise diária dos dashboards Looker Studio, testes A/B de criativos e refinamento algorítmico com Claude.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section id="fundador" className="relative z-10 border-t border-zinc-800/60 bg-zinc-900/30 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 font-mono text-2xl font-black text-black shadow-xl shadow-emerald-500/20">
            KN
          </div>
          <h3 className="mt-6 text-2xl font-bold text-white">Kelvin Nunes Gonzaga</h3>
          <p className="font-mono text-xs uppercase tracking-wider text-emerald-400 mt-1">
            Fundador & Lead Performance Engineer
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400 max-w-2xl mx-auto">
            Especialista em compra de mídia e gestão de tráfego com formação e know-how técnico em 
            engenharia de software, desenvolvimento web e automação. Criei a <strong>Konverops</strong> para 
            oferecer ao varejo e a empresas em crescimento o mesmo rigor técnico de dados utilizado pelas 
            startups mais eficientes do mercado.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs font-mono text-zinc-400">
            <span>CNPJ/MEI ATIVO</span>
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
            Pronto para construir sua máquina de vendas?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
            Pare de desperdiçar orçamento com agências generalistas. Vamos estruturar sua infraestrutura
            completa de aquisição com Meta Ads, Next.js e inteligência artificial.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:contato@konverops.tech?subject=Contato%20Konverops%20-%20Proposta"
              className="flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-400 px-8 font-semibold text-black transition hover:bg-emerald-300 shadow-lg shadow-emerald-500/25"
            >
              Falar Diretamente com Kelvin
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
            <span>Tecnologia & Engenharia de Vendas</span>
          </div>
          <div>
            © {new Date().getFullYear()} Konverops. Todos os direitos reservados.
          </div>
          <div className="font-mono text-zinc-400">
            konverops.tech
          </div>
        </div>
      </footer>
    </div>
  );
}
