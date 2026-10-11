import Link from "next/link";

export default function PrivacyPolicy() {
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
            Política de Privacidade
          </h1>
          <p className="mt-2 text-xs font-mono text-zinc-500">
            Última atualização: Outubro de 2026 • Konverops (CNPJ: 61.492.627/0001-00)
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">1. Visão Geral e Compromisso</h2>
          <p>
            A <strong>Konverops</strong> (Kelvin Nunes Gonzaga, inscrita no CNPJ sob o nº 61.492.627/0001-00, 
            com sede em São Paulo/SP, Brasil) preza pela total transparência, segurança da informação e privacidade dos dados de seus clientes, 
            parceiros e visitantes, em integral conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">2. Coleta de Dados e Finalidade</h2>
          <p>
            Coletamos exclusivamente as informações estritamente necessárias para a prestação de serviços de engenharia de vendas, 
            otimização de mídia paga, automação comercial e desenvolvimento de software:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Dados de Contato Comercial:</strong> Nome, e-mail corporativo, telefone e nome da empresa fornecidos voluntariamente via formulários de contato ou canais diretos.</li>
            <li><strong>Métricas de Tráfego e Navegação:</strong> Dados analíticos anônimos para aprimoramento da experiência do usuário, medição de conversão e diagnóstico técnico de desempenho.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">3. Segurança e Retenção de Dados</h2>
          <p>
            Adotamos medidas técnicas e organizacionais de padrão corporativo para proteger as informações contra acessos não autorizados, 
            vazamentos ou alterações indevidas. Os dados são mantidos apenas pelo período necessário para o cumprimento das obrigações contratuais e legais vigentes.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">4. Direitos do Titular</h2>
          <p>
            Nos termos da LGPD, os titulares de dados têm direito a solicitar confirmação de tratamento, acesso, retificação, anonimização, 
            eliminação ou revogação de consentimento a qualquer momento por meio do nosso canal de encarregado de dados.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="text-lg font-bold text-white">5. Canal de Contato do Encarregado (DPO)</h2>
          <p>
            Para exercer seus direitos ou esclarecer qualquer dúvida referente a esta política, entre em contato pelo e-mail corporativo:{" "}
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
