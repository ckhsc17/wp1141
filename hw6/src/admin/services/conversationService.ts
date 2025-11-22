import type {
  ConversationRepository,
  ConversationFilters,
  ConversationListResult,
} from '../repositories/conversationRepository';

export class ConversationService {
  constructor(private readonly conversationRepo: ConversationRepository) {}

  async listConversations(filters: ConversationFilters): Promise<ConversationListResult> {
    return this.conversationRepo.listConversations(filters);
  }
}

