import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class PostRepository {
  async create(data: { content: string; authorId: string; originalPostId?: string | null; originalCommentId?: string | null }) {
    console.log('[PostRepository] Post created:')
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
        originalPost: {
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
                repostRecords: true,
              } as any,
            },
          },
        } as any,
        originalComment: {
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
                repostRecords: true,
                replies: true,
              } as any,
            },
          },
        } as any,
        _count: {
          select: {
            likes: true,
            comments: true,
            repostRecords: true,
          } as any,
        },
      } as any,
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
        originalPost: {
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
                repostRecords: true,
              } as any,
            },
          },
        } as any,
        originalComment: {
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
                repostRecords: true,
                replies: true,
              } as any,
            },
          },
        } as any,
        _count: {
          select: {
            likes: true,
            comments: true,
            repostRecords: true,
          } as any,
        },
      } as any,
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
        originalPost: {
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
                repostRecords: true,
              } as any,
            },
          },
        } as any,
        originalComment: {
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
                repostRecords: true,
                replies: true,
              } as any,
            },
          },
        } as any,
        _count: {
          select: {
            likes: true,
            comments: true,
            repostRecords: true,
          } as any,
        },
      } as any,
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

