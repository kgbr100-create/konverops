import type { ClientProfile } from '@/data/profiles';
import { CLIENT_PROFILES } from '@/data/profiles';
import fs from 'fs';
import path from 'path';

// Cache em memória para instâncias serverless aquecidas
const g = globalThis as unknown as { _konverops_profiles_cache?: Record<string, ClientProfile> };
if (!g._konverops_profiles_cache) {
  g._konverops_profiles_cache = { ...CLIENT_PROFILES };
}

const UPSTASH_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;

// Só ativa Redis/KV se houver variáveis reais e não for o host placeholder inativo
const isRedisConfigured = Boolean(
  UPSTASH_URL &&
  UPSTASH_TOKEN &&
  !UPSTASH_URL.includes('unique-ladybird-238762')
);

const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN ||
  '';

async function syncToGitHub(
  data: Record<string, ClientProfile>,
  commitMessage: string
): Promise<boolean> {
  if (!GITHUB_TOKEN) return false;

  const repo = 'kgbr100-create/konverops';
  const filePath = 'src/data/clients.json';
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  try {
    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Konverops-BioStudio',
      },
      cache: 'no-store',
    });

    if (!getRes.ok) return false;
    const fileData = await getRes.json();
    const sha = fileData.sha;

    const contentEncoded = Buffer.from(
      JSON.stringify(data, null, 2),
      'utf-8'
    ).toString('base64');
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Konverops-BioStudio',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: contentEncoded,
        sha,
        branch: 'main',
      }),
    });

    return putRes.ok;
  } catch (err) {
    console.warn('GitHub auto-sync error:', err);
    return false;
  }
}

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'clients.json');

function readLocalClientsJson(): Record<string, ClientProfile> {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    // Filesystem pode ser somente leitura em certos ambientes serverless
  }
  return {};
}

function writeLocalClientsJson(data: Record<string, ClientProfile>): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignora silenciosamente em ambientes somente leitura
  }
}

async function redisCommand(command: (string | number)[]): Promise<any> {
  if (!isRedisConfigured) return null;

  try {
    const res = await fetch(UPSTASH_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
      signal: AbortSignal.timeout(1200),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result;
  } catch (error) {
    console.warn('Upstash Redis Command Warning (usando fallback local):', error);
    return null;
  }
}

export async function getClientsRecord(): Promise<Record<string, ClientProfile>> {
  // 1. Base sólida com perfis mestres estáticos
  const result: Record<string, ClientProfile> = { ...CLIENT_PROFILES };

  // 2. Mescla com arquivo clients.json em disco
  const fileClients = readLocalClientsJson();
  for (const [slug, prof] of Object.entries(fileClients)) {
    result[slug.toLowerCase()] = {
      ...(result[slug.toLowerCase()] || {}),
      ...prof,
    };
  }

  // 3. Mescla com cache em memória
  if (g._konverops_profiles_cache) {
    for (const [slug, prof] of Object.entries(g._konverops_profiles_cache)) {
      result[slug.toLowerCase()] = {
        ...(result[slug.toLowerCase()] || {}),
        ...prof,
      };
    }
  }

  // 4. Se Redis configurado e acessível, sincroniza
  if (isRedisConfigured) {
    try {
      const slugs = await redisCommand(['SMEMBERS', 'profiles:slugs']);
      if (Array.isArray(slugs) && slugs.length > 0) {
        for (const slug of slugs) {
          const raw = await redisCommand(['GET', `profile:${slug}`]);
          if (raw) {
            try {
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
              result[slug.toLowerCase()] = parsed;
              if (g._konverops_profiles_cache) {
                g._konverops_profiles_cache[slug.toLowerCase()] = parsed;
              }
            } catch (e) {
              console.error(`Falha ao deserializar perfil ${slug}:`, e);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar perfis no Redis, usando fallback local:', error);
    }
  }

  return result;
}

export async function getClientBySlug(slug: string): Promise<ClientProfile | undefined> {
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. Tenta cache em memória instantâneo
  if (g._konverops_profiles_cache && g._konverops_profiles_cache[normalizedSlug]) {
    return g._konverops_profiles_cache[normalizedSlug];
  }

  // 2. Tenta arquivo local em disco
  const fileClients = readLocalClientsJson();
  if (fileClients[normalizedSlug]) {
    if (g._konverops_profiles_cache) {
      g._konverops_profiles_cache[normalizedSlug] = fileClients[normalizedSlug];
    }
    return fileClients[normalizedSlug];
  }

  // 3. Tenta Redis se configurado
  if (isRedisConfigured) {
    try {
      const raw = await redisCommand(['GET', `profile:${normalizedSlug}`]);
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && Array.isArray(parsed.banners) && parsed.banners.length > 0) {
          if (g._konverops_profiles_cache) {
            g._konverops_profiles_cache[normalizedSlug] = parsed;
          }
          return parsed;
        }
        if (CLIENT_PROFILES[normalizedSlug]) {
          const merged = {
            ...CLIENT_PROFILES[normalizedSlug],
            ...parsed,
            banners:
              parsed?.banners && parsed.banners.length > 0
                ? parsed.banners
                : CLIENT_PROFILES[normalizedSlug].banners,
          };
          if (g._konverops_profiles_cache) {
            g._konverops_profiles_cache[normalizedSlug] = merged;
          }
          return merged;
        }
        return parsed;
      }
    } catch (error) {
      console.warn(`Erro ao buscar profile:${normalizedSlug} no Redis:`, error);
    }
  }

  // 4. Fallback final para perfil mestre estático em código
  return CLIENT_PROFILES[normalizedSlug];
}

export async function saveClientProfile(profile: ClientProfile): Promise<void> {
  const normalizedSlug = profile.slug.toLowerCase().trim();

  const toSave: ClientProfile = {
    ...profile,
    slug: normalizedSlug,
  };

  // 1. Atualiza cache em memória imediato
  if (!g._konverops_profiles_cache) {
    g._konverops_profiles_cache = { ...CLIENT_PROFILES };
  }
  g._konverops_profiles_cache[normalizedSlug] = toSave;

  // 2. Persiste em disco localmente
  const fileClients = readLocalClientsJson();
  fileClients[normalizedSlug] = toSave;
  writeLocalClientsJson(fileClients);

  // 3. Auto-sincroniza com GitHub para persistência permanente em nuvem
  await syncToGitHub(
    fileClients,
    `chore(bio-studio): auto-save profile ${normalizedSlug} from admin`
  );

  // 4. Persiste no Redis se configurado
  if (isRedisConfigured) {
    const payload = JSON.stringify(toSave);
    await redisCommand(['SET', `profile:${normalizedSlug}`, payload]);
    await redisCommand(['SADD', 'profiles:slugs', normalizedSlug]);
  }
}

export async function deleteClientProfile(slug: string): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. Remove do cache em memória
  if (g._konverops_profiles_cache) {
    delete g._konverops_profiles_cache[normalizedSlug];
  }

  // 2. Remove do disco local
  const fileClients = readLocalClientsJson();
  if (fileClients[normalizedSlug]) {
    delete fileClients[normalizedSlug];
    writeLocalClientsJson(fileClients);
  }

  // 3. Auto-sincroniza com GitHub para persistência permanente em nuvem
  await syncToGitHub(
    fileClients,
    `chore(bio-studio): auto-delete profile ${normalizedSlug} from admin`
  );

  // 4. Remove do Redis se configurado
  if (isRedisConfigured) {
    await redisCommand(['DEL', `profile:${normalizedSlug}`]);
    await redisCommand(['SREM', 'profiles:slugs', normalizedSlug]);
  }

  return true;
}
