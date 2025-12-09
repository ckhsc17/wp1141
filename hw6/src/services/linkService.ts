import type { SavedItemRepository } from '@/repositories';
import { LinkAnalysisSchema, SavedItemSchema, type LinkAnalysis, type SavedItem } from '@/domain/schemas';
import { GeminiService } from './geminiService';
import { extractJsonString, nullToUndefined } from '@/utils/jsonParser';
import { logger } from '@/utils/logger';

export class LinkService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async analyzeAndSave(userId: string, url: string, content?: string): Promise<{ item: SavedItem; analysis: LinkAnalysis }> {
    // RAG: Search for similar links/content in user's history to provide context
    const urlHostname = new URL(url).hostname;
    const urlKeywords = url
      .split(/[\/\?\#]/)
      .filter((part) => part.length > 2 && !part.includes('http'))
      .slice(0, 3);
    
    // Search by URL hostname and keywords from user's saved items
    const similarItems = await Promise.all([
      this.savedItemRepo.searchByText(userId, urlHostname, 3),
      ...urlKeywords.map((keyword) => this.savedItemRepo.searchByText(userId, keyword, 2)),
    ]);
    
    const uniqueSimilarItems = Array.from(
      new Map(similarItems.flat().map((item) => [item.id, item])).values()
    ).slice(0, 5);

    // Format RAG context from similar items
    const ragContext = ""
    // const ragContext = uniqueSimilarItems.length > 0
    //   ? uniqueSimilarItems
    //       .map((item) => {
    //         const itemInfo = [
    //           item.title || item.content.slice(0, 50),
    //           item.url ? `(${item.url})` : '',
    //           item.tags.length > 0 ? `[${item.tags.join(', ')}]` : '',
    //           item.metadata?.type ? `類型: ${item.metadata.type}` : '',
    //         ].filter(Boolean).join(' ');
    //         return `- ${itemInfo}`;
    //       })
    //       .join('\n')
    //   : undefined;

    // logger.debug('RAG context for link analysis', {
    //   userId,
    //   url,
    //   similarItemsCount: uniqueSimilarItems.length,
    // });

    // Analyze link using LLM with Google Search grounding and RAG context
    let result = await this.gemini.generateWithGrounding({
      template: 'analyzeLink',
      payload: { url, content, ragContext },
    });

    // Fallback to regular generate if grounding fails (empty text)
    if (!result.text || result.text.trim().length === 0) {
      logger.warn('Grounding returned empty text, falling back to regular generate', {
        userId,
        url,
      });
      const fallbackText = await this.gemini.generate({
        template: 'analyzeLink',
        payload: { url, content, ragContext },
      });
      result = { text: fallbackText };
    }

    let analysis: LinkAnalysis;

    try {
      const jsonStr = extractJsonString(result.text);
      const parsed = JSON.parse(jsonStr) as LinkAnalysis;
      // Convert null to undefined for optional fields
      const cleaned = nullToUndefined(parsed);
      analysis = LinkAnalysisSchema.parse(cleaned);
    } catch (error) {
      logger.warn('Failed to parse link analysis, using fallback', {
        userId,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      analysis = {
        type: '其他',
        summary: content?.slice(0, 300) || url,
        tags: [],
      };
    }

    // Prepare tags (ensure lowercase)
    const tags = ['link', ...(analysis.tags || []).map((tag) => tag.toLowerCase())];

    // Prepare metadata with grounding information
    const metadata: Record<string, unknown> = {
      type: analysis.type,
      host: new URL(url).hostname,
      analysis: analysis,
    };

    // Store grounding metadata if available
    if (result.groundingMetadata) {
      metadata.grounding = {
        webSearchQueries: result.groundingMetadata.webSearchQueries || [],
        sources: result.groundingMetadata.groundingChunks?.map((chunk) => ({
          uri: chunk.uri,
          title: chunk.title,
        })) || [],
      };

      logger.debug('Link analysis with grounding metadata', {
        userId,
        url,
        searchQueriesCount: result.groundingMetadata.webSearchQueries?.length || 0,
        sourcesCount: result.groundingMetadata.groundingChunks?.length || 0,
      });
    }

    // Save as SavedItem
    const item = await this.savedItemRepo.create({
      userId,
      title: analysis.summary.slice(0, 100),
      content: content || analysis.summary,
      url,
      tags,
      metadata,
      location: analysis.location || undefined,
    });

    logger.info('Link analyzed and saved', { userId, itemId: item.id, type: analysis.type, tags });

    return {
      item: SavedItemSchema.parse(item),
      analysis,
    };
  }
}

