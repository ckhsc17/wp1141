import { NextRequest, NextResponse } from 'next/server'
import { draftService } from '../services/draftService'
import { draftSchema } from '@/schemas/draft.schema'

export class DraftController {
  async getDraft(userId: string) {
    try {
      const draft = await draftService.getDraft(userId)
      return NextResponse.json({ draft })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get draft' },
        { status: 500 }
      )
    }
  }

  async getDrafts(userId: string) {
    try {
      const drafts = await draftService.getDrafts(userId)
      return NextResponse.json({ drafts })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get drafts' },
        { status: 500 }
      )
    }
  }

  async getDraftById(draftId: string, userId: string) {
    try {
      const draft = await draftService.getDraftById(draftId, userId)
      return NextResponse.json({ draft })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get draft' },
        { status: 404 }
      )
    }
  }

  async saveDraft(request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      const data = draftSchema.parse(body)

      const draft = await draftService.saveDraft(data, userId)
      return NextResponse.json({ draft }, { status: 201 })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to save draft' },
        { status: 400 }
      )
    }
  }

  async createDraft(request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      const data = draftSchema.parse(body)

      const draft = await draftService.createDraft(data, userId)
      return NextResponse.json({ draft }, { status: 201 })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create draft' },
        { status: 400 }
      )
    }
  }

  async updateDraft(draftId: string, request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      const data = draftSchema.parse(body)

      const draft = await draftService.updateDraft(draftId, data, userId)
      return NextResponse.json({ draft })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update draft' },
        { status: 400 }
      )
    }
  }

  async deleteDraft(userId: string) {
    try {
      await draftService.deleteDraft(userId)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Error && error.message === 'Draft not found') {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to delete draft' },
        { status: 500 }
      )
    }
  }

  async deleteDraftById(draftId: string, userId: string) {
    try {
      await draftService.deleteDraftById(draftId, userId)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Error && error.message === 'Draft not found') {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to delete draft' },
        { status: 500 }
      )
    }
  }
}

export const draftController = new DraftController()

