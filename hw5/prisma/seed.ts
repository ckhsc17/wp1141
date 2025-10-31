import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 建立測試用戶
  const user1 = await prisma.user.upsert({
    where: { userId: 'alice_dev' },
    update: {},
    create: {
      userId: 'alice_dev',
      name: 'Alice Developer',
      email: 'alice@example.com',
      bio: 'Full-stack developer passionate about building great products',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { userId: 'bob_designer' },
    update: {},
    create: {
      userId: 'bob_designer',
      name: 'Bob Designer',
      email: 'bob@example.com',
      bio: 'UI/UX Designer & creative enthusiast',
    },
  })

  const user3 = await prisma.user.upsert({
    where: { userId: 'charlie_tech' },
    update: {},
    create: {
      userId: 'charlie_tech',
      name: 'Charlie Tech',
      email: 'charlie@example.com',
      bio: 'Tech blogger and open source contributor',
    },
  })

  console.log('Created users:', { user1: user1.userId, user2: user2.userId, user3: user3.userId })

  // 建立測試貼文
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        content: 'Just shipped a new feature! 🚀 Excited to see how users will interact with it. #buildinpublic',
        authorId: user1.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Beautiful sunset at the office today. Sometimes you need to step back and appreciate the moment. 🌅',
        authorId: user2.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Just read an amazing blog post about React 19 features. The future of web development looks bright! 📚',
        authorId: user3.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Coffee and code. The perfect morning routine. ☕ What are you working on today?',
        authorId: user1.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Design isn\'t just what it looks like - design is how it works. - Steve Jobs',
        authorId: user2.id,
      },
    }),
  ])

  console.log(`Created ${posts.length} posts`)

  // 建立一些按讚
  await prisma.like.createMany({
    data: [
      { postId: posts[0].id, userId: user2.id },
      { postId: posts[0].id, userId: user3.id },
      { postId: posts[1].id, userId: user1.id },
      { postId: posts[1].id, userId: user3.id },
      { postId: posts[2].id, userId: user1.id },
      { postId: posts[2].id, userId: user2.id },
    ],
    skipDuplicates: true,
  })

  console.log('Created likes')

  // 建立一些留言
  await Promise.all([
    prisma.comment.create({
      data: {
        content: 'Congratulations! Can\'t wait to try it out.',
        postId: posts[0].id,
        authorId: user2.id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Looks amazing! Great work! 🔥',
        postId: posts[0].id,
        authorId: user3.id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Love the design!',
        postId: posts[1].id,
        authorId: user1.id,
      },
    }),
  ])

  console.log('Created comments')
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

