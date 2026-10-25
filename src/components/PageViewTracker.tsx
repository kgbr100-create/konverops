'use client';

import { useEffect } from 'react';

interface PageViewTrackerProps {
  slug: string;
}

export default function PageViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;

    try {
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

      // Disparo em background com keepalive
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'view',
          slug,
          visitorId,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Fallback silencioso
    }
  }, [slug]);

  return null;
}
