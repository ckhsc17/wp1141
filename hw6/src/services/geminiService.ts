import { GoogleGenAI } from '@google/genai';

import { ExternalServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { PromptManager, type PromptName } from './promptManager';

type GenerateOptions<TPayload extends Record<string, unknown>> = {
  template: PromptName;
  payload: TPayload;
};

export type GroundingMetadata = {
  webSearchQueries?: string[];
  groundingChunks?: Array<{ uri: string; title: string }>;
  groundingSupports?: Array<{ segment: { text: string }; groundingChunkIndices: number[] }>;
};

export type GenerateWithGroundingResult = {
  text: string;
  groundingMetadata?: GroundingMetadata;
};

export class GeminiService {
  private readonly client: any;

  constructor(apiKey?: string) {
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
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
    // 組合 system 和 user prompt
    //const fullPrompt = `${prompt.system}\n\n${prompt.user(payload)}`;
    const fullPrompt = `${prompt.system}\n\n${prompt.user(payload)}`;

    try {
      logger.debug('Gemini generate: sending request', {
        template,
        // 避免 log 過長，只取前 200 字元
        payloadPreview: JSON.stringify(payload).slice(0, 200),
      });

      const response = await this.client.models.generateContent({
        model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      // Remove all asterisks (*) from response as Flex Message cannot parse markdown syntax
      const cleanedText = text.replace(/\*/g, '');
      logger.debug('Gemini generate: received response', {
        template,
        responsePreview: cleanedText.slice(0, 200),
      });
      return cleanedText;
    } catch (error) {
      logger.error('Gemini generation failed', {
        error,
        template,
      });
      // 讓上層走 fallback，不要整個對話失敗
      return '';
    }
  }

  async generateWithGrounding<TPayload extends Record<string, unknown>>({
    template,
    payload,
  }: GenerateOptions<TPayload>): Promise<GenerateWithGroundingResult> {
    if (!this.client) {
      logger.warn('Gemini API key missing, returning empty result.', { template });
      return { text: '' };
    }

    const prompt = PromptManager.getTemplate(template);
    // 組合 system 和 user prompt
    const fullPrompt = `${prompt.system}\n\n${prompt.user(payload)}`;

    // 設定 Google Search grounding tool
    const groundingTool = {
      googleSearch: {},
    };

    const config = {
      tools: [groundingTool],
      maxOutputTokens: 8192,
      temperature: 0.7,
    };

    try {
      logger.debug('Gemini generateWithGrounding: sending request', {
        template,
        // 避免 log 過長，只取前 200 字元
        payloadPreview: JSON.stringify(payload).slice(0, 200),
      });

      const response = await this.client.models.generateContent({
        model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
        contents: fullPrompt,
        config,
      });

      const text = response.text || '';
      // Remove all asterisks (*) from response as Flex Message cannot parse markdown syntax
      const cleanedText = text.replace(/\*/g, '');

      // 提取 groundingMetadata
      // 根據官方文件，groundingMetadata 在 response.candidates[0].groundingMetadata
      let groundingMetadata: GroundingMetadata | undefined;

      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0] as any;
        if (candidate.groundingMetadata) {
          const metadata = candidate.groundingMetadata;
          groundingMetadata = {
            webSearchQueries: metadata.webSearchQueries,
            groundingChunks: metadata.groundingChunks?.map((chunk: any) => ({
              uri: chunk.web?.uri || '',
              title: chunk.web?.title || '',
            })),
            groundingSupports: metadata.groundingSupports,
          };

          logger.debug('Gemini generateWithGrounding: grounding metadata extracted', {
            template,
            webSearchQueriesCount: groundingMetadata.webSearchQueries?.length || 0,
            groundingChunksCount: groundingMetadata.groundingChunks?.length || 0,
          });
        }
      }

      logger.debug('Gemini generateWithGrounding: received response', {
        template,
        responsePreview: cleanedText.slice(0, 200),
        hasGroundingMetadata: !!groundingMetadata,
      });

      return {
        text: cleanedText,
        groundingMetadata,
      };
    } catch (error) {
      logger.error('Gemini generation with grounding failed', {
        error,
        template,
      });
      // 讓上層走 fallback，不要整個對話失敗
      return { text: '' };
    }
  }
}


