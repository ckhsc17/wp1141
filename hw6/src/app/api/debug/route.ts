import { NextResponse } from 'next/server';

import { services } from '@/container';

const TOKEN = process.env.DEBUG_API_TOKEN;

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (TOKEN && token !== TOKEN) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await services.reminders.listPending('debug-user');
    return NextResponse.json({ ok: true, message: 'Services reachable' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}


