import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';

import { handleLineWebhook } from '@/bot/webhookHandler';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Verify LINE webhook signature
 * Reference: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#verifying-signatures
 */
function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  try {
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');
    return hash === signature;
  } catch (error) {
    logger.warn('Failed to verify signature', { error });
    return false;
  }
}

async function handleLineWebhookRequest(req: NextRequest): Promise<Response> {
  const rawBody = await req.text();

  if (!rawBody) {
    return new Response('Empty body', { status: 400 });
  }

  // Verify signature if channel secret is set
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const signature = req.headers.get('x-line-signature');
  
  if (channelSecret && signature) {
    const isValid = verifySignature(rawBody, signature, channelSecret);
    if (!isValid) {
      logger.warn('Invalid LINE webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  try {
    logger.debug('收到 LINE webhook 事件', {
      eventCount: body.events?.length || 0,
      destination: body.destination,
    });
    
    await handleLineWebhook(body);
    
    logger.debug('處理 LINE webhook 事件完成');
  } catch (error) {
    logger.error('處理 LINE webhook 事件時發生錯誤', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response('Internal Server Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return handleLineWebhookRequest(req);
}

export async function GET(): Promise<Response> {
  return new Response('LINE bot webhook endpoint', { status: 200 });
}

