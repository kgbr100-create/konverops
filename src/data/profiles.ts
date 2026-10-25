export type MetaStandardEvent =
  | 'Contact'
  | 'Schedule'
  | 'Lead'
  | 'InitiateCheckout'
  | 'ViewContent'
  | 'Custom'
  | 'None';

export interface BioBanner {
  id: string;
  title: string;
  imageUrl: string;
  destinationUrl: string;
  trackingEvent?: MetaStandardEvent;
  customEventName?: string;
  eventCategory?: string;
  eventValue?: number;
  eventCurrency?: string;
  target?: '_blank' | '_self';
}

export interface ClientProfile {
  slug: string;
  showHero?: boolean;
  showNicheBadge?: boolean;
  nicheBadge?: string;
  badgeBgColor?: string; // e.g. '#00b768'
  pageBgColor?: string; // e.g. '#070b14' ou '#ffffff'
  cardBgColor?: string; // e.g. '#0f172a' ou '#ffffff'
  metaPixelId?: string; // ID do Meta Pixel / Dataset (ex: '123456789012345')
  metaAccessToken?: string; // Token CAPI opcional
  metaTestEventCode?: string; // Código de teste da Meta (ex: 'TEST12345')
  name: string;
  title: string;
  description: string;
  avatarUrl?: string;
  banners: BioBanner[];
  footerUrl: string;
}

export const CLIENT_PROFILES: Record<string, ClientProfile> = {
  kelvin: {
    slug: 'kelvin',
    showHero: true,
    showNicheBadge: false,
    nicheBadge: 'Engenharia de Vendas',
    badgeBgColor: '#00b768',
    pageBgColor: '#070b14',
    cardBgColor: '#0a0f1d',
    metaPixelId: '',
    name: 'Kelvin Gonzaga',
    title: 'Fundador & Head of Sales Engineering • Konverops',
    description: 'Engenharia de Vendas B2B & Infraestrutura Web de Ultra Performance. Selecione uma das opções abaixo para falar diretamente comigo no WhatsApp ou agendar um diagnóstico.',
    avatarUrl: '/banners/assets/founder_portrait.jpg',
    footerUrl: 'konverops.tech/kelvin',
    banners: [
      {
        id: 'whatsapp',
        title: 'Fale no WhatsApp',
        imageUrl: '/banners/kelvin/banner-whatsapp.png',
        destinationUrl: 'https://wa.me/5511999999999?text=Ol%C3%A1%20Kelvin,%20gostaria%20de%20alinhar%20um%20projeto%20com%20a%20Konverops.',
        trackingEvent: 'Contact',
        eventCategory: 'WhatsApp',
        eventValue: 0,
        eventCurrency: 'BRL',
        target: '_blank',
      },
      {
        id: 'diagnostico',
        title: 'Diagnóstico de Escala',
        imageUrl: '/banners/kelvin/banner-diagnostico.png',
        destinationUrl: 'https://wa.me/5511999999999?text=Ol%C3%A1%20Kelvin,%20gostaria%20de%20agendar%20um%20Diagn%C3%B3stico%20de%20Performance%20Web.',
        trackingEvent: 'Schedule',
        eventCategory: 'Agendamento',
        eventValue: 0,
        eventCurrency: 'BRL',
        target: '_blank',
      },
      {
        id: 'capi',
        title: 'Meta CAPI Server-Side',
        imageUrl: '/banners/kelvin/banner-capi.png',
        destinationUrl: 'https://wa.me/5511999999999?text=Ol%C3%A1%20Kelvin,%20quero%20conhecer%20a%20blindagem%20Meta%20CAPI.',
        trackingEvent: 'Lead',
        eventCategory: 'Serviço',
        eventValue: 0,
        eventCurrency: 'BRL',
        target: '_blank',
      },
      {
        id: 'konverops',
        title: 'Infraestrutura Konverops',
        imageUrl: '/banners/kelvin/banner-konverops.png',
        destinationUrl: 'https://www.konverops.tech',
        trackingEvent: 'ViewContent',
        eventCategory: 'Website',
        eventValue: 0,
        eventCurrency: 'BRL',
        target: '_blank',
      },
    ],
  },
};

export function getProfileBySlug(slug: string): ClientProfile | undefined {
  return CLIENT_PROFILES[slug.toLowerCase()];
}

export function getAllProfileSlugs(): string[] {
  return Object.keys(CLIENT_PROFILES);
}
