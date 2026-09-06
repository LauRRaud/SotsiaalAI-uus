import { pilotGet } from '@/lib/chat/m4PilotServer';
import { serverT } from '@/lib/i18n/serverMessages';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function ChatSourcePage({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ['convId', 'turnId', 'ref']) if (typeof params[key] === 'string') query.set(key, params[key]);
  if (query.size !== 3) notFound();
  const response = await pilotGet(new Request(`https://sotsiaal.ai/api/chat/pilot?${query}`));
  const source = await response.json();
  const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'et';
  const t = (key, values) => serverT(locale, `m4Pilot.${key}`, values);
  if (!response.ok) return <section><h1>{t('source')}</h1><p>{t('denied')}</p></section>;
  return <section style={{ padding: 24, maxWidth: 900, margin: 'auto' }}><h1>{source.title}</h1><p>{t('pages', { pages: source.pages.join(', ') })} · {source.ref}</p>
    <a href={`/vestlus?conversation=${encodeURIComponent(params.convId)}`}>{t('closeSource')}</a>
    <details><summary>{t('version')}</summary><p style={{ overflowWrap: 'anywhere' }}>{source.version}</p></details>
    <p style={{ whiteSpace: 'pre-wrap' }}>{source.text}</p></section>;
}
