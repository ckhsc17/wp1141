import { prisma } from '@/lib/prisma'

export class UserRepository {
  async findByUserId(userId: string) {
    return prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        name: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            likes: true,
            comments: true,
            following: true,
            followers: true,
          },
        },
      },
    })
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  async updateProfile(id: string, data: { name?: string; bio?: string }) {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  async setUserId(id: string, userId: string) {
    return prisma.user.update({
      where: { id },
      data: { userId },
    })
  }

  async isUserIdTaken(userId: string) {
    const user = await prisma.user.findUnique({
      where: { userId },
    })
    return !!user
  }

  async searchUsers(query: string, limit: number = 10) {
    return prisma.user.findMany({
      where: {
        OR: [
          { userId: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        userId: true,
        name: true,
        image: true,
      },
      take: limit,
    })
  }
}

export const userRepository = new UserRepository()

