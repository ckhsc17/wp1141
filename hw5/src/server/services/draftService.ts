import { draftRepository } from '../repositories/draftRepository'
import { DraftInput } from '@/schemas/draft.schema'

export class DraftService {
  async getDraft(userId: string) {
    return draftRepository.findByUserId(userId)
  }

  async saveDraft(data: DraftInput, userId: string) {
    // 查找是否已有草稿
    const existingDraft = await draftRepository.findByUserId(userId)
    
    if (existingDraft) {
      // 更新現有草稿
      return draftRepository.update(existingDraft.id, { content: data.content })
    } else {
      // 建立新草稿
      return draftRepository.create({ content: data.content, userId })
    }
  }

  async deleteDraft(userId: string) {
    const draft = await draftRepository.findByUserId(userId)
    if (!draft) {
      throw new Error('Draft not found')
    }
    return draftRepository.delete(draft.id)
  }
}

export const draftService = new DraftService()

