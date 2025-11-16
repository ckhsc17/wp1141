import {
  PrismaInsightRepository,
  PrismaReminderRepository,
  PrismaSavedItemRepository,
  PrismaUserRepository,
} from '@/repositories';
import { ContentService } from '@/services/contentService';
import { GeminiService } from '@/services/geminiService';
import { InsightService } from '@/services/insightService';
import { ReminderService } from '@/services/reminderService';
import { logger } from '@/utils/logger';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  logger.warn('GEMINI_API_KEY is not set. Gemini features will be disabled.');
}

// 使用 Prisma 版本的 repository，直接對接資料庫。
// 若尚未啟動 DB 或尚未執行 migrate，請先依 README 步驟設定 DATABASE_URL 並跑 prisma 指令。
const userRepo = new PrismaUserRepository();
const savedItemRepo = new PrismaSavedItemRepository();
const reminderRepo = new PrismaReminderRepository();
const insightRepo = new PrismaInsightRepository();
const gemini = new GeminiService(geminiApiKey);

export const services = {
  content: new ContentService(savedItemRepo, gemini),
  reminders: new ReminderService(reminderRepo),
  insight: new InsightService(insightRepo, savedItemRepo, gemini),
};

export const repositories = {
  userRepo,
  savedItemRepo,
  reminderRepo,
  insightRepo,
};


