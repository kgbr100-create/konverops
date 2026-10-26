'use client';

import Image from 'next/image';
import type {
  BioBanner,
  BannerBorderRadius,
  BannerBorderStyle,
  BannerShadow,
} from '@/data/profiles';

interface BannerLinkProps {
  banner: BioBanner;
  priority?: boolean;
  slug?: string;
  metaPixelId?: string;
  metaAccessToken?: string;
  metaTestEventCode?: string;
  bannerBorderRadius?: BannerBorderRadius;
  bannerBorderStyle?: BannerBorderStyle;
  bannerShadow?: BannerShadow;
  bannerElevation?: boolean;
  isLight?: boolean;
}

declare global {
  interface Window {
    fbq?: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
  }
}

export default function BannerLink({
  banner,
  priority = false,
  slug,
  metaPixelId,
  metaAccessToken,
  metaTestEventCode,
  bannerBorderRadius = 'md',
  bannerBorderStyle = 'subtle',
  bannerShadow = 'bottom',
  bannerElevation = true,
  isLight = false,
}: BannerLinkProps) {
  const handleClick = () => {
    // Identificador persistente de visitante único no navegador
    let visitorId = '';
    if (typeof window !== 'undefined' && window.localStorage) {
      visitorId = localStorage.getItem('konverops_vid') || '';
      if (!visitorId) {
        visitorId =
          'v_' +
          (typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 12));
        localStorage.setItem('konverops_vid', visitorId);
      }
    }

    // 1. Registro no Analytics Interno Konverops (Cliques Totais e Únicos)
    if (slug) {
      try {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'click',
            slug,
            bannerId: banner.id,
            bannerTitle: banner.title,
            visitorId,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Silent catch
      }
    }

    if (!banner.trackingEvent || banner.trackingEvent === 'None') {
      return;
    }

    const eventName =
      banner.trackingEvent === 'Custom'
        ? banner.customEventName || 'CustomBioClick'
        : banner.trackingEvent;

    // Gera UUID v4 único para garantir a deduplicação perfeita no Meta Events Manager
    const eventId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    const customData = {
      content_name: banner.title,
      content_category: banner.eventCategory || 'Bio Link',
      value: Number(banner.eventValue) || 0,
      currency: banner.eventCurrency || 'BRL',
    };

    // 2. Disparo no Navegador (Meta Pixel fbq) com eventID para deduplicação
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, customData, { eventID: eventId });
    }

    // 3. Disparo no Servidor (Meta Conversions API - CAPI) em background
    if (metaPixelId) {
      try {
        fetch('/api/meta-capi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pixelId: metaPixelId,
            accessToken: metaAccessToken,
            testEventCode: metaTestEventCode,
            eventName,
            eventId, // Mesmo ID do navegador
            sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
            customData,
          }),
          keepalive: true, // Garante envio mesmo se a página for redirecionada
        }).catch(() => {
          // Silent catch para não interromper navegação do usuário
        });
      } catch {
        // Fallback silencioso
      }
    }
  };

  const getRadiusClass = (radius?: BannerBorderRadius) => {
    switch (radius) {
      case 'none':
        return 'rounded-none';
      case 'sm':
        return 'rounded-lg';
      case 'lg':
        return 'rounded-[20px]';
      case 'xl':
        return 'rounded-[26px]';
      case 'md':
      default:
        return 'rounded-[16px]'; // 16px - Equilíbrio refinado e moderno sem cortar cantos de texto
    }
  };

  const getBorderClass = (style?: BannerBorderStyle, isLightBg?: boolean) => {
    switch (style) {
      case 'glow':
        return 'border border-emerald-500/40';
      case 'none':
        return 'border-0';
      case 'subtle':
      default:
        return isLightBg ? 'border border-slate-900/10' : 'border border-white/10';
    }
  };

  const getShadowClass = (shadow?: BannerShadow, isLightBg?: boolean) => {
    switch (shadow) {
      case 'none':
        return 'shadow-none';
      case 'bottom':
        return isLightBg
          ? 'shadow-[0_12px_20px_-5px_rgba(0,0,0,0.08)]'
          : 'shadow-[0_14px_24px_-6px_rgba(0,0,0,0.55)]';
      case 'top':
        return isLightBg
          ? 'shadow-[0_-10px_18px_-4px_rgba(0,0,0,0.08)]'
          : 'shadow-[0_-12px_22px_-5px_rgba(0,0,0,0.45)]';
      case 'subtle':
        return isLightBg
          ? 'shadow-sm shadow-slate-300/60'
          : 'shadow-sm shadow-black/30';
      case 'full':
      default:
        return isLightBg
          ? 'shadow-md shadow-slate-300/80'
          : 'shadow-lg shadow-black/40';
    }
  };

  const getHoverClass = (
    elevation?: boolean,
    shadow?: BannerShadow,
    isLightBg?: boolean
  ) => {
    if (elevation === false) {
      return 'transition-all duration-200';
    }

    switch (shadow) {
      case 'none':
        return 'transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] shadow-none hover:shadow-none';
      case 'bottom':
        return isLightBg
          ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_28px_-6px_rgba(0,0,0,0.12)] active:scale-[0.98]'
          : 'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_32px_-6px_rgba(0,0,0,0.7)] active:scale-[0.98]';
      case 'top':
        return isLightBg
          ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_-14px_24px_-4px_rgba(0,0,0,0.12)] active:scale-[0.98]'
          : 'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_-16px_28px_-5px_rgba(0,0,0,0.6)] active:scale-[0.98]';
      case 'subtle':
        return isLightBg
          ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]'
          : 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/50 active:scale-[0.99]';
      case 'full':
      default:
        return 'transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]';
    }
  };

  const radiusClass = getRadiusClass(bannerBorderRadius);
  const borderClass = getBorderClass(bannerBorderStyle, isLight);
  const shadowClass = getShadowClass(bannerShadow, isLight);
  const hoverClass = getHoverClass(bannerElevation, bannerShadow, isLight);

  return (
    <a
      href={banner.destinationUrl}
      target={banner.target || '_blank'}
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`block relative w-full ${radiusClass} ${borderClass} ${shadowClass} ${hoverClass} overflow-hidden group`}
      style={{ isolation: 'isolate' }}
    >
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        width={640}
        height={192}
        priority={priority}
        unoptimized={banner.imageUrl.startsWith('data:')}
        className={`w-full h-auto object-cover block select-none ${radiusClass}`}
      />
    </a>
  );
}
