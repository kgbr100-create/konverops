'use client';

import React, { useEffect, useState } from 'react';

type Lang = 'en' | 'pt';
type WorkflowKey = 'voice' | 'capi' | 'crm';
type PlanKey = 'starter' | 'growth' | 'scale';

interface SlipStage {
  phase: string;
  steps: { label: string; latency: string }[];
}

interface WorkflowSpec {
  id: WorkflowKey;
  tabLabel: { en: string; pt: string };
  slipTitle: { en: string; pt: string };
  stages: SlipStage[];
  outcome: { en: string; pt: string };
  totalTime: string;
  payload: string;
}

const WORKFLOWS: Record<WorkflowKey, WorkflowSpec> = {
  voice: {
    id: 'voice',
    tabLabel: { en: 'Voice qualification', pt: 'Qualificação por voz' },
    slipTitle: { en: 'Voice AI trace', pt: 'Fluxo de voz IA' },
    stages: [
      {
        phase: 'Capture',
        steps: [
          { label: 'Inbound lead webhook verified', latency: '42 ms' },
          { label: 'Account domain & CRM lookup', latency: '88 ms' },
        ],
      },
      {
        phase: 'Voice synthesis',
        steps: [
          { label: 'Streaming neural voice synthesis', latency: '140 ms' },
          { label: 'Intent & budget scoring', latency: '74 ms' },
        ],
      },
      {
        phase: 'Routing',
        steps: [
          { label: 'Calendar slot & transcript dispatch', latency: '36 ms' },
        ],
      },
    ],
    outcome: { en: 'Call qualified and booked', pt: 'Chamada qualificada e agendada' },
    totalTime: '380 ms',
    payload: `{
  "workspace": "konverops-b2b-prod",
  "pipeline": "voice_qualification_v2",
  "voice_stream": {
    "provider": "elevenlabs_streaming",
    "audience": "b2b_enterprise_18plus",
    "ttfb_ms": 140
  },
  "telemetry": {
    "capi_match_quality": 9.4,
    "crm_status": "qualified_ae_assigned"
  }
}`,
  },
  capi: {
    id: 'capi',
    tabLabel: { en: 'Server-side CAPI', pt: 'CAPI server-side' },
    slipTitle: { en: 'Telemetry router', pt: 'Roteador de eventos' },
    stages: [
      {
        phase: 'Capture',
        steps: [
          { label: 'First-party edge session hashed', latency: '18 ms' },
          { label: 'Browser blocker bypass check', latency: '24 ms' },
        ],
      },
      {
        phase: 'Enrichment',
        steps: [
          { label: 'SHA-256 PII & click ID merge', latency: '45 ms' },
          { label: 'Event deduplication key signed', latency: '19 ms' },
        ],
      },
      {
        phase: 'Dispatch',
        steps: [
          { label: 'Server-to-server CAPI delivery', latency: '114 ms' },
        ],
      },
    ],
    outcome: { en: 'Attribution synced with zero loss', pt: 'Atribuição sincronizada sem perdas' },
    totalTime: '220 ms',
    payload: `{
  "workspace": "konverops-edge-telemetry",
  "pipeline": "capi_first_party_dispatch",
  "event": {
    "name": "QualifiedLead",
    "source": "server_edge_worker",
    "dedup_verified": true
  },
  "delivery": {
    "http_status": 200,
    "latency_ms": 220
  }
}`,
  },
  crm: {
    id: 'crm',
    tabLabel: { en: 'CRM handoff', pt: 'Envio ao CRM' },
    slipTitle: { en: 'Pipeline dispatch', pt: 'Despacho ao CRM' },
    stages: [
      {
        phase: 'Capture',
        steps: [
          { label: 'Voice transcript & intent parsed', latency: '64 ms' },
          { label: 'Company size tier classified', latency: '38 ms' },
        ],
      },
      {
        phase: 'Validation',
        steps: [
          { label: 'Lead score threshold passed', latency: '29 ms' },
          { label: 'Owner round-robin matched', latency: '41 ms' },
        ],
      },
      {
        phase: 'Dispatch',
        steps: [
          { label: 'CRM deal & Slack alert created', latency: '93 ms' },
        ],
      },
    ],
    outcome: { en: 'Deal opened in pipeline', pt: 'Negócio aberto no funil' },
    totalTime: '265 ms',
    payload: `{
  "workspace": "konverops-crm-bridge",
  "pipeline": "b2b_deal_handoff",
  "lead": {
    "segment": "b2b_software",
    "intent_score": 0.93,
    "voice_summary": "Requested enterprise API quota"
  },
  "handoff": {
    "target": "hubspot_webhook",
    "latency_ms": 265
  }
}`,
  },
};

const PLANS: Record<
  PlanKey,
  {
    name: string;
    price: string;
    period: { en: string; pt: string };
    quotaLabel: { en: string; pt: string };
    voiceQuota: string;
    eventQuota: string;
    seats: string;
    includes: { en: string[]; pt: string[] };
  }
> = {
  starter: {
    name: 'Starter',
    price: '79',
    period: { en: 'per month', pt: 'por mês' },
    quotaLabel: { en: 'Starter workspace quota', pt: 'Cota do plano Starter' },
    voiceQuota: '1,200 voice min',
    eventQuota: '100k CAPI events',
    seats: '3 seats',
    includes: {
      en: [
        'One autonomous B2B voice qualification agent',
        'First-party server-side Meta CAPI event router',
        'Two sub-800ms edge conversion workspaces',
        'Webhook alerts and JSON execution logs',
      ],
      pt: [
        'Um agente autônomo de voz para qualificação B2B',
        'Roteador de eventos Meta CAPI server-side',
        'Dois workspaces edge abaixo de 800 ms',
        'Alertas via webhook e logs completos em JSON',
      ],
    },
  },
  growth: {
    name: 'Growth',
    price: '249',
    period: { en: 'per month', pt: 'por mês' },
    quotaLabel: { en: 'Growth workspace quota', pt: 'Cota do plano Growth' },
    voiceQuota: '6,500 voice min',
    eventQuota: '1M CAPI events',
    seats: '12 seats',
    includes: {
      en: [
        'Unlimited B2B voice and text qualification agents',
        'First-party server-side CAPI & multi-channel telemetry',
        'Unlimited edge workspaces with custom domains',
        'Bi-directional CRM sync, team RBAC and priority API',
      ],
      pt: [
        'Agentes ilimitados de qualificação por voz e texto',
        'Telemetria first-party CAPI e atribuição multicanal',
        'Workspaces edge ilimitados com domínios próprios',
        'Sincronização bidirecional com CRM e API prioritária',
      ],
    },
  },
  scale: {
    name: 'Scale',
    price: '790',
    period: { en: 'per month', pt: 'por mês' },
    quotaLabel: { en: 'Scale dedicated cluster', pt: 'Cluster dedicado Scale' },
    voiceQuota: '25,000 voice min',
    eventQuota: '10M CAPI events',
    seats: 'Unlimited seats',
    includes: {
      en: [
        'Dedicated voice synthesis & low-latency SIP routing',
        'High-throughput edge telemetry workers and SLA',
        'Custom webhook pipelines and audit exports',
        'Direct engineering channel and private deployment',
      ],
      pt: [
        'Síntese de voz dedicada e roteamento de baixa latência',
        'Workers de telemetria de alta vazão com SLA',
        'Pipelines de webhook sob medida e auditoria',
        'Canal direto de engenharia e deploy privado',
      ],
    },
  },
};

export default function KonveropsLanding() {
  const [lang, setLang] = useState<Lang>('en');
  const [workflow, setWorkflow] = useState<WorkflowKey>('voice');
  const [plan, setPlan] = useState<PlanKey>('growth');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal-item'));
    if (!items.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      items.forEach((el) => {
        el.classList.remove('reveal-pending');
        el.classList.add('reveal-visible');
      });
      return;
    }

    const triggerReveal = (el: HTMLElement) => {
      if (el.dataset.revealed === '1') return;
      el.dataset.revealed = '1';
      el.classList.remove('reveal-pending');
      el.classList.add('reveal-animate');
      if (typeof el.animate === 'function') {
        const delay = el.dataset.delay ? Number(el.dataset.delay) : 0;
        el.animate(
          [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0px)' },
          ],
          {
            duration: 700,
            delay,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'both',
          }
        );
      }
    };

    const revealInView = () => {
      const triggerY = window.innerHeight * 0.98;
      items.forEach((el) => {
        if (el.dataset.revealed === '1') return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerY) {
          triggerReveal(el);
        }
      });
    };

    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.78) {
        triggerReveal(el);
      } else {
        el.classList.add('reveal-pending');
      }
    });

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const target = entry.target as HTMLElement;
                  triggerReveal(target);
                  observer?.unobserve(target);
                }
              });
            },
            { threshold: 0.01, rootMargin: '0px 0px 0px 0px' }
          );

    if (observer) {
      items.forEach((el) => {
        if (el.dataset.revealed !== '1') observer.observe(el);
      });
    }

    window.addEventListener('scroll', revealInView, { passive: true });
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', revealInView);
    };
  }, []);

  const activeWorkflow = WORKFLOWS[workflow];
  const activePlan = PLANS[plan];

  return (
    <div className="min-h-[100svh] bg-[#e2e2e2] text-[#7d0c14] overflow-x-clip">
      {/* Top Navigation — plain wordmark left, links right, no bar chrome */}
      <header className="w-full px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        <a
          href="#"
          className="text-[15px] font-medium tracking-[-0.01em] text-[#7d0c14] hover:opacity-75 transition-opacity"
        >
          konverops.tech
        </a>

        <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium text-[#7d0c14]">
          <a href="#platform" className="hover:opacity-70 transition-opacity">
            {lang === 'en' ? 'Platform' : 'Plataforma'}
          </a>
          <a href="#workflow" className="hover:opacity-70 transition-opacity">
            {lang === 'en' ? 'Workflow' : 'Fluxo'}
          </a>
          <a href="#pricing" className="hover:opacity-70 transition-opacity">
            {lang === 'en' ? 'Pricing' : 'Planos'}
          </a>
          <a href="#faq" className="hover:opacity-70 transition-opacity">
            FAQ
          </a>
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'en' ? 'pt' : 'en'))}
            aria-label="Switch language"
            className="text-[14px] font-medium text-[#7a4a4e] hover:text-[#7d0c14] transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'PT' : 'EN'}
          </button>
        </nav>

        <div className="flex md:hidden items-center gap-4">
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'en' ? 'pt' : 'en'))}
            className="text-[14px] font-medium text-[#7a4a4e] cursor-pointer"
          >
            {lang === 'en' ? 'PT' : 'EN'}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="text-[15px] font-medium text-[#7d0c14] cursor-pointer"
          >
            {mobileMenuOpen ? (lang === 'en' ? 'Close' : 'Fechar') : 'Menu'}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-4 bg-[#d6d6d6] flex flex-wrap gap-5 text-[16px] font-medium">
          <a href="#platform" onClick={() => setMobileMenuOpen(false)}>
            {lang === 'en' ? 'Platform' : 'Plataforma'}
          </a>
          <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>
            {lang === 'en' ? 'Workflow' : 'Fluxo'}
          </a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
            {lang === 'en' ? 'Pricing' : 'Planos'}
          </a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
            FAQ
          </a>
        </div>
      )}

      <main>
        {/* HERO — Two-line statement, full width (Type and nothing else) */}
        <section className="px-4 sm:px-6 min-h-[64svh] lg:min-h-[84svh] flex flex-col justify-between pt-[7svh] sm:pt-[9svh] pb-7">
          <h1 className="w-full font-black text-[#7d0c14] tracking-[-0.045em] leading-[0.88] text-[14vw] sm:text-[11.5vw] lg:text-[clamp(96px,11.6vw,176px)]">
            <span className="mask-line-wrap">
              <span className="hero-line-1 text-left">
                {lang === 'en' ? 'Voice AI for' : 'Voz de IA e'}
              </span>
            </span>
            <span className="mask-line-wrap">
              <span className="hero-line-2 text-left md:text-right">
                {lang === 'en' ? 'sales teams.' : 'telemetria.'}
              </span>
            </span>
          </h1>

          <div className="hero-bottom-arrive mt-10 md:mt-16 lg:mt-[12svh] flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <p className="text-[18px] sm:text-[22px] leading-[1.35] max-w-[42ch] text-[#7d0c14]">
              {lang === 'en'
                ? 'Autonomous B2B voice qualification and first-party server-side CAPI telemetry in one software platform.'
                : 'Qualificação autônoma por voz B2B e telemetria server-side CAPI first-party em uma plataforma SaaS.'}
            </p>

            <a
              href="mailto:kelvin@konverops.tech?subject=Konverops%20SaaS%20Access"
              className="w-full sm:w-auto shrink-0 whitespace-nowrap min-h-[48px] inline-flex items-center justify-center bg-[#7d0c14] text-[#e2e2e2] px-7 py-3.5 text-[18px] font-medium hover:bg-[#5f080e] active:scale-[0.98] transition-[background-color,transform]"
            >
              {lang === 'en' ? 'Request Access' : 'Solicitar Acesso'}
            </a>
          </div>
        </section>

        {/* SECTION 1: SHOWCASE — Two giant words compared + Architectural Telemetry Context */}
        <section id="platform" className="px-4 sm:px-6 pt-20 sm:pt-32 pb-20">
          <div className="reveal-item grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <h2 className="md:col-span-5 text-[28px] sm:text-[36px] font-black tracking-[-0.03em] leading-[1.05]">
              {lang === 'en' ? 'Latency decides' : 'Latência decide'}
            </h2>
            <p className="md:col-start-7 md:col-span-6 text-[18px] leading-[1.55] text-[#7d0c14] max-w-[54ch]">
              {lang === 'en'
                ? 'Browser-side ad pixels lose up to 35% of conversion signals, and manual lead callbacks take hours. Konverops executes edge attribution routing and neural voice qualification automatically in milliseconds so adult corporate buyers book straight onto your team calendar.'
                : 'Pixels no navegador perdem até 35% dos eventos e retornos manuais levam horas. A Konverops executa roteamento de atribuição na borda e qualificação por voz neural em milissegundos para leads corporativos B2B.'}
            </p>
          </div>

          <div className="mt-14 sm:mt-[10vh] grid grid-cols-1 md:grid-cols-12 gap-10">
            <figure className="reveal-item md:col-span-6" data-delay="60">
              <div className="h-[160px] sm:h-[250px] overflow-hidden bg-[#d6d6d6] md:bg-transparent px-4 md:px-0 pt-2">
                <div className="font-black text-[#7d0c14] tracking-[-0.05em] leading-[0.82] text-[36vw] sm:text-[24vw] md:text-[clamp(140px,18vw,250px)] select-none">
                  4.8s
                </div>
              </div>
              <figcaption className="mt-3 text-[18px] text-[#7a4a4e]">
                {lang === 'en' ? 'Browser pixel and manual callback' : 'Pixel no navegador e retorno manual'}
              </figcaption>
            </figure>

            <figure className="reveal-item md:col-span-6" data-delay="140">
              <div className="h-[160px] sm:h-[250px] overflow-hidden bg-[#7d0c14] text-[#e2e2e2] md:bg-transparent md:text-[#7d0c14] px-4 md:px-0 pt-2">
                <div className="font-black tracking-[-0.05em] leading-[0.82] text-[36vw] sm:text-[24vw] md:text-[clamp(140px,18vw,250px)] select-none">
                  0.3s
                </div>
              </div>
              <figcaption className="mt-3 text-[18px] text-[#7a4a4e]">
                {lang === 'en' ? 'Konverops Voice & CAPI router' : 'Roteador Konverops Voz e CAPI'}
              </figcaption>
            </figure>
          </div>

          {/* Product UI fragment paired with desaturated brutalist architectural concrete photograph */}
          <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="reveal-item lg:col-span-7 overflow-hidden bg-[#d6d6d6]">
              <img
                src="/images/chandigarh-secretariat.jpg"
                width={1920}
                height={1280}
                loading="lazy"
                decoding="async"
                alt="Exposed concrete architectural grid representing structured infrastructure"
                className="w-full h-[320px] sm:h-[420px] object-cover grayscale contrast-110 atmosphere-drift"
              />
            </div>

            <div
              data-ui="telemetry-console"
              data-delay="90"
              className="reveal-item lg:col-span-5 bg-[#f5f3f3] text-[#38070b] border border-[#d8ced0] p-6 flex flex-col justify-between"
            >
              <div>
                <div className="ui-header-row flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#38070b]">
                    Konverops Runtime Monitor
                  </span>
                  <span className="bg-[#f2dfe0] text-[#7d0c14] px-2.5 py-0.5 text-[13px] font-medium">
                    200 OK
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="bg-[#ebe7e7] p-3.5">
                    <div className="text-[13px] text-[#6e4548]">
                      {lang === 'en' ? 'Server CAPI Match' : 'Correspondência CAPI'}
                    </div>
                    <div className="mt-1 text-[26px] font-black tabular-nums text-[#38070b]">
                      98.4%
                    </div>
                  </div>
                  <div className="bg-[#ebe7e7] p-3.5">
                    <div className="text-[13px] text-[#6e4548]">
                      {lang === 'en' ? 'Voice TTFB' : 'Latência de Voz'}
                    </div>
                    <div className="mt-1 text-[26px] font-black tabular-nums text-[#7d0c14]">
                      140 ms
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-[13px] text-[#6e4548] mb-2">
                    {lang === 'en' ? 'Active SaaS modules' : 'Módulos SaaS ativos'}
                  </div>
                  <table className="ui-data-table w-full text-left text-[14px] border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-2 font-medium">Voice AI Agents (ElevenLabs API)</td>
                        <td className="py-2 text-right tabular-nums text-[#6e4548]">380 ms</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Edge Conversion Workspaces</td>
                        <td className="py-2 text-right tabular-nums text-[#6e4548]">640 ms</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">First-Party CAPI Dispatcher</td>
                        <td className="py-2 text-right tabular-nums text-[#6e4548]">220 ms</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ui-footer-row mt-5 flex items-center justify-between text-[13px] text-[#6e4548]">
                <span>{lang === 'en' ? 'B2B corporate tenant mode' : 'Modo corporativo B2B'}</span>
                <span className="font-medium text-[#7d0c14]">us-ashburn-1</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW IT WORKS — Itinerary on a slip (Interactive Live Workflow) */}
        <section id="workflow" className="px-4 sm:px-6 py-28 sm:py-36 bg-[#d6d6d6]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="reveal-item lg:col-span-5">
              <h2 className="text-[clamp(36px,4.2vw,62px)] font-black tracking-[-0.035em] leading-[0.95] max-w-[14ch]">
                {lang === 'en' ? 'One pipeline, three engines' : 'Um funil, três motores'}
              </h2>
              <p className="mt-5 text-[18px] leading-[1.5] text-[#7d0c14] max-w-[34ch]">
                {lang === 'en'
                  ? 'Select a workflow to inspect exact stage timings and the live server payload routed by Konverops.'
                  : 'Escolha um fluxo abaixo para inspecionar cada etapa em milissegundos e o payload real enviado pela plataforma.'}
              </p>

              {/* Interactive one-thumb selector (the Live Thing) */}
              <div className="mt-8 flex flex-col sm:flex-row lg:flex-col gap-2.5 max-w-[340px]">
                {(Object.keys(WORKFLOWS) as WorkflowKey[]).map((key) => {
                  const isActive = workflow === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setWorkflow(key)}
                      className={`text-left px-5 py-3.5 text-[16px] font-medium transition-[background-color,color] cursor-pointer ${
                        isActive
                          ? 'bg-[#7d0c14] text-[#e2e2e2]'
                          : 'bg-[#e2e2e2] text-[#7d0c14] hover:bg-[#f2dfe0]'
                      }`}
                    >
                      {WORKFLOWS[key].tabLabel[lang]}
                    </button>
                  );
                })}
              </div>

              {/* Real JSON code block — monospace belongs strictly here */}
              <div
                data-ui="payload-preview"
                className="mt-8 bg-[#f5f3f3] border border-[#d8ced0] p-4 text-[#38070b]"
              >
                <div className="text-[13px] font-medium text-[#6e4548] mb-2">
                  {lang === 'en' ? 'Live event schema' : 'Esquema do evento'}
                </div>
                <pre className="font-mono text-[13px] leading-[1.45] overflow-x-auto text-[#38070b]">
                  <code>{activeWorkflow.payload}</code>
                </pre>
              </div>
            </div>

            {/* Paper slip on contrasting ground with zigzag bottom cut */}
            <div className="reveal-item lg:col-start-7 lg:col-span-5 flex justify-start lg:justify-end" data-delay="100">
              <div className="w-full max-w-[470px] bg-[#f4f2f2] text-[#7d0c14] pt-8 px-6 sm:px-8 pb-10 slip-zigzag">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[22px] font-black tracking-[-0.02em]">
                    {activeWorkflow.slipTitle[lang]}
                  </h3>
                  <span className="text-[14px] text-[#7a4a4e] tabular-nums">
                    konverops.tech
                  </span>
                </div>

                {activeWorkflow.stages.map((stage) => (
                  <div key={stage.phase} className="mt-7">
                    <div className="text-[16px] font-bold text-[#7d0c14]">
                      {stage.phase}
                    </div>
                    <div className="mt-2.5 space-y-2.5">
                      {stage.steps.map((step) => (
                        <div key={step.label} className="flex items-baseline text-[16px] leading-[1.4]">
                          <span className="text-[#7d0c14]">{step.label}</span>
                          <span className="leader-dots" aria-hidden="true" />
                          <span className="tabular-nums font-medium text-[#7d0c14] whitespace-nowrap">
                            {step.latency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Full-width inverted result bar */}
                <div className="mt-8 bg-[#7d0c14] text-[#e2e2e2] h-[44px] px-4 flex items-center justify-between text-[15px] font-medium">
                  <span>{activeWorkflow.outcome[lang]}</span>
                  <span className="tabular-nums font-bold">{activeWorkflow.totalTime}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRICING — The price, very large (split) */}
        <section id="pricing" className="px-4 sm:px-6 min-h-[82svh] flex items-center py-28 sm:py-36">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="reveal-item lg:col-span-4">
              <h2 className="text-[28px] sm:text-[36px] font-black tracking-[-0.03em] leading-[1.05]">
                {lang === 'en' ? 'Recurring SaaS plans' : 'Planos SaaS recorrentes'}
              </h2>
              <p className="mt-4 text-[18px] leading-[1.55] text-[#7d0c14]">
                {lang === 'en'
                  ? 'Self-serve B2B software licensing billed monthly by voice minutes, edge telemetry volume, and team seats.'
                  : 'Licenciamento SaaS B2B mensal por minutos de voz, volume de telemetria edge e assentos de equipe.'}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {(Object.keys(PLANS) as PlanKey[]).map((key) => {
                  const isActive = plan === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlan(key)}
                      className={`px-4 py-2.5 text-[15px] font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#7d0c14] text-[#e2e2e2]'
                          : 'bg-[#d6d6d6] text-[#7d0c14] hover:bg-[#f2dfe0]'
                      }`}
                    >
                      {PLANS[key].name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="reveal-item lg:col-start-6 lg:col-span-7" data-delay="90">
              {/* Oversized display price figure with overlapping [data-ui] quota card top-right */}
              <div className="relative inline-block w-full">
                <div className="flex items-baseline flex-wrap gap-x-2">
                  <span className="font-black text-[#7d0c14] leading-none text-[clamp(48px,7vw,108px)] self-start mt-2 sm:mt-4">
                    $
                  </span>
                  <span className="font-black text-[#7d0c14] tracking-[-0.055em] leading-[0.85] text-[clamp(110px,16vw,230px)] tabular-nums">
                    {activePlan.price}
                  </span>
                  <span className="text-[18px] text-[#7a4a4e] ml-1">
                    {activePlan.period[lang]}
                  </span>
                </div>

                {/* Overlapping UI fragment (top-right corner, 10–15% overlap on figure height) */}
                <div
                  data-ui="quota-badge"
                  className="mt-4 sm:mt-0 sm:absolute sm:top-0 sm:right-0 bg-[#f5f3f3] text-[#38070b] border border-[#d8ced0] p-4 w-full sm:w-[235px]"
                >
                  <div className="text-[13px] font-medium text-[#6e4548]">
                    {activePlan.quotaLabel[lang]}
                  </div>
                  <div className="mt-2.5 space-y-1.5 text-[14px]">
                    <div className="flex justify-between">
                      <span>Voice AI</span>
                      <span className="font-bold text-[#7d0c14] tabular-nums">{activePlan.voiceQuota}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Telemetry</span>
                      <span className="font-medium tabular-nums">{activePlan.eventQuota}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Access</span>
                      <span className="font-medium tabular-nums">{activePlan.seats}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-2.5 text-[18px] leading-[1.45] text-[#7d0c14]">
                {activePlan.includes[lang].map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>

              <div className="mt-8">
                <a
                  href={`mailto:kelvin@konverops.tech?subject=Konverops%20${activePlan.name}%20Plan`}
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-[#7d0c14] text-[#e2e2e2] px-8 py-4 text-[16px] font-medium hover:bg-[#5f080e] active:scale-[0.98] transition-[background-color,transform]"
                >
                  {lang === 'en' ? `Start ${activePlan.name} Workspace` : `Ativar Plano ${activePlan.name}`}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ATMOSPHERE BREAK — One desaturated licensed photograph, full-bleed relief */}
        <section aria-label="Atmosphere" className="w-full overflow-hidden bg-[#d6d6d6]">
          <img
            src="/images/choppy-lake-surface-unsplash.jpg"
            width={1920}
            height={1440}
            loading="lazy"
            decoding="async"
            alt="Rippling dark lake water surface under pale sky"
            className="w-full h-[36svh] sm:h-[48svh] object-cover grayscale contrast-115 atmosphere-drift"
          />
        </section>

        {/* SECTION 4: FAQ — Large questions, answers beside (open table, no accordions) */}
        <section id="faq" className="px-4 sm:px-6 py-28 sm:py-36">
          <div className="space-y-14 sm:space-y-[76px]">
            {/* First row holds section title in muted ink */}
            <div className="reveal-item grid grid-cols-1 md:grid-cols-12 gap-4">
              <h2 className="md:col-span-6 text-[clamp(24px,2.6vw,40px)] font-medium leading-[1.1] text-[#7a4a4e]">
                {lang === 'en' ? 'Platform questions' : 'Perguntas frequentes'}
              </h2>
            </div>

            {[
              {
                q: lang === 'en' ? 'Is Konverops an agency?' : 'A Konverops é uma agência?',
                a:
                  lang === 'en'
                    ? 'No. Konverops is a proprietary B2B SaaS platform. Organizations license seats and telemetry volume to run their own voice qualification agents, edge landing infrastructure, and server-side event pipelines.'
                    : 'Não. A Konverops é uma plataforma SaaS B2B proprietária. Empresas licenciam assentos e volume de eventos para operar seus próprios agentes de voz, páginas edge e telemetria server-side.',
              },
              {
                q: lang === 'en' ? 'How do voice agents operate?' : 'Como funcionam os agentes de voz?',
                a:
                  lang === 'en'
                    ? 'Our conversational runtime connects neural speech synthesis with CRM webhooks to qualify inbound corporate buyers over voice and chat 24/7, exclusively for adult B2B business workflows.'
                    : 'Nosso motor conversacional integra síntese de voz neural e webhooks de CRM para qualificar compradores corporativos B2B 24 horas por dia, exclusivamente para fluxos empresariais adultos.',
              },
              {
                q: lang === 'en' ? 'Why server-side event telemetry?' : 'Por que telemetria server-side?',
                a:
                  lang === 'en'
                    ? 'Browser ad blockers and cookie timeouts drop critical conversion signals. Konverops validates and hashes first-party events at the edge before dispatching straight to Meta Conversions API and internal CRMs.'
                    : 'Bloqueadores de navegador e expirações de cookies descartam sinais importantes. A Konverops valida eventos first-party na borda e envia direto para a API de Conversões e CRMs.',
              },
              {
                q: lang === 'en' ? 'What workspaces are included?' : 'O que vem nos workspaces?',
                a:
                  lang === 'en'
                    ? 'Every subscription includes sub-800ms Next.js edge routes, custom domain routing, dynamic client bio portals, and live analytics logs without separate hosting contracts.'
                    : 'Cada assinatura inclui rotas Next.js abaixo de 800 ms, domínios customizados, portais dinâmicos de conversão e logs em tempo real sem contratos extras de hospedagem.',
              },
              {
                q: lang === 'en' ? 'How fast can teams deploy?' : 'Em quanto tempo a equipe ativa?',
                a:
                  lang === 'en'
                    ? 'Request workspace access, configure your webhook endpoints and voice qualification prompts, and run end-to-end production telemetry in under an hour.'
                    : 'Solicite acesso ao workspace, conecte seus webhooks e roteiros de qualificação por voz e coloque a telemetria em produção em menos de uma hora.',
              },
            ].map((item, idx) => (
              <div
                key={item.q}
                data-delay={idx * 45}
                className="reveal-item grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-baseline"
              >
                <h3 className="md:col-span-6 text-[24px] sm:text-[clamp(26px,2.5vw,38px)] font-medium leading-[1.12] tracking-[-0.02em] text-[#7d0c14]">
                  {item.q}
                </h3>
                <p className="md:col-start-8 md:col-span-5 text-[17px] sm:text-[18px] leading-[1.55] text-[#7d0c14] max-w-[42ch]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: ABOUT — Concise statement + engineering verification */}
        <section id="about" className="px-4 sm:px-6 py-[96px] sm:py-[120px] bg-[#e2e2e2]">
          <h2 className="sr-only">
            {lang === 'en' ? 'About Konverops' : 'Sobre a Konverops'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <p className="reveal-item md:col-span-6 text-[22px] leading-[1.25] text-[#7d0c14] font-medium max-w-[30ch]">
              {lang === 'en' ? (
                <>
                  <span className="hl-soft">Kelvin Gonzaga</span> built Konverops in{' '}
                  <span className="hl-tint">São Paulo</span> to unify voice AI and CAPI telemetry.
                </>
              ) : (
                <>
                  <span className="hl-soft">Kelvin Gonzaga</span> criou a Konverops em{' '}
                  <span className="hl-tint">São Paulo</span> para unir voz IA e CAPI.
                </>
              )}
            </p>

            <div className="reveal-item md:col-start-8 md:col-span-5 space-y-4 text-[18px] leading-[1.55] text-[#7d0c14]" data-delay="80">
              <p>
                {lang === 'en'
                  ? 'Operating under CNPJ 61.492.627/0001-00, our subscription workspace connects neural voice qualification, sub-second Next.js conversion routes, and deterministic server-side logging.'
                  : 'Operando sob o CNPJ 61.492.627/0001-00, o software integra qualificação por voz neural, rotas Next.js sub-segundo e telemetria server-side determinística.'}
              </p>
              <a href="mailto:kelvin@konverops.tech" className="hl-ink inline-block text-[18px]">
                {lang === 'en' ? 'Write directly to engineering.' : 'Fale direto com a engenharia.'}
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 6: CTA — One word is the button (band) */}
        <section className="w-full">
          <a
            href="mailto:kelvin@konverops.tech?subject=Konverops%20Platform%20Deployment"
            className="group block w-full min-h-[46svh] sm:min-h-[58svh] bg-[#7d0c14] text-[#e2e2e2] hover:bg-[#d6d6d6] hover:text-[#7d0c14] focus-visible:bg-[#d6d6d6] focus-visible:text-[#7d0c14] transition-colors px-4 sm:px-6 pt-7 pb-6 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-6">
              <p className="text-[17px] sm:text-[20px] leading-[1.35] max-w-[34ch]">
                {lang === 'en'
                  ? 'Ready to launch your voice and telemetry workspace?'
                  : 'Pronto para ativar seu workspace de voz e telemetria?'}
              </p>
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
                className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              >
                <path
                  d="M12 36L36 12M36 12H16M36 12V32"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="square"
                />
              </svg>
            </div>

            <div className="mt-14 font-black tracking-[-0.055em] leading-[0.82] text-[22vw] sm:text-[clamp(120px,22vw,320px)]">
              {lang === 'en' ? 'Deploy' : 'Ativar'}
            </div>
          </a>
        </section>
      </main>

      {/* FOOTER — Invitation over a cropped name */}
      <footer className="relative w-full bg-[#38070b] text-[#e2e2e2] overflow-hidden pt-16 sm:pt-24 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          <div className="reveal-item md:col-span-7">
            <h2 className="text-[10vw] sm:text-[4.8vw] font-black tracking-[-0.035em] leading-[0.95] max-w-[14ch]">
              {lang === 'en' ? (
                <>
                  Ship revenue
                  <br />
                  faster.
                </>
              ) : (
                <>
                  Escale sua
                  <br />
                  operação.
                </>
              )}
            </h2>
            <div className="mt-7">
              <a
                href="mailto:kelvin@konverops.tech?subject=Konverops%20Enterprise%20Inquiry"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-[#e2e2e2] text-[#7d0c14] px-7 py-4 text-[16px] font-medium hover:bg-[#d6d6d6] transition-colors"
              >
                {lang === 'en' ? 'Contact Engineering' : 'Falar com Engenharia'}
              </a>
            </div>
          </div>

          <div className="reveal-item md:col-start-10 md:col-span-3 flex flex-row md:flex-col flex-wrap gap-5 md:gap-3 text-[15px] sm:text-[16px]">
            <a href="/privacidade" className="hover:opacity-75 transition-opacity">
              {lang === 'en' ? 'Privacy Policy' : 'Privacidade'}
            </a>
            <a href="/termos" className="hover:opacity-75 transition-opacity">
              {lang === 'en' ? 'Terms of Use' : 'Termos de Uso'}
            </a>
            <a
              href="https://www.linkedin.com/in/kelvin-gonzaga-347b84442/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-75 transition-opacity"
            >
              LinkedIn
            </a>
            <a href="mailto:kelvin@konverops.tech" className="hover:opacity-75 transition-opacity">
              kelvin@konverops.tech
            </a>
          </div>
        </div>

        {/* Credits and corporate details row above cropped wordmark */}
        <div className="mt-16 sm:mt-24 flex flex-col lg:flex-row lg:items-end justify-between gap-4 text-[13px] leading-[1.45] text-[#e2e2e2]">
          <div>
            CNPJ 61.492.627/0001-00 · São Paulo, Brazil · © 2026 Konverops
          </div>
          <p className="max-w-[74ch]">
            Pictures:{' '}
            <a
              href="https://commons.wikimedia.org/w/index.php?curid=2816943"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              “Chandigarh Secretariat”
            </a>{' '}
            by Lian Chang from New York City,{' '}
            <a
              href="https://creativecommons.org/licenses/by/2.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              CC BY 2.0
            </a>
            , via Wikimedia Commons;{' '}
            <a
              href="https://commons.wikimedia.org/w/index.php?curid=61648166"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              “Choppy lake surface (Unsplash)”
            </a>{' '}
            by Josefin Brosche Hagsgård broschgard,{' '}
            <a
              href="https://creativecommons.org/publicdomain/zero/1.0/deed.en/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              CC0
            </a>
            , via Wikimedia Commons.
          </p>
        </div>

        {/* Bottom cropped wordmark */}
        <div
          aria-hidden="true"
          className="mt-2 font-black tracking-[-0.055em] leading-[0.8] whitespace-nowrap text-[28vw] sm:text-[25vw] text-[#e2e2e2] translate-y-[22%] select-none pointer-events-none"
        >
          konverops
        </div>
      </footer>
    </div>
  );
}
