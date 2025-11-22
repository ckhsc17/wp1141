import type {
  AnalyticsRepository,
  DateRange,
  UserStats,
  ConversationStats,
  IntentDistribution,
  DailyActivity,
} from '../repositories/analyticsRepository';

export class AnalyticsService {
  constructor(private readonly analyticsRepo: AnalyticsRepository) {}

  async getUserStats(dateRange?: DateRange): Promise<UserStats> {
    return this.analyticsRepo.getUserStats(dateRange);
  }

  async getConversationStats(dateRange?: DateRange): Promise<ConversationStats> {
    return this.analyticsRepo.getConversationStats(dateRange);
  }

  async getIntentDistribution(dateRange?: DateRange): Promise<IntentDistribution[]> {
    return this.analyticsRepo.getIntentDistribution(dateRange);
  }

  async getDailyActivity(dateRange?: DateRange): Promise<DailyActivity[]> {
    return this.analyticsRepo.getDailyActivity(dateRange);
  }
}

