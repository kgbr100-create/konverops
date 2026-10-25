'use client';

import { useEffect } from 'react';

interface PageViewTrackerProps {
  slug: string;
}

export default function PageViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;

    try {
      // Disparo em background com keepalive
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'view',
          slug,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Fallback silencioso
    }
  }, [slug]);

  return null;
}
