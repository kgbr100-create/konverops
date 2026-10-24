import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfileBySlug, getAllProfileSlugs } from '@/data/profiles';
import BannerLink from '@/components/BannerLink';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllProfileSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);

  if (!profile) {
    return {
      title: 'Perfil Não Encontrado | Konverops',
    };
  }

  return {
    title: `${profile.name} | ${profile.nicheBadge}`,
    description: profile.description,
    openGraph: {
      title: `${profile.name} | ${profile.nicheBadge}`,
      description: profile.description,
      url: `https://www.konverops.tech/${profile.slug}`,
      siteName: 'Konverops Tech',
      locale: 'pt_BR',
      type: 'website',
    },
  };
}

export default async function BioProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#eef2f6] text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 antialiased">
      {/* Smartphone-width Container */}
      <div className="w-full max-w-[420px] bg-white rounded-[36px] shadow-2xl shadow-slate-300/50 border border-slate-200/80 px-4 pt-5 pb-6 flex flex-col items-center">
        
        {/* Niche Badge (Assinatura Visual de Topo) */}
        <div className="flex justify-center mb-3.5">
          <span
            style={{ backgroundColor: profile.badgeBgColor || '#00b768' }}
            className="px-5 py-1.5 rounded-full text-white font-black text-xs tracking-wider uppercase shadow-md shadow-emerald-500/25"
          >
            {profile.nicheBadge}
          </span>
        </div>

        {/* Feed de Banners Gráficos de Alta Fidelidade */}
        <div className="w-full space-y-3">
          {profile.banners.map((banner, index) => (
            <BannerLink
              key={banner.id}
              banner={banner}
              priority={index === 0}
            />
          ))}
        </div>

        {/* Rodapé Limpo */}
        <footer className="mt-5 pt-2 text-center text-xs text-slate-600 font-bold tracking-tight">
          <a
            href="https://www.konverops.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 transition-colors"
          >
            {profile.footerUrl}
          </a>
        </footer>

      </div>
    </main>
  );
}
