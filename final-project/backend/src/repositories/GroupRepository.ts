import prisma from '../lib/prisma';

export class GroupRepository {
  /**
   * Find group by ID with members
   */
  async findById(id: number) {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            email: true,
            name: true,
            avatar: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!group) return null;

    // Fetch owner separately since there's no direct relation
    const owner = await prisma.user.findUnique({
      where: { userId: group.ownerId },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    return {
      ...group,
      owner: owner || null,
    };
  }

  /**
   * Find all groups for a user
   */
  async findByUserId(userId: string) {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch owners for all groups
    const groupsWithOwners = await Promise.all(
      groups.map(async (group) => {
        const owner = await prisma.user.findUnique({
          where: { userId: group.ownerId },
          select: {
            id: true,
            userId: true,
            email: true,
            name: true,
            avatar: true,
          },
        });

        return {
          ...group,
          owner: owner || null,
        };
      })
    );

    return groupsWithOwners;
  }

  /**
   * Create a new group
   */
  async create(data: { name: string; ownerId: string; memberIds?: number[] }) {
    const group = await prisma.group.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        members: data.memberIds
          ? {
              connect: data.memberIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Fetch owner separately
    const owner = await prisma.user.findUnique({
      where: { userId: group.ownerId },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    return {
      ...group,
      owner: owner || null,
    };
  }

  /**
   * Update group name
   */
  async update(id: number, data: { name: string }) {
    const group = await prisma.group.update({
      where: { id },
      data: { name: data.name },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Fetch owner separately
    const owner = await prisma.user.findUnique({
      where: { userId: group.ownerId },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    return {
      ...group,
      owner: owner || null,
    };
  }

  /**
   * Delete a group
   */
  async delete(id: number) {
    return prisma.group.delete({
      where: { id },
    });
  }

  /**
   * Check if user is a member of the group
   */
  async isMember(groupId: number, userId: string): Promise<boolean> {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });
    return !!group;
  }

  /**
   * Check if user is the owner of the group
   */
  async isOwner(groupId: number, userId: string): Promise<boolean> {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ownerId: userId,
      },
    });
    return !!group;
  }
}

export const groupRepository = new GroupRepository();

