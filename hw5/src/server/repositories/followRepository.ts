import { prisma } from '@/lib/prisma'

export class FollowRepository {
  async isFollowing(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })
    return !!follow
  }

  async follow(followerId: string, followingId: string) {
    return prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    })
  }

  async unfollow(followerId: string, followingId: string) {
    return prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })
  }

  async getFollowingCount(userId: string) {
    return prisma.follow.count({
      where: { followerId: userId },
    })
  }

  async getFollowersCount(userId: string) {
    return prisma.follow.count({
      where: { followingId: userId },
    })
  }
}

export const followRepository = new FollowRepository()



