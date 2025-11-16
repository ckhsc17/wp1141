import { GoogleGenerativeAI } from '@google/generative-ai';

import { ExternalServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { PromptManager, type PromptName } from './promptManager';

type GenerateOptions<TPayload extends Record<string, unknown>> = {
  template: PromptName;
  payload: TPayload;
};

export class GeminiService {
  private readonly client: unknown;

  constructor(apiKey?: string) {
    this.client = apiKey ? new (GoogleGenerativeAI as any)(apiKey) : null;
  }

  async generate<TPayload extends Record<string, unknown>>({
    template,
    payload,
  }: GenerateOptions<TPayload>): Promise<string> {
    if (!this.client) {
      logger.warn('Gemini API key missing, returning empty result.', { template });
      return '';
    }

    const prompt = PromptManager.getTemplate(template);
    const model = (this.client as any).getGenerativeModel({
      // 使用 v1 支援的最新 flash 模型
      model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    });

    try {
      logger.debug('Gemini generate: sending request', {
        template,
        // 避免 log 過長，只取前 200 字元
        payloadPreview: JSON.stringify(payload).slice(0, 200),
      });

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt.system }] },
          { role: 'user', parts: [{ text: prompt.user(payload) }] },
        ],
      });

      const text = result.response.text();
      logger.debug('Gemini generate: received response', {
        template,
        responsePreview: text.slice(0, 200),
      });
      return text;
    } catch (error) {
      logger.error('Gemini generation failed', {
        error,
        template,
      });
      // 讓上層走 fallback，不要整個對話失敗
      return '';
    }
  }
}


