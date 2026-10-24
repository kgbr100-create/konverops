import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getClientBySlug } from '@/lib/profiles-store';
import { getAllProfileSlugs, getProfileBySlug } from '@/data/profiles';
import BannerLink from '@/components/BannerLink';

export const instant = false;



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
  const profile = (await getClientBySlug(slug)) || getProfileBySlug(slug);

  if (!profile) {
    return {
      title: 'Perfil Não Encontrado | Konverops',
    };
  }

  return {
    title: `${profile.name || profile.nicheBadge} | ${profile.nicheBadge}`,
    description: profile.description || `Bio Link Oficial de ${profile.name || profile.nicheBadge} na Konverops`,
    openGraph: {
      title: `${profile.name || profile.nicheBadge} | ${profile.nicheBadge}`,
      description: profile.description || `Bio Link Oficial de ${profile.name || profile.nicheBadge} na Konverops`,
      url: `https://www.konverops.tech/${profile.slug}`,
      siteName: 'Konverops Tech',
      locale: 'pt_BR',
      type: 'website',
    },
  };
}

export default async function BioProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = (await getClientBySlug(slug)) || getProfileBySlug(slug);

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
          {profile.banners && profile.banners.length > 0 ? (
            profile.banners.map((banner, index) => (
              <BannerLink
                key={banner.id || index}
                banner={banner}
                priority={index === 0}
              />
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              Nenhum banner cadastrado ainda neste perfil.
            </div>
          )}
        </div>

        {/* Rodapé Limpo */}
        <footer className="mt-5 pt-2 text-center text-xs text-slate-600 font-bold tracking-tight">
          <a
            href="https://www.konverops.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 transition-colors"
          >
            {profile.footerUrl || `konverops.tech/${profile.slug}`}
          </a>
        </footer>

      </div>
    </main>
  );
}
