import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { setDefaultResultOrder } from 'node:dns';

import { LineClient } from 'messaging-api-line';

const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

if (!accessToken || !channelSecret) {
  throw new Error(
    'LINE_CHANNEL_ACCESS_TOKEN 與 LINE_CHANNEL_SECRET 必須在環境變數中設定，請參考 env.example。',
  );
}

const origin = process.env.LINE_API_ORIGIN ?? 'https://api.line.me';
const dataOrigin = process.env.LINE_DATA_API_ORIGIN ?? 'https://api-data.line.me';

// Create LineClient instance for direct LINE Messaging API calls
export const lineClient = new LineClient({
  accessToken,
  channelSecret,
  origin,
  dataOrigin,
});

// Force IPv4 resolution to mitigate connection issues
try {
  if (typeof setDefaultResultOrder === 'function') {
    setDefaultResultOrder('ipv4first');
  }
} catch (error) {
  console.warn('[lineBot] Failed to set DNS result order to ipv4first:', error);
}

// Configure keep-alive agents for better connection reuse
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

lineClient.axios.defaults.httpAgent = keepAliveHttpAgent;
lineClient.axios.defaults.httpsAgent = keepAliveHttpsAgent;
lineClient.dataAxios.defaults.httpAgent = keepAliveHttpAgent;
lineClient.dataAxios.defaults.httpsAgent = keepAliveHttpsAgent;

