import {
  InMemoryInsightRepository,
  InMemoryReminderRepository,
  InMemorySavedItemRepository,
  InMemoryUserRepository,
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

const userRepo = new InMemoryUserRepository();
const savedItemRepo = new InMemorySavedItemRepository();
const reminderRepo = new InMemoryReminderRepository();
const insightRepo = new InMemoryInsightRepository();
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


