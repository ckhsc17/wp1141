import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  locale: z.enum(['zh-TW', 'en-US']).default('zh-TW'),
  timeZone: z.string().default('Asia/Taipei'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const SavedItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sourceType: z.enum(['link', 'note', 'chat']),
  title: z.string().optional(),
  content: z.string(),
  url: z.string().url().optional(),
  category: z.enum(['inspiration', 'knowledge', 'project', 'tool', 'entertainment']),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type SavedItem = z.infer<typeof SavedItemSchema>;

export const ReminderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  triggerAt: z.date(),
  status: z.enum(['pending', 'sent']).default('pending'),
  createdAt: z.date().default(() => new Date()),
});

export type Reminder = z.infer<typeof ReminderSchema>;

export const InsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  summary: z.string(),
  actionItems: z.array(z.string()).default([]),
  sentiment: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
  createdAt: z.date().default(() => new Date()),
});

export type Insight = z.infer<typeof InsightSchema>;

export const SharedContentSchema = z.object({
  text: z.string().optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SharedContent = z.infer<typeof SharedContentSchema>;

// Intent Classification
export const IntentClassificationSchema = z.object({
  intent: z.enum(['todo', 'link', 'journal', 'feedback', 'recommendation', 'chat_history', 'other']),
  subIntent: z.enum(['create', 'update', 'query']).optional(),
  confidence: z.number().min(0).max(1).default(0.8),
  extractedData: z.record(z.string(), z.unknown()).optional(),
});

export type IntentClassification = z.infer<typeof IntentClassificationSchema>;

// Todo
export const TodoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['pending', 'done', 'cancelled']).default('pending'),
  date: z.date().optional(), // 行程時間（與別人有約的時間）
  due: z.date().optional(), // 截止時間（任務的截止日期）
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Todo = z.infer<typeof TodoSchema>;

// Journal Entry
export const JournalEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;

// Link Analysis
export const LinkAnalysisSchema = z.object({
  type: z.enum(['美食', '娛樂', '知識', '生活', '新聞', '工具', '其他']),
  summary: z.string().max(150),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type LinkAnalysis = z.infer<typeof LinkAnalysisSchema>;

// Chat Message (for storing chat history)
export const ChatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant']).default('user'),
  createdAt: z.date().default(() => new Date()),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;


