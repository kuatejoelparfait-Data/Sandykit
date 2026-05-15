import * as p from '@clack/prompts';

export async function askText(message: string, placeholder?: string): Promise<string> {
  const result = await p.text({
    message,
    placeholder: placeholder ?? '',
    validate: (v) => (v.trim().length === 0 ? 'Réponse requise' : undefined),
  });
  if (p.isCancel(result)) {
    p.cancel('Session annulée');
    process.exit(0);
  }
  return result as string;
}

export async function askSelect<T extends string>(
  message: string,
  options: Array<{ value: T; label: string; hint?: string }>
): Promise<T> {
  const result = await p.select({ message, options });
  if (p.isCancel(result)) {
    p.cancel('Session annulée');
    process.exit(0);
  }
  return result as T;
}

export async function askConfirm(message: string): Promise<boolean> {
  const result = await p.confirm({ message });
  if (p.isCancel(result)) {
    p.cancel('Session annulée');
    process.exit(0);
  }
  return result as boolean;
}
