import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-black text-zinc-300 px-6 py-20 selection:bg-emerald-500 selection:text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition"
        >
          ← Voltar para Konverops
        </Link>

        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Termos de Uso e Serviço
          </h1>
          <p className="mt-2 text-xs font-mono text-zinc-500">
            Última atualização: Outubro de 2026 • Konverops (CNPJ: 61.492.627/0001-00)
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar a plataforma e utilizar os serviços da <strong>Konverops</strong> (Kelvin Nunes Gonzaga, 
            CNPJ: 61.492.627/0001-00, sediada em São Paulo/SP), o usuário ou contratante concorda com as disposições 
            destes Termos de Uso e com a nossa Política de Privacidade.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">2. Escopo dos Serviços</h2>
          <p>
            A Konverops é uma consultoria técnica de Sales Engineering e infraestrutura de crescimento digital, 
            fornecendo serviços especializados que compreendem:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Gestão, estruturação e otimização de campanhas de tráfego pago (Meta Ads e ecossistemas de mídia digital);</li>
            <li>Implementação de rastreamento server-side, Meta Conversions API (CAPI) e arquiteturas de dados first-party;</li>
            <li>Desenvolvimento e hospedagem de interfaces web de alta velocidade em Next.js e computação edge;</li>
            <li>Desenvolvimento e integração de agentes inteligentes de automação e qualificação comercial.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">3. Propriedade Intelectual</h2>
          <p>
            Todos os materiais, códigos-fonte proprietários, arquiteturas de agentes, marcas, logotipos e conteúdos 
            disponibilizados no domínio <em>konverops.tech</em> são de titularidade exclusiva da Konverops, sendo vedada 
            sua reprodução, distribuição ou engenharia reversa sem autorização prévia por escrito.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">4. Confidencialidade e SLA</h2>
          <p>
            Os projetos contratados são regidos por termos específicos de confidencialidade (NDA) e acordos de nível de serviço (SLA), 
            garantindo sigilo integral sobre estratégias comerciais, volumes de investimento e dados proprietários dos clientes.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">5. Legislação Aplicável e Foro</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Para a resolução de eventuais litígios decorrentes 
            deste instrumento, fica eleito o Foro da Comarca de São Paulo/SP.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">6. Contato Corporativo</h2>
          <p>
            Dúvidas operacionais ou jurídicas podem ser direcionadas a:{" "}
            <a href="mailto:kelvin@konverops.tech" className="text-emerald-400 underline hover:text-emerald-300">
              kelvin@konverops.tech
            </a>.
          </p>
        </section>

        <footer className="border-t border-zinc-800 pt-8 text-xs font-mono text-zinc-500">
          Konverops • Engenharia de Vendas, Performance & Infraestrutura B2B • São Paulo, SP, Brasil
        </footer>
      </div>
    </main>
  );
}
