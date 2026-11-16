import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["400", "500", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Konverops | B2B Voice AI & Revenue Telemetry Platform",
  description:
    "B2B SaaS platform unifying real-time conversational voice agents, first-party server-side CAPI telemetry, and sub-second edge conversion infrastructure.",
  keywords: [
    "Konverops",
    "B2B Voice AI",
    "Sales Engineering Software",
    "Server-Side Telemetry",
    "CAPI Event Router",
    "Revenue Infrastructure SaaS",
    "Conversational AI Agents",
    "Edge Conversion Workspaces",
  ],
  authors: [{ name: "Kelvin Gonzaga" }],
  openGraph: {
    title: "Konverops | B2B Voice AI & Revenue Telemetry Platform",
    description:
      "First-party server-side event telemetry and autonomous B2B voice qualification agents in one platform.",
    url: "https://konverops.tech",
    siteName: "Konverops",
    locale: "en_US",
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
      lang="en"
      className={`${epilogue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#e2e2e2] text-[#7d0c14] selection:bg-[#7d0c14] selection:text-[#e2e2e2]">
        {children}
      </body>
    </html>
  );
}
