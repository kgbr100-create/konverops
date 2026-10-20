'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  // Estado da ferramenta interativa (One Live Thing - data-ui)
  const [adSpend, setAdSpend] = useState<number>(30000);
  const [loadTime, setLoadTime] = useState<number>(3.2);
  const [hasCapi, setHasCapi] = useState<boolean>(false);

  // Cálculos de vazamento técnico
  // Cada segundo acima de 1s gera ~12% de desistência de cliques móveis
  const latencyBouncePercent = Math.min(Math.max(Math.round((loadTime - 0.8) * 14), 0), 55);
  // Falta de CAPI perde ~25% de conversões no iOS e adblockers
  const trackingLossPercent = hasCapi ? 4 : 26;
  // Perda total combinada estimada do orçamento
  const totalWastedPercent = Math.min(latencyBouncePercent + (trackingLossPercent * 0.7), 65);
  const monthlyWastedValue = Math.round((adSpend * totalWastedPercent) / 100);

  return (
    <div className="min-h-[100dvh] bg-[#090b0e] text-[#f4f4f6] selection:bg-[#059669] selection:text-black">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[#090b0e] py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-white">Konverops</span>
          <span className="text-xs text-[#8f9ba8] hidden sm:inline">Engenharia de Vendas</span>
        </div>

        <nav className="flex items-center gap-6 text-sm text-[#8f9ba8]">
          <a href="#diagnostico" className="hover:text-white transition">Diagnóstico</a>
          <a href="#metodo" className="hover:text-white transition">Método</a>
          <a href="#pilares" className="hover:text-white transition">Pilares</a>
          <a href="#fundador" className="hover:text-white transition">Fundador</a>
          <a
            href="mailto:kelvin@konverops.tech"
            className="rounded bg-[#059669] px-4 py-2 text-xs font-semibold text-black hover:bg-[#10b981] transition"
          >
            Falar com Especialista
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <section className="px-6 md:px-12 pt-16 pb-20 max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              A maioria das operações perde 30% do orçamento de mídia antes da página abrir.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[#9da8b6] leading-relaxed">
              A Konverops une compra cirúrgica de mídia no Meta Ads, desenvolvimento web em Next.js com carregamento em menos de 800ms e rastreamento server-side first-party (CAPI).
            </p>
          </div>

          {/* One Live Thing: Interactive Diagnostic Instrument */}
          <div id="diagnostico" className="mt-14 max-w-4xl bg-[#11151c] rounded-lg p-6 sm:p-8" data-ui="true">
            {/* taste-skill-ignore */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#212936]">
              <div>
                <h2 className="text-base font-semibold text-white">Simulador de Vazamento Técnico de Tráfego</h2>
                <p className="text-xs text-[#8f9ba8] mt-1">Calcule a receita desperdiçada por latência móvel e perda de rastreamento no Meta Ads.</p>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-xs text-[#8f9ba8] block">Desperdício Estimado</span>
                <span className="text-2xl font-bold text-[#f87171]">
                  R$ {monthlyWastedValue.toLocaleString('pt-BR')} <span className="text-xs font-normal text-[#8f9ba8]">/mês</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Slider 1: Ad Spend */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-[#9da8b6]">
                  <span>Investimento em Anúncios</span>
                  <span className="font-semibold text-white">R$ {adSpend.toLocaleString('pt-BR')}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={adSpend}
                  onChange={(e) => setAdSpend(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#212936] rounded-lg appearance-none cursor-pointer accent-[#059669]"
                />
                <span className="text-[11px] text-[#6b7785] block">Orçamento mensal no Meta Ads</span>
              </div>

              {/* Slider 2: Page Speed */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-[#9da8b6]">
                  <span>Tempo de Carregamento</span>
                  <span className={`font-semibold ${loadTime > 2 ? 'text-[#f87171]' : 'text-[#34d399]'}`}>
                    {loadTime.toFixed(1)}s no mobile
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="5.0"
                  step="0.2"
                  value={loadTime}
                  onChange={(e) => setLoadTime(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#212936] rounded-lg appearance-none cursor-pointer accent-[#059669]"
                />
                <span className="text-[11px] text-[#6b7785] block">Tempo médio no 4G brasileiro</span>
              </div>

              {/* Toggle 3: CAPI */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-[#9da8b6]">
                  <span>Rastreamento Server-Side</span>
                  <span className="font-semibold text-white">{hasCapi ? 'CAPI Ativa' : 'Apenas Pixel'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasCapi(false)}
                    className={`flex-1 py-1.5 px-3 text-xs rounded transition ${
                      !hasCapi ? 'bg-[#212936] text-white font-semibold' : 'bg-[#151a22] text-[#8f9ba8]'
                    }`}
                  >
                    Navegador
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasCapi(true)}
                    className={`flex-1 py-1.5 px-3 text-xs rounded transition ${
                      hasCapi ? 'bg-[#059669] text-black font-semibold' : 'bg-[#151a22] text-[#8f9ba8]'
                    }`}
                  >
                    Server-Side
                  </button>
                </div>
                <span className="text-[11px] text-[#6b7785] block">Meta Conversions API configurada</span>
              </div>
            </div>

            {/* Diagnostic Result Callout */}
            <div className="mt-6 p-4 rounded bg-[#161c24] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-[#9da8b6]">
                <strong className="text-white block mb-0.5">Diagnóstico Konverops para este cenário:</strong>
                Sua operação perde cerca de <span className="text-[#f87171] font-semibold">{latencyBouncePercent}% dos cliques</span> por demora no carregamento e{' '}
                <span className="text-[#f87171] font-semibold">{trackingLossPercent}% dos eventos</span> de compra por bloqueios do navegador.
              </div>
              <a
                href="mailto:kelvin@konverops.tech?subject=Diagnóstico%20de%20Tráfego%20Konverops"
                className="whitespace-nowrap text-xs font-semibold bg-[#212936] hover:bg-[#2b3546] text-white px-4 py-2 rounded transition"
              >
                Solicitar Correção Técnica →
              </a>
            </div>
          </div>
        </section>

        {/* Section: Factual Comparison (O Abismo Técnico) */}
        <section id="metodo" className="bg-[#0f1217] py-20 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                O abismo entre gestão comum de mídia e engenharia de vendas.
              </h2>
              <p className="mt-4 text-[#9da8b6] text-base leading-relaxed">
                A maioria das agências trata tráfego como apenas trocar criativo e aumentar lance. Quando a infraestrutura técnica é frágil, cada real colocado no leilão trabalha contra você.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* O Padrão Frágil */}
              <div className="bg-[#14181f] p-8 rounded-lg">
                <h3 className="text-lg font-bold text-[#f87171]">O modelo frágil tradicional</h3>
                <ul className="mt-6 space-y-4 text-sm text-[#9da8b6]">
                  <li className="flex items-start gap-3">
                    <span className="text-[#f87171] font-bold">—</span>
                    <span>Páginas em WordPress ou construtores genéricos com carregamento superior a 3 segundos no mobile.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#f87171] font-bold">—</span>
                    <span>Rastreamento restrito ao pixel do navegador, perdendo até 30% das compras por causa do iOS e adblockers.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#f87171] font-bold">—</span>
                    <span>Leads frios despejados diretamente no WhatsApp do comercial sem nenhuma triagem de perfil ou qualificação.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#f87171] font-bold">—</span>
                    <span>Relatórios focados em métricas de vaidade como impressões e cliques em vez de custo de aquisição (CAC) e margem.</span>
                  </li>
                </ul>
              </div>

              {/* O Padrão Konverops */}
              <div className="bg-[#14181f] p-8 rounded-lg border-l-2 border-[#059669]">
                <h3 className="text-lg font-bold text-[#34d399]">A engenharia de vendas Konverops</h3>
                <ul className="mt-6 space-y-4 text-sm text-[#cbd5e1]">
                  <li className="flex items-start gap-3">
                    <span className="text-[#34d399] font-bold">+</span>
                    <span>Aplicações web desenvolvidas em Next.js e computação edge com tempo de abertura inferior a 800ms.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#34d399] font-bold">+</span>
                    <span>Meta Conversions API (CAPI) implementada no servidor, entregando 100% dos eventos com máxima pontuação de correspondência.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#34d399] font-bold">+</span>
                    <span>Agentes inteligentes de triagem que qualificam o lead em segundos antes de acionar a equipe comercial.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#34d399] font-bold">+</span>
                    <span>Dashboards executivos em Looker Studio unificando dados de investimento, CAC, LTV e receita real faturada.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Os 4 Pilares Técnicos */}
        <section id="pilares" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Nossos pilares de infraestrutura e performance.
            </h2>
            <p className="mt-4 text-[#9da8b6] text-base leading-relaxed">
              Combinamos tecnologia de software com compra de mídia para construir canais de aquisição previsíveis e auditáveis.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#11151c] p-8 rounded-lg">
              <h3 className="text-lg font-bold text-white">Aquisição & Escala em Meta Ads</h3>
              <p className="mt-3 text-sm text-[#9da8b6] leading-relaxed">
                Planejamento cirúrgico de campanhas, estruturação de esteiras contínuas de teste de ângulos e escala sustentável sem inflacionar o custo por cliente qualificado.
              </p>
            </div>

            <div className="bg-[#11151c] p-8 rounded-lg">
              <h3 className="text-lg font-bold text-white">Aplicações Next.js de Ultra Velocidade</h3>
              <p className="mt-3 text-sm text-[#9da8b6] leading-relaxed">
                Interfaces comerciais desenhadas e codificadas para carregar instantaneamente em qualquer dispositivo móvel. Menor tempo de resposta significa maior retenção e taxa de conversão.
              </p>
            </div>

            <div className="bg-[#11151c] p-8 rounded-lg">
              <h3 className="text-lg font-bold text-white">Rastreamento Server-Side First-Party</h3>
              <p className="mt-3 text-sm text-[#9da8b6] leading-relaxed">
                Integração direta com a API de Conversões do Meta (CAPI). Eliminamos a perda de dados causada por restrições de navegadores para alimentar o algoritmo com sinal limpo.
              </p>
            </div>

            <div className="bg-[#11151c] p-8 rounded-lg">
              <h3 className="text-lg font-bold text-white">Agentes de Triagem & Qualificação</h3>
              <p className="mt-3 text-sm text-[#9da8b6] leading-relaxed">
                Automações conversacionais alimentadas por inteligência artificial para atendimento imediato 24/7, coleta de dados do cliente e entrega de leads prontos para fechamento.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Founder & Autoridade */}
        <section id="fundador" className="bg-[#0f1217] py-20 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#14181f] p-8 sm:p-12 rounded-lg">
              <h2 className="text-2xl font-bold text-white">Kelvin Nunes Gonzaga</h2>
              <p className="text-sm font-semibold text-[#34d399] mt-1">Fundador & Head of Sales Engineering</p>
              
              <div className="mt-6 space-y-4 text-sm text-[#9da8b6] leading-relaxed">
                <p>
                  Com formação técnica em Análise e Desenvolvimento de Sistemas (ADS) e sólida vivência em governança corporativa e gestão de produtos tecnológicos, fundei a <strong>Konverops</strong> para resolver o maior gargalo das empresas modernas: a falta de integração entre a engenharia de software e a esteira de aquisição de clientes.
                </p>
                <p>
                  Não acreditamos em soluções milagrosas ou fórmulas genéricas de agências tradicionais. Tratamos vendas B2B e tráfego pago com o mesmo rigor científico aplicado a produtos digitais de alta escala: dados auditáveis, código limpo e foco absoluto em margem de lucro.
                </p>
              </div>

              <div className="mt-8 pt-6 bg-[#1a2029] p-4 rounded flex flex-wrap items-center justify-between gap-4 text-xs text-[#8f9ba8]">
                <div className="flex items-center gap-4">
                  <span>CNPJ: 61.492.627/0001-00</span>
                  <span>•</span>
                  <span>São Paulo, SP, Brasil</span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.linkedin.com/in/kelvin-gonzaga-347b84442/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#34d399] hover:underline"
                  >
                    LinkedIn do Fundador ↗
                  </a>
                  <span>•</span>
                  <a href="mailto:kelvin@konverops.tech" className="text-white hover:underline">
                    kelvin@konverops.tech
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 md:px-12 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Pronto para profissionalizar sua infraestrutura de aquisição?
          </h2>
          <p className="mt-4 text-base text-[#9da8b6]">
            Vamos analisar sua operação atual, identificar vazamentos de dados e desenhar a arquitetura correta para sua empresa escalar com previsibilidade.
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href="mailto:kelvin@konverops.tech?subject=Diagnóstico%20Konverops"
              className="rounded bg-[#059669] px-8 py-3.5 text-sm font-semibold text-black hover:bg-[#10b981] transition"
            >
              Solicitar Diagnóstico Técnico com Kelvin Gonzaga
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#06080a] py-8 px-6 md:px-12 text-xs text-[#6b7785]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Konverops • CNPJ: 61.492.627/0001-00 • São Paulo, Brasil
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacidade" className="hover:text-white transition">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-white transition">
              Termos de Uso
            </Link>
            <a
              href="https://www.linkedin.com/in/kelvin-gonzaga-347b84442/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
