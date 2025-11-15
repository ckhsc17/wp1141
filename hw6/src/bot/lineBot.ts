import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { setDefaultResultOrder } from 'node:dns';

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

try {
  if (typeof setDefaultResultOrder === 'function') {
    setDefaultResultOrder('ipv4first');
  }
} catch (error) {
  console.warn('[lineBot] Failed to set DNS result order to ipv4first:', error);
}

const keepAliveHttpAgent = new HttpAgent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  timeout: 45_000,
});

const keepAliveHttpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  timeout: 45_000,
});

const lineClient = lineBot.connector.client;

if (lineClient) {
  lineClient.axios.defaults.httpAgent = keepAliveHttpAgent;
  lineClient.axios.defaults.httpsAgent = keepAliveHttpsAgent;
  lineClient.dataAxios.defaults.httpAgent = keepAliveHttpAgent;
  lineClient.dataAxios.defaults.httpsAgent = keepAliveHttpsAgent;
}

lineBot.onEvent(handleLineEvent);

