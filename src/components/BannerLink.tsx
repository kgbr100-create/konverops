'use client';

import Image from 'next/image';
import type { BioBanner } from '@/data/profiles';

interface BannerLinkProps {
  banner: BioBanner;
  priority?: boolean;
}

declare global {
  interface Window {
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

export default function BannerLink({ banner, priority = false }: BannerLinkProps) {
  const handleClick = () => {
    // Client-side tracking (Meta Pixel / CAPI trigger)
    if (typeof window !== 'undefined' && window.fbq && banner.trackingEvent) {
      window.fbq('track', banner.trackingEvent, {
        banner_id: banner.id,
        banner_title: banner.title,
      });
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
