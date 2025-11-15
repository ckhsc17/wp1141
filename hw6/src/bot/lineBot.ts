import { LineBot } from 'bottender';

import { handleLineEvent } from '@/bot/eventHandler';

const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

if (!accessToken || !channelSecret) {
  throw new Error(
    'LINE_CHANNEL_ACCESS_TOKEN 與 LINE_CHANNEL_SECRET 必須在環境變數中設定，請參考 env.example。',
  );
}

export const lineBot = new LineBot({
  accessToken,
  channelSecret,
});

lineBot.onEvent(handleLineEvent);

