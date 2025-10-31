import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class PostRepository {
  async create(data: { content: string; authorId: string }) {
    return prisma.post.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })
  }

  async findMany(options: {
    skip: number
    take: number
    where?: Prisma.PostWhereInput
  }) {
    return prisma.post.findMany({
      skip: options.skip,
      take: options.take,
      where: options.where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })
  }

  async findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })
  }

  async update(id: string, data: { content: string }) {
    return prisma.post.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            userId: true,
            name: true,
            image: true,
          },
        },
      },
    })
  }

  async delete(id: string) {
    return prisma.post.delete({
      where: { id },
    })
  }

  async count(where?: Prisma.PostWhereInput) {
    return prisma.post.count({ where })
  }
}

export const postRepository = new PostRepository()

