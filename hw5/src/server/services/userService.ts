import { userRepository } from '../repositories/userRepository'
import { CreateUserIdInput, UpdateProfileInput } from '@/schemas/user.schema'

export class UserService {
  async getUserByUserId(userId: string) {
    const user = await userRepository.findByUserId(userId)
    if (!user) {
      throw new Error('User not found')
    }
    return user
  }

  async setUserId(id: string, data: CreateUserIdInput) {
    // 檢查 userID 是否已被使用
    const isTaken = await userRepository.isUserIdTaken(data.userId)
    if (isTaken) {
      throw new Error('UserID is already taken')
    }

    return userRepository.setUserId(id, data.userId)
  }

  async updateProfile(id: string, data: UpdateProfileInput) {
    return userRepository.updateProfile(id, data)
  }

  async checkUserIdAvailability(userId: string) {
    const isTaken = await userRepository.isUserIdTaken(userId)
    return { available: !isTaken }
  }

  async searchUsers(query: string, limit: number = 10) {
    if (!query || query.trim().length === 0) {
      return []
    }

    return userRepository.searchUsers(query, limit)
  }
}

export const userService = new UserService()

