'use client';

import Image from 'next/image';
import type { BioBanner } from '@/data/profiles';

interface BannerLinkProps {
  banner: BioBanner;
  priority?: boolean;
  slug?: string;
  metaPixelId?: string;
  metaAccessToken?: string;
  metaTestEventCode?: string;
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
}: BannerLinkProps) {
  const handleClick = () => {
    // 1. Registro no Analytics Interno Konverops (Cliques por Elemento)
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

  return (
    <a
      href={banner.destinationUrl}
      target={banner.target || '_blank'}
      rel="noopener noreferrer"
      onClick={handleClick}
      className="block relative w-full rounded-[22px] overflow-hidden shadow-lg shadow-black/15 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] group"
    >
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        width={640}
        height={192}
        priority={priority}
        unoptimized={banner.imageUrl.startsWith('data:')}
        className="w-full h-auto object-cover block select-none"
      />
    </a>
  );
}
