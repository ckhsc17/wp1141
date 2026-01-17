import {
  PrismaReminderRepository,
  PrismaSavedItemRepository,
  PrismaTodoRepository,
  PrismaUserRepository,
} from '@/repositories';
import { ChatService } from '@/services/chatService';
import { ContentService } from '@/services/contentService';
import { FeedbackService } from '@/services/feedbackService';
import { GeminiService } from '@/services/geminiService';
import { InsightService } from '@/services/insightService';
import { IntentClassificationService } from '@/services/intentClassificationService';
import { KnowledgeService } from '@/services/knowledgeService';
import { LifeService } from '@/services/lifeService';
import { LinkService } from '@/services/linkService';
import { MemoryProviderFactory } from '@/services/memory/MemoryProviderFactory';
import { MemoryService } from '@/services/memoryService';
import { MusicService } from '@/services/musicService';
import { RecommendationService } from '@/services/recommendationService';
import { ReminderService } from '@/services/reminderService';
import { TodoService } from '@/services/todoService';
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
const todoRepo = new PrismaTodoRepository();
const gemini = new GeminiService(geminiApiKey);

// 創建 Memory Provider（透過 Factory，根據環境變數選擇）
const memoryProvider = MemoryProviderFactory.create();

// 診斷日誌：檢查 memoryProvider 是否成功創建
if (memoryProvider) {
  logger.info('Memory provider created successfully', {
    providerType: process.env.MEMORY_PROVIDER || 'mem0',
    hasApiKey: !!process.env.MEM0_API_KEY,
  });
} else {
  logger.warn('Memory provider is null - memory features will be disabled', {
    providerType: process.env.MEMORY_PROVIDER || 'mem0',
    hasApiKey: !!process.env.MEM0_API_KEY,
    memoryProviderEnv: process.env.MEMORY_PROVIDER,
  });
}

export const services = {
  content: new ContentService(savedItemRepo, gemini),
  reminders: new ReminderService(reminderRepo),
  insight: new InsightService(savedItemRepo, gemini),
  knowledge: new KnowledgeService(savedItemRepo, gemini),
  memory: new MemoryService(savedItemRepo, gemini),
  music: new MusicService(savedItemRepo, gemini),
  life: new LifeService(savedItemRepo, gemini),
  intentClassification: new IntentClassificationService(gemini),
  todo: new TodoService(todoRepo, reminderRepo, gemini),
  link: new LinkService(savedItemRepo, gemini),
  feedback: new FeedbackService(savedItemRepo, gemini, memoryProvider), // 傳入 memoryProvider（可能為 null）
  recommendation: new RecommendationService(savedItemRepo, gemini, memoryProvider), // 傳入 memoryProvider（可能為 null）
  chat: new ChatService(savedItemRepo, gemini, memoryProvider), // 傳入 memoryProvider（可能為 null）
};

export const repositories = {
  userRepo,
  savedItemRepo,
  reminderRepo,
  todoRepo,
};


