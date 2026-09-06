const prefix = 'm4-pilot-intent/';
export async function rememberPilotIntent(storage, { convId, text, language, key }) {
  const bytes = new TextEncoder().encode(JSON.stringify({ convId, text, language, contextMode: 'new' }));
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  let previous; try { previous = JSON.parse(storage.getItem(prefix + convId)); } catch {}
  const chosen = previous?.hash === hash && previous.expiresAt > Date.now() ? previous.key : key;
  storage.setItem(prefix + convId, JSON.stringify({ hash, key: chosen, expiresAt: Date.now() + 24 * 3600000 }));
  return chosen;
}
export function forgetPilotIntent(storage, convId, key) {
  let previous; try { previous = JSON.parse(storage.getItem(prefix + convId)); } catch {}
  if (previous?.key === key) storage.removeItem(prefix + convId);
}
