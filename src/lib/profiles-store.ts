import type { ClientProfile } from '@/data/profiles';
import { CLIENT_PROFILES } from '@/data/profiles';

const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL || 'https://unique-ladybird-238762.upstash.io';
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  'gQAAAAAAA6SqAQIgcDJhNWRkZTM5N2E1ODQ0NTIxYmM4YjA0ZjgzNDU3NTc2YQ';

async function redisCommand(command: (string | number)[]): Promise<any> {
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });
    const json = await res.json();
    return json.result;
  } catch (error) {
    console.error('Upstash Redis Command Error:', error);
    return null;
  }
}

export async function getClientsRecord(): Promise<Record<string, ClientProfile>> {
  const result: Record<string, ClientProfile> = { ...CLIENT_PROFILES };

  try {
    // Busca todos os slugs cadastrados no conjunto 'profiles:slugs'
    const slugs = await redisCommand(['SMEMBERS', 'profiles:slugs']);

    if (Array.isArray(slugs) && slugs.length > 0) {
      // Busca cada perfil
      for (const slug of slugs) {
        const raw = await redisCommand(['GET', `profile:${slug}`]);
        if (raw) {
          try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            result[slug.toLowerCase()] = parsed;
          } catch (e) {
            console.error(`Falha ao deserializar perfil ${slug}:`, e);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Erro ao buscar perfis no Redis, usando fallback:', error);
  }

  return result;
}

export async function getClientBySlug(slug: string): Promise<ClientProfile | undefined> {
  const normalizedSlug = slug.toLowerCase().trim();

  // Tenta buscar no Redis primeiro
  try {
    const raw = await redisCommand(['GET', `profile:${normalizedSlug}`]);
    if (raw) {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
  } catch (error) {
    console.warn(`Erro ao buscar profile:${normalizedSlug} no Redis:`, error);
  }

  // Fallback para perfil mestre estático
  return CLIENT_PROFILES[normalizedSlug];
}

export async function saveClientProfile(profile: ClientProfile): Promise<void> {
  const normalizedSlug = profile.slug.toLowerCase().trim();

  const toSave: ClientProfile = {
    ...profile,
    slug: normalizedSlug,
  };

  const payload = JSON.stringify(toSave);

  // Salva o perfil e adiciona aos slugs gerenciados
  await redisCommand(['SET', `profile:${normalizedSlug}`, payload]);
  await redisCommand(['SADD', 'profiles:slugs', normalizedSlug]);
}

export async function deleteClientProfile(slug: string): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase().trim();

  await redisCommand(['DEL', `profile:${normalizedSlug}`]);
  await redisCommand(['SREM', 'profiles:slugs', normalizedSlug]);

  return true;
}
