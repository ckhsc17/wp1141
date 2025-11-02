import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 清空現有資料
  await prisma.mention.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.like.deleteMany()
  await prisma.post.deleteMany()
  await prisma.draft.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('Cleared existing data')

  // 建立 20 個測試用戶
  const users = []
  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const userId = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${faker.string.alphanumeric(4)}`
    
    const user = await prisma.user.create({
      data: {
        userId,
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }),
        bio: faker.person.bio(),
        image: faker.image.avatar(),
      },
    })
    users.push(user)
  }

  console.log(`Created ${users.length} users`)

  // 為每個用戶建立 3-8 則貼文
  const allPosts = []
  for (const user of users) {
    const postCount = faker.number.int({ min: 3, max: 8 })
    for (let i = 0; i < postCount; i++) {
      const post = await prisma.post.create({
        data: {
          content: faker.lorem.sentence({ min: 10, max: 50 }),
          authorId: user.id,
          createdAt: faker.date.recent({ days: 30 }),
        },
      })
      allPosts.push(post)
    }
  }

  console.log(`Created ${allPosts.length} posts`)

  // 隨機按讚：每個貼文有 30-70% 的用戶按讚
  const likes = []
  for (const post of allPosts) {
    const numLikes = faker.number.int({ min: Math.floor(users.length * 0.3), max: Math.floor(users.length * 0.7) })
    const shuffledUsers = faker.helpers.shuffle([...users])
    const usersToLike = shuffledUsers.slice(0, numLikes)
    
    for (const user of usersToLike) {
      // 不會按讚自己的貼文
      if (user.id !== post.authorId) {
        likes.push({
          postId: post.id,
          userId: user.id,
          createdAt: faker.date.between({ from: post.createdAt, to: new Date() }),
        })
      }
    }
  }

  await prisma.like.createMany({
    data: likes,
    skipDuplicates: true,
  })

  console.log(`Created ${likes.length} likes`)

  // 隨機留言：30-50% 的貼文有留言
  const postsWithComments = faker.helpers.arrayElements(allPosts, {
    min: Math.floor(allPosts.length * 0.3),
    max: Math.floor(allPosts.length * 0.5),
  })

  // 先建立頂層留言
  const topLevelComments = []
  for (const post of postsWithComments) {
    const numComments = faker.number.int({ min: 1, max: 5 })
    const shuffledUsers = faker.helpers.shuffle([...users])
    
    for (let i = 0; i < numComments; i++) {
      const user = shuffledUsers[i]
      // 不會留言在自己的貼文
      if (user.id !== post.authorId) {
        const comment = await prisma.comment.create({
          data: {
            content: faker.lorem.sentence({ min: 5, max: 30 }),
            postId: post.id,
            authorId: user.id,
            createdAt: faker.date.between({ from: post.createdAt, to: new Date() }),
          },
        })
        topLevelComments.push(comment)
      }
    }
  }

  console.log(`Created ${topLevelComments.length} top-level comments`)

  // 為部分頂層留言建立 1-3 層巢狀回覆
  const commentsWithReplies = faker.helpers.arrayElements(topLevelComments, {
    min: Math.floor(topLevelComments.length * 0.3),
    max: Math.floor(topLevelComments.length * 0.5),
  })

  let replyCount = 0
  for (const comment of commentsWithReplies) {
    const numReplies = faker.number.int({ min: 1, max: 3 })
    
    for (let i = 0; i < numReplies; i++) {
      const user = faker.helpers.arrayElement(users)
      // 不會回覆自己
      if (user.id !== comment.authorId) {
        await prisma.comment.create({
          data: {
            content: faker.lorem.sentence({ min: 5, max: 30 }),
            postId: comment.postId,
            authorId: user.id,
            parentId: comment.id,
            createdAt: faker.date.between({ from: comment.createdAt, to: new Date() }),
          },
        })
        replyCount++
      }
    }
  }

  console.log(`Created ${replyCount} replies`)
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

