import type { NextRequest } from 'next/server';
import type { LineRequestBody } from 'bottender/dist/line/LineTypes';

import { lineBot } from '@/bot/lineBot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestHandler = lineBot.createRequestHandler();

async function handleLineWebhook(req: NextRequest): Promise<Response> {
  const rawBody = await req.text();

  if (!rawBody) {
    return new Response('Empty body', { status: 400 });
  }

  let body: LineRequestBody;

  try {
    body = JSON.parse(rawBody) as LineRequestBody;
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  try {
    console.log('收到 LINE webhook 事件');
    console.log(body.events[0]);
    await requestHandler(body, {
      method: req.method ?? 'POST',
      path: req.nextUrl.pathname,
      query: Object.fromEntries(req.nextUrl.searchParams.entries()),
      headers,
      rawBody,
      body,
      params: {},
      url: req.url,
    });
    console.log('處理 LINE webhook 事件完成');
  } catch (error) {
    console.error('處理 LINE webhook 事件時發生錯誤', error);
    return new Response('Internal Server Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return handleLineWebhook(req);
}

export async function GET(): Promise<Response> {
  return new Response('LINE bot webhook endpoint', { status: 200 });
}

