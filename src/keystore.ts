/**
 * Stockage sécurisé des clés API via le trousseau OS (keytar).
 * Fallback sur variable d'environnement si keytar non disponible.
 * Jamais de clés en clair dans config.json.
 */

const SERVICE = 'sandykit';

const ENV_KEYS: Record<string, string> = {
  claude:  'ANTHROPIC_API_KEY',
  openai:  'OPENAI_API_KEY',
  custom:  'SANDYKIT_CUSTOM_API_KEY',
};

async function getKeytar(): Promise<typeof import('keytar') | null> {
  try {
    return await import('keytar');
  } catch {
    return null;
  }
}

export async function storeApiKey(provider: string, key: string): Promise<void> {
  const keytar = await getKeytar();
  if (keytar) {
    await keytar.setPassword(SERVICE, provider, key);
    return;
  }
  // Fallback : on ne peut pas stocker sans keytar, on signale
  process.stderr.write(`  ⚠ keytar non disponible — la clé ne sera pas persistée entre sessions\n`);
}

export async function getApiKey(provider: string): Promise<string | null> {
  // 1. Variable d'environnement (prioritaire)
  const envKey = ENV_KEYS[provider];
  if (envKey && process.env[envKey]) return process.env[envKey]!;

  // 2. Trousseau OS
  const keytar = await getKeytar();
  if (keytar) {
    return await keytar.findPassword(`${SERVICE}-${provider}`);
  }

  return null;
}

export async function deleteApiKey(provider: string): Promise<void> {
  const keytar = await getKeytar();
  if (keytar) {
    await keytar.deletePassword(SERVICE, provider);
  }
}

export async function hasApiKey(provider: string): Promise<boolean> {
  return (await getApiKey(provider)) !== null;
}
