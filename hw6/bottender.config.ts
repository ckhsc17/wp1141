import type { BottenderConfig } from 'bottender';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`環境變數 ${name} 未設定`);
  }

  return value;
}

const config = {
  session: {
    driver: 'memory',
    stores: {
      memory: {},
    },
  },
  channels: {
    line: {
      enabled: true,
      accessToken: requireEnv('LINE_CHANNEL_ACCESS_TOKEN'),
      channelSecret: requireEnv('LINE_CHANNEL_SECRET'),
    },
  },
} satisfies BottenderConfig;

export default config;

