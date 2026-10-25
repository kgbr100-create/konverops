import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { getClientBySlug } from '@/lib/profiles-store';
import { getProfileBySlug } from '@/data/profiles';
import BannerLink from '@/components/BannerLink';
import PageViewTracker from '@/components/PageViewTracker';

export const instant = false;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function isLightColor(hexColor?: string): boolean {
  if (!hexColor) return false;
  const hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  return false;
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
  const displayTitle =
    profile.showNicheBadge && profile.nicheBadge
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

  const pageBg = profile.pageBgColor || '#070b14';
  const isLight = isLightColor(pageBg);

  const nameColor = isLight ? 'text-slate-900' : 'text-white';
  const roleColor = isLight ? 'text-emerald-700' : 'text-emerald-400';
  const descColor = isLight ? 'text-slate-600' : 'text-slate-300';
  const footerColor = isLight
    ? 'text-slate-500 hover:text-slate-800'
    : 'text-slate-500 hover:text-slate-300';

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

      {/* Analytics Page View Tracker */}
      <PageViewTracker slug={profile.slug} />

      {/* Main Page Layout (Container Artificial Removido - Banners com Máximo Impacto) */}
      <main
        style={{ backgroundColor: pageBg }}
        className="min-h-screen flex flex-col items-center py-8 px-3.5 sm:px-5 antialiased transition-colors duration-300 selection:bg-emerald-500 selection:text-black"
      >
        <div className="w-full max-w-[480px] flex flex-col items-center">
          
          {/* SEÇÃO HERO DE TOPO (Foto/Logo + Nome + Cargo + Descrição/CTA) */}
          {profile.showHero !== false && (
            <header className="w-full flex flex-col items-center text-center mb-5 sm:mb-6 pt-1 sm:pt-2">
              {/* Foto de Perfil ou Logo da Empresa */}
              {profile.avatarUrl ? (
                <div className="relative mb-3.5 group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-xl shadow-emerald-500/20">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name || profile.slug}
                      className="w-full h-full object-cover rounded-full bg-slate-900 select-none"
                    />
                  </div>
                </div>
              ) : null}

              {/* Pílula de Nicho (se ativada no admin) */}
              {profile.showNicheBadge && profile.nicheBadge && (
                <div className="mb-2">
                  <span
                    style={{ backgroundColor: profile.badgeBgColor || '#00b768' }}
                    className="px-4 py-1 rounded-full text-white font-black text-[11px] tracking-wider uppercase shadow-md shadow-emerald-500/20"
                  >
                    {profile.nicheBadge}
                  </span>
                </div>
              )}

              {/* Nome do Cliente com Selo de Verificado */}
              <h1 className={`text-xl sm:text-2xl font-black ${nameColor} tracking-tight flex items-center justify-center gap-1.5`}>
                <span>{profile.name || profile.slug}</span>
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black shadow-sm"
                  title="Perfil Oficial Verificado"
                >
                  ✓
                </span>
              </h1>

              {/* Cargo / Título Profissional */}
              {profile.title && (
                <p className={`text-xs sm:text-sm font-bold ${roleColor} mt-1 tracking-tight`}>
                  {profile.title}
                </p>
              )}

              {/* Bio & Chamada para Ação nos Banners */}
              {profile.description && (
                <p className={`text-xs sm:text-sm ${descColor} max-w-sm mt-2.5 leading-relaxed font-normal`}>
                  {profile.description}
                </p>
              )}
            </header>
          )}

          {/* FEED DE BANNERS COM MÁXIMO APROVEITAMENTO DE ESPAÇO */}
          <div className="w-full space-y-3.5">
            {profile.banners && profile.banners.length > 0 ? (
              profile.banners.map((banner, index) => (
                <BannerLink
                  key={banner.id || index}
                  banner={banner}
                  priority={index === 0}
                  slug={profile.slug}
                  metaPixelId={profile.metaPixelId}
                  metaAccessToken={profile.metaAccessToken}
                  metaTestEventCode={profile.metaTestEventCode}
                  bannerBorderRadius={profile.bannerBorderRadius || 'md'}
                  bannerBorderStyle={profile.bannerBorderStyle || 'subtle'}
                  isLight={isLight}
                />
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-dashed border-slate-700">
                Nenhum banner comercial cadastrado ainda neste perfil.
              </div>
            )}
          </div>

          {/* Rodapé Limpo */}
          <footer className={`mt-8 pt-4 pb-8 text-center text-xs font-semibold tracking-tight ${footerColor} transition-colors`}>
            <a
              href="https://www.konverops.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              {profile.footerUrl || `konverops.tech/${profile.slug}`}
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
