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
}

export const userRepository = new UserRepository()

