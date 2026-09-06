import { pilotGet, pilotManage } from '@/lib/chat/m4PilotServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = pilotGet;
export const POST = pilotManage;
