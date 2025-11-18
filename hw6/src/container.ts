import {
  PrismaInsightRepository,
  PrismaJournalRepository,
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
import { JournalService } from '@/services/journalService';
import { LinkService } from '@/services/linkService';
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
const insightRepo = new PrismaInsightRepository();
const todoRepo = new PrismaTodoRepository();
const journalRepo = new PrismaJournalRepository();
const gemini = new GeminiService(geminiApiKey);

export const services = {
  content: new ContentService(savedItemRepo, gemini),
  reminders: new ReminderService(reminderRepo),
  insight: new InsightService(insightRepo, savedItemRepo, gemini),
  intentClassification: new IntentClassificationService(gemini),
  todo: new TodoService(todoRepo, gemini),
  link: new LinkService(savedItemRepo, gemini),
  journal: new JournalService(journalRepo),
  feedback: new FeedbackService(journalRepo, savedItemRepo, gemini),
  recommendation: new RecommendationService(savedItemRepo, gemini),
  chat: new ChatService(savedItemRepo, gemini),
};

export const repositories = {
  userRepo,
  savedItemRepo,
  reminderRepo,
  insightRepo,
  todoRepo,
  journalRepo,
};


