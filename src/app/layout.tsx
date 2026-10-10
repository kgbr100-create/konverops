import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konverops | Engenharia de Vendas & Infraestrutura de Performance",
  description:
    "Operações avançadas de tráfego pago (Meta Ads), desenvolvimento web em Next.js e automação comercial com telemetria de inteligência artificial.",
  keywords: [
    "Konverops",
    "Gestão de Tráfego Pago",
    "Meta Ads",
    "Media Buyer",
    "Engenharia de Vendas",
    "Next.js",
    "Automação Comercial",
    "Chatbots de IA",
    "Looker Studio",
    "Inteligência Artificial",
  ],
  authors: [{ name: "Kelvin Nunes Gonzaga" }],
  openGraph: {
    title: "Konverops | Engenharia de Vendas & Infraestrutura de Performance",
    description:
      "Transformamos investimento em mídia paga em receita previsível com infraestrutura moderna de dados e IA.",
    url: "https://konverops.tech",
    siteName: "Konverops",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
