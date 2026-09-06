import { requireChatUser } from '@/lib/chat/routeServerUtils';
import { readPilotConfig } from '@/lib/rag-v2/pilot/config';
import PilotClient from './pilot-client';
import { cookies } from 'next/headers';
import { serverT } from '@/lib/i18n/serverMessages';

export const dynamic = 'force-dynamic';
export default async function PilotPage() {
  const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'et';
  const t = key => serverT(locale, `m4Pilot.${key}`);
  const auth = await requireChatUser();
  if (!auth.ok) return <main style={{ padding: 40 }}><h1>{t('name')}</h1><p>{t('login')}</p><a href="/start">{t('signIn')}</a></main>;
  try { await readPilotConfig(auth.userId, { purpose: 'read' }); }
  catch { return <main style={{ padding: 40 }}><h1>{t('closed')}</h1><p>{t('denied')}</p></main>; }
  return <PilotClient />;
}
