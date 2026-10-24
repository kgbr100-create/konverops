import type { Metadata } from 'next';
import Script from 'next/script';
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = (await getClientBySlug(slug)) || getProfileBySlug(slug);

  if (!profile) {
    return {
      title: 'Perfil Não Encontrado | Konverops',
    };
  }

  const displayName = profile.name || profile.nicheBadge || 'Konverops';
  const displayTitle = profile.showNicheBadge && profile.nicheBadge
    ? `${displayName} | ${profile.nicheBadge}`
    : `${displayName} | Konverops`;

  return {
    title: displayTitle,
    description:
      profile.description ||
      `Bio Link Oficial de ${displayName} hospedado na infraestrutura Konverops`,
    openGraph: {
      title: displayTitle,
      description:
        profile.description ||
        `Bio Link Oficial de ${displayName} hospedado na infraestrutura Konverops`,
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

  const pageBg = profile.pageBgColor || '#eef2f6';
  const cardBg = profile.cardBgColor || '#ffffff';

  return (
    <>
      {/* Meta Pixel Oficial Multi-Tenant por Cliente */}
      {profile.metaPixelId && (
        <Script id={`meta-pixel-${profile.slug}`} strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${profile.metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      <main
        style={{ backgroundColor: pageBg }}
        className="min-h-screen text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 antialiased transition-colors duration-300"
      >
        {/* Smartphone-width Container */}
        <div
          style={{ backgroundColor: cardBg }}
          className="w-full max-w-[420px] rounded-[36px] shadow-2xl shadow-black/10 border border-black/5 px-4 pt-5 pb-6 flex flex-col items-center transition-colors duration-300"
        >
          {/* Niche Badge - Renderiza apenas se showNicheBadge for explicitamente true */}
          {profile.showNicheBadge && profile.nicheBadge && (
            <div className="flex justify-center mb-3.5">
              <span
                style={{ backgroundColor: profile.badgeBgColor || '#00b768' }}
                className="px-5 py-1.5 rounded-full text-white font-black text-xs tracking-wider uppercase shadow-md shadow-emerald-500/25"
              >
                {profile.nicheBadge}
              </span>
            </div>
          )}

          {/* Feed de Banners Gráficos de Alta Fidelidade */}
          <div className="w-full space-y-3">
            {profile.banners && profile.banners.length > 0 ? (
              profile.banners.map((banner, index) => (
                <BannerLink
                  key={banner.id || index}
                  banner={banner}
                  priority={index === 0}
                  metaPixelId={profile.metaPixelId}
                  metaAccessToken={profile.metaAccessToken}
                  metaTestEventCode={profile.metaTestEventCode}
                />
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                Nenhum banner cadastrado ainda neste perfil.
              </div>
            )}
          </div>

          {/* Rodapé Limpo */}
          <footer className="mt-5 pt-2 text-center text-xs font-bold tracking-tight opacity-70 hover:opacity-100 transition-opacity">
            <a
              href="https://www.konverops.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-500 transition-colors"
            >
              {profile.footerUrl || `konverops.tech/${profile.slug}`}
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
