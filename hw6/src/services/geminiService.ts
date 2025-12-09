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

export type UrlContextMetadata = {
  urlMetadata?: Array<{
    retrievedUrl: string;
    urlRetrievalStatus: string;
  }>;
};

export type GenerateWithGroundingResult = {
  text: string;
  groundingMetadata?: GroundingMetadata;
  urlContextMetadata?: UrlContextMetadata;
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
            webSearchQueries: groundingMetadata.webSearchQueries || [], // 具體的搜尋查詢
            groundingChunksCount: groundingMetadata.groundingChunks?.length || 0,
            groundingChunks: groundingMetadata.groundingChunks || [], // 具體的來源連結
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

  /**
   * Generate content with both URL Context and Google Search Grounding
   * URL Context: Directly reads the content from the provided URL
   * Google Search: Finds related information and similar links
   */
  async generateWithUrlContextAndGrounding<TPayload extends Record<string, unknown>>({
    template,
    payload,
    url,
  }: GenerateOptions<TPayload> & { url: string }): Promise<GenerateWithGroundingResult> {
    if (!this.client) {
      logger.warn('Gemini API key missing, returning empty result.', { template });
      return { text: '' };
    }

    const prompt = PromptManager.getTemplate(template);
    // 組合 system 和 user prompt，並在 prompt 中包含 URL
    // 根據官方文件，URL 應該直接在 contents 中，模型會自動使用 URL context tool 來讀取 URL 內容
    const userPrompt = prompt.user(payload);
    // 將 URL 直接放在 contents 中，讓模型自動識別並使用 urlContext tool
    const contents = `${prompt.system}\n\n${userPrompt}\n\n請分析以下連結：${url}`;

    // 同時使用 URL Context 和 Google Search
    const tools = [
      { urlContext: {} },
      { googleSearch: {} },
    ];

    const config = {
      tools,
      maxOutputTokens: 8192,
      temperature: 0.7,
    };

    try {
      logger.debug('Gemini generateWithUrlContextAndGrounding: sending request', {
        template,
        url,
        payloadPreview: JSON.stringify(payload).slice(0, 200),
        tools: ['urlContext', 'googleSearch'],
      });

      const response = await this.client.models.generateContent({
        model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
        contents,
        config,
      });

      const text = response.text || '';
      // Remove all asterisks (*) from response as Flex Message cannot parse markdown syntax
      const cleanedText = text.replace(/\*/g, '');

      // 提取 groundingMetadata 和 urlContextMetadata
      let groundingMetadata: GroundingMetadata | undefined;
      let urlContextMetadata: UrlContextMetadata | undefined;

      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0] as any;
        
        // 提取 Google Search grounding metadata
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

          logger.debug('Gemini generateWithUrlContextAndGrounding: grounding metadata extracted', {
            template,
            url,
            webSearchQueriesCount: groundingMetadata.webSearchQueries?.length || 0,
            webSearchQueries: groundingMetadata.webSearchQueries || [], // 具體的搜尋查詢
            groundingChunksCount: groundingMetadata.groundingChunks?.length || 0,
            groundingChunks: groundingMetadata.groundingChunks || [], // 具體的來源連結
          });
        }

        // 提取 URL Context metadata
        // 根據官方文件，urlContextMetadata 在 response.candidates[0].urlContextMetadata
        if (candidate.urlContextMetadata) {
          urlContextMetadata = {
            urlMetadata: candidate.urlContextMetadata.urlMetadata?.map((meta: any) => ({
              retrievedUrl: meta.retrievedUrl || '',
              urlRetrievalStatus: meta.urlRetrievalStatus || '',
            })),
          };

          logger.debug('Gemini generateWithUrlContextAndGrounding: URL context metadata extracted', {
            template,
            url,
            urlMetadataCount: urlContextMetadata.urlMetadata?.length || 0,
            urlMetadata: urlContextMetadata.urlMetadata, // 完整 log 出來，就像官方示例
          });
        }
      }

      logger.debug('Gemini generateWithUrlContextAndGrounding: received response', {
        template,
        url,
        responsePreview: cleanedText.slice(0, 200),
        hasGroundingMetadata: !!groundingMetadata,
        hasUrlContextMetadata: !!urlContextMetadata,
        urlRetrievalStatus: urlContextMetadata?.urlMetadata?.[0]?.urlRetrievalStatus,
        // 完整 log urlContextMetadata，就像官方示例的 console.log(response.candidates[0].urlContextMetadata)
        urlContextMetadata: urlContextMetadata ? JSON.stringify(urlContextMetadata, null, 2) : undefined,
      });

      return {
        text: cleanedText,
        groundingMetadata,
        urlContextMetadata,
      };
    } catch (error) {
      logger.error('Gemini generation with URL context and grounding failed', {
        error,
        template,
        url,
      });
      // 讓上層走 fallback，不要整個對話失敗
      return { text: '' };
    }
  }
}


