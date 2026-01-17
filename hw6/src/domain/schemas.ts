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
  title: z.string().optional(),
  content: z.string(),
  url: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  location: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
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

export const SharedContentSchema = z.object({
  text: z.string().optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SharedContent = z.infer<typeof SharedContentSchema>;

// Intent Classification (簡化為 5 種意圖)
export const IntentClassificationSchema = z.object({
  intent: z.enum(['todo', 'link', 'save_content', 'query', 'other']), // 從 11 種減少到 5 種
  subIntent: z.enum(['create', 'update', 'query']).optional(), // 僅 todo 時需要
  contentType: z.enum(['insight', 'knowledge', 'memory', 'music', 'life']).optional(), // 僅 save_content 時使用
  queryType: z.enum(['feedback', 'recommendation', 'chat_history']).optional(), // 僅 query 時使用
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

// Link Analysis
export const LinkAnalysisSchema = z.object({
  type: z.enum(['美食', '娛樂', '知識', '生活', '新聞', '工具', '其他']),
  summary: z.string().max(300),
  location: z.string().nullable().optional(), // Allow both null and undefined
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


