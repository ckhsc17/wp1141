import { prisma } from '@/lib/prisma'

export class DraftRepository {
  async findByUserId(userId: string) {
    return prisma.draft.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findManyByUserId(userId: string) {
    return prisma.draft.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findById(id: string) {
    return prisma.draft.findUnique({
      where: { id },
    })
  }

  async create(data: { content: string; userId: string }) {
    return prisma.draft.create({
      data,
    })
  }

  async update(id: string, data: { content: string }) {
    return prisma.draft.update({
      where: { id },
      data,
    })
  }

  async delete(id: string) {
    return prisma.draft.delete({
      where: { id },
    })
  }
}

export const draftRepository = new DraftRepository()

