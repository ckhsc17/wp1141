import { NextRequest, NextResponse } from 'next/server'
import { userService } from '../services/userService'
import { createUserIdSchema, updateProfileSchema } from '@/schemas/user.schema'

export class UserController {
  async getUser(userId: string) {
    try {
      const user = await userService.getUserByUserId(userId)
      return NextResponse.json({ user })
    } catch (error) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
  }

  async setUserId(request: NextRequest, currentUserId: string) {
    try {
      const body = await request.json()
      const data = createUserIdSchema.parse(body)

      const user = await userService.setUserId(currentUserId, data)
      return NextResponse.json({ user })
    } catch (error) {
      if (error instanceof Error && error.message === 'UserID is already taken') {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      return NextResponse.json(
        { error: 'Failed to set userID' },
        { status: 400 }
      )
    }
  }

  async updateProfile(request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      const data = updateProfileSchema.parse(body)

      const user = await userService.updateProfile(userId, data)
      return NextResponse.json({ user })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 400 }
      )
    }
  }

  async checkUserId(userId: string) {
    try {
      const result = await userService.checkUserIdAvailability(userId)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to check userID' },
        { status: 500 }
      )
    }
  }
}

export const userController = new UserController()

