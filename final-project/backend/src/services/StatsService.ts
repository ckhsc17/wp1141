import { userRepository } from '../repositories/UserRepository';

export class StatsService {
  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    return userRepository.getUserStats(userId);
  }
}

export const statsService = new StatsService();

