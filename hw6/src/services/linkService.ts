import type { SavedItemRepository } from '@/repositories';
import { LinkAnalysisSchema, SavedItemSchema, type LinkAnalysis, type SavedItem } from '@/domain/schemas';
import { GeminiService } from './geminiService';
import { prisma } from '@/repositories/prismaClient';
import { logger } from '@/utils/logger';

export class LinkService {
  constructor(
    private readonly savedItemRepo: SavedItemRepository,
    private readonly gemini: GeminiService,
  ) {}

  async analyzeAndSave(userId: string, url: string, content?: string): Promise<{ item: SavedItem; analysis: LinkAnalysis }> {
    // Analyze link using LLM
    const response = await this.gemini.generate({
      template: 'analyzeLink',
      payload: { url, content },
    });

    let analysis: LinkAnalysis;

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      if (jsonStr.includes('<JSON>')) {
        const match = jsonStr.match(/<JSON>([\s\S]*?)<\/JSON>/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonStr) as LinkAnalysis;
      // Convert null to undefined for location to match schema
      if (parsed.location === null) {
        parsed.location = undefined;
      }
      analysis = LinkAnalysisSchema.parse(parsed);
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

    // Save as SavedItem
    const item = await this.savedItemRepo.create({
      userId,
      sourceType: 'link',
      title: analysis.summary.slice(0, 40),
      content: content || analysis.summary,
      url,
      category: this.mapLinkTypeToCategory(analysis.type),
      tags: analysis.tags,
    });

    // Save LinkMetadata if needed
    try {
      await prisma.linkMetadata.upsert({
        where: { savedItemId: item.id },
        update: {
          url,
          host: new URL(url).hostname,
          title: analysis.summary.slice(0, 100),
          description: analysis.summary,
          analysisJson: JSON.stringify(analysis),
          ...(analysis.location ? { description: `${analysis.summary}\n地點: ${analysis.location}` } : {}),
        },
        create: {
          savedItemId: item.id,
          url,
          host: new URL(url).hostname,
          title: analysis.summary.slice(0, 100),
          description: analysis.summary,
          analysisJson: JSON.stringify(analysis),
        },
      });
    } catch (error) {
      logger.warn('Failed to save link metadata', {
        userId,
        itemId: item.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info('Link analyzed and saved', { userId, itemId: item.id, type: analysis.type });

    return {
      item: SavedItemSchema.parse(item),
      analysis,
    };
  }

  private mapLinkTypeToCategory(type: LinkAnalysis['type']): SavedItem['category'] {
    const mapping: Record<LinkAnalysis['type'], SavedItem['category']> = {
      美食: 'entertainment',
      娛樂: 'entertainment',
      知識: 'knowledge',
      生活: 'inspiration',
      新聞: 'knowledge',
      工具: 'tool',
      其他: 'inspiration',
    };
    return mapping[type] || 'inspiration';
  }
}

