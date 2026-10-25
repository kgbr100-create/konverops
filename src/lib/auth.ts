const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL || 'https://unique-ladybird-238762.upstash.io';
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  'gQAAAAAAA6SqAQIgcDJhNWRkZTM5N2E1ODQ0NTIxYmM4YjA0ZjgzNDU3NTc2YQ';

const ADMIN_SECRET =
  process.env.ADMIN_SECRET || 'konverops-admin-auth-secret-key-2026-kelvin';

// SHA-256 universal (compatível com Node e Edge Runtime)
export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Executa comando no Redis
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
    console.error('Redis Auth Command Error:', error);
    return null;
  }
}

// Verifica se as credenciais são válidas
export async function verifyAdminCredentials(
  user: string,
  pass: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUser = user.trim().toLowerCase();
  const cleanPass = pass.trim();

  // Usuários aceitos para Kelvin
  const validUsers = ['kelvin', 'kelvin@konverops.tech', 'admin'];
  if (!validUsers.includes(cleanUser)) {
    return { success: false, error: 'Usuário ou e-mail não autorizado.' };
  }

  // Verifica se há senha customizada salva no Redis
  const storedHash = await redisCommand(['GET', 'admin:auth:password_hash']);

  if (storedHash) {
    const inputHash = await sha256(cleanPass + ':' + ADMIN_SECRET);
    if (inputHash === storedHash) {
      return { success: true };
    }
  } else {
    // Senha padrão inicial (pode ser sobrescrita por ADMIN_PASSWORD no .env ou no painel)
    const defaultPassword = process.env.ADMIN_PASSWORD || 'konverops2026!';
    if (cleanPass === defaultPassword) {
      return { success: true };
    }
  }

  return { success: false, error: 'Senha incorreta. Tente novamente.' };
}

// Altera a senha do administrador e salva no Redis
export async function updateAdminPassword(
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  const verify = await verifyAdminCredentials('kelvin', currentPass);
  if (!verify.success) {
    return { success: false, error: 'A senha atual informada está incorreta.' };
  }

  if (!newPass || newPass.trim().length < 6) {
    return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  const newHash = await sha256(newPass.trim() + ':' + ADMIN_SECRET);
  await redisCommand(['SET', 'admin:auth:password_hash', newHash]);

  return { success: true };
}

// Cria token de sessão criptografado para o cookie
export async function createSessionToken(username = 'kelvin'): Promise<string> {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 dias de validade
  const rawSignaturePayload = `${username}:${expiresAt}:${ADMIN_SECRET}`;
  const signature = await sha256(rawSignaturePayload);

  return `${username}:${expiresAt}:${signature}`;
}

// Valida a integridade do token de sessão
export async function verifySessionToken(
  token: string
): Promise<{ valid: boolean; username?: string }> {
  if (!token) return { valid: false };

  const parts = token.split(':');
  if (parts.length !== 3) return { valid: false };

  const [username, expiresStr, signature] = parts;
  const expiresAt = Number(expiresStr);

  // Expiração
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { valid: false };
  }

  // Validação da assinatura criptográfica
  const rawSignaturePayload = `${username}:${expiresAt}:${ADMIN_SECRET}`;
  const expectedSignature = await sha256(rawSignaturePayload);

  if (signature !== expectedSignature) {
    return { valid: false };
  }

  return { valid: true, username };
}
