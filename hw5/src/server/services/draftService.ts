import { draftRepository } from '../repositories/draftRepository'
import { DraftInput } from '@/schemas/draft.schema'

export class DraftService {
  async getDraft(userId: string) {
    return draftRepository.findByUserId(userId)
  }

  async getDrafts(userId: string) {
    return draftRepository.findManyByUserId(userId)
  }

  async getDraftById(id: string, userId: string) {
    const draft = await draftRepository.findById(id)
    if (!draft || draft.userId !== userId) {
      throw new Error('Draft not found')
    }
    return draft
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

  async createDraft(data: DraftInput, userId: string) {
    return draftRepository.create({ content: data.content, userId })
  }

  async updateDraft(id: string, data: DraftInput, userId: string) {
    const draft = await draftRepository.findById(id)
    if (!draft || draft.userId !== userId) {
      throw new Error('Draft not found')
    }
    return draftRepository.update(id, { content: data.content })
  }

  async deleteDraft(userId: string) {
    const draft = await draftRepository.findByUserId(userId)
    if (!draft) {
      throw new Error('Draft not found')
    }
    return draftRepository.delete(draft.id)
  }

  async deleteDraftById(id: string, userId: string) {
    const draft = await draftRepository.findById(id)
    if (!draft || draft.userId !== userId) {
      throw new Error('Draft not found')
    }
    return draftRepository.delete(id)
  }
}

export const draftService = new DraftService()

