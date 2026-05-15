import * as p from '@clack/prompts';

export function startSpinner(msg: string): { stop: (finalMsg?: string) => void } {
  const s = p.spinner();
  s.start(msg);
  return {
    stop: (finalMsg?: string) => s.stop(finalMsg ?? msg),
  };
}
