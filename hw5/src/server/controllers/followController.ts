import { NextResponse } from 'next/server'
import { followService } from '../services/followService'
import { userRepository } from '../repositories/userRepository'

export class FollowController {
  async checkFollow(currentUserId: string, targetUserIdString: string) {
    try {
      // targetUserIdString 是自訂的 userId（如 "ric2k1"），需要找到對應的 id
      const targetUser = await userRepository.findByUserId(targetUserIdString)
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
      }
      
      const result = await followService.checkFollowStatus(currentUserId, targetUser.id)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to check follow status' },
        { status: 400 }
      )
    }
  }

  async toggleFollow(currentUserId: string, targetUserIdString: string) {
    try {
      // targetUserIdString 是自訂的 userId（如 "ric2k1"），需要找到對應的 id
      const targetUser = await userRepository.findByUserId(targetUserIdString)
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
      }
      
      const result = await followService.toggleFollow(currentUserId, targetUser.id)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to toggle follow' },
        { status: 400 }
      )
    }
  }
}

export const followController = new FollowController()

