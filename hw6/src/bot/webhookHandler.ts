import { handleLineEvent } from './eventHandler';
import { logger } from '@/utils/logger';

/**
 * Handle LINE webhook request body
 * Processes all events in the webhook payload
 */
export async function handleLineWebhook(body: any): Promise<void> {
  if (!body.events || !Array.isArray(body.events)) {
    logger.warn('Invalid webhook body: no events array', { body });
    return;
  }

  // Process each event
  for (const event of body.events) {
    try {
      await handleLineEvent(event);
    } catch (error) {
      logger.error('處理 LINE 事件失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        eventType: event.type,
        eventId: event.webhookEventId,
      });
      // Continue processing next event, don't break on single event failure
    }
  }
}


