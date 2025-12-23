import prisma from '../lib/prisma';
import { nanoid } from 'nanoid';

const TOKEN_LENGTH = 32; // 32 字元的 NanoID

export class ShareTokenService {
  /**
   * 生成新的 share token
   */
  async generateToken(eventId: number): Promise<string> {
    // 檢查是否已存在 token
    const existing = await prisma.shareToken.findFirst({
      where: { eventId },
    });

    if (existing) {
      return existing.token;
    }

    // 生成新的 token（確保唯一性）
    let token: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      token = nanoid(TOKEN_LENGTH);
      const existingToken = await prisma.shareToken.findUnique({
        where: { token },
      });

      if (!existingToken) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique token');
    }

    // 創建 share token
    await prisma.shareToken.create({
      data: {
        eventId,
        token: token!,
      },
    });

    return token!;
  }

  /**
   * 重新生成 share token（刪除舊的，創建新的）
   */
  async regenerateToken(eventId: number): Promise<string> {
    // 刪除現有的 token
    await prisma.shareToken.deleteMany({
      where: { eventId },
    });

    // 生成新的 token
    return this.generateToken(eventId);
  }

  /**
   * 根據 token 獲取 event ID
   */
  async getEventIdByToken(token: string): Promise<number | null> {
    const shareToken = await prisma.shareToken.findUnique({
      where: { token },
      select: { eventId: true },
    });

    return shareToken?.eventId || null;
  }

  /**
   * 根據 event ID 獲取 token
   */
  async getTokenByEventId(eventId: number): Promise<string | null> {
    const shareToken = await prisma.shareToken.findFirst({
      where: { eventId },
      select: { token: true },
    });

    return shareToken?.token || null;
  }

  /**
   * 確保 event 有 share token（如果沒有則生成）
   */
  async ensureToken(eventId: number): Promise<string> {
    const existingToken = await this.getTokenByEventId(eventId);
    if (existingToken) {
      return existingToken;
    }

    return this.generateToken(eventId);
  }
}

export const shareTokenService = new ShareTokenService();

