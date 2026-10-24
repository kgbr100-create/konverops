import fs from 'fs/promises';
import path from 'path';
import type { ClientProfile } from '@/data/profiles';
import { CLIENT_PROFILES } from '@/data/profiles';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'clients.json');

export async function getClientsRecord(): Promise<Record<string, ClientProfile>> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Could not read clients.json, falling back to static profiles:', error);
    return CLIENT_PROFILES;
  }
}

export async function getClientBySlug(slug: string): Promise<ClientProfile | undefined> {
  const all = await getClientsRecord();
  return all[slug.toLowerCase()];
}

export async function saveClientProfile(profile: ClientProfile): Promise<void> {
  const all = await getClientsRecord();
  const normalizedSlug = profile.slug.toLowerCase().trim();
  
  all[normalizedSlug] = {
    ...profile,
    slug: normalizedSlug,
  };

  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(all, null, 2), 'utf-8');
}

export async function deleteClientProfile(slug: string): Promise<boolean> {
  const all = await getClientsRecord();
  const normalizedSlug = slug.toLowerCase().trim();

  if (!all[normalizedSlug]) {
    return false;
  }

  delete all[normalizedSlug];
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(all, null, 2), 'utf-8');
  return true;
}
