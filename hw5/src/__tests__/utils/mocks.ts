import { User, Post, Comment, ExtendedSession } from '@/types'

export const mockUser: User = {
  id: 'user-1',
  userId: 'test_user',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
  bio: 'This is a test bio',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockPost: Post = {
  id: 'post-1',
  content: 'This is a test post content',
  authorId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  author: mockUser,
  _count: {
    likes: 10,
    comments: 5,
  },
}

export const mockComment: Comment = {
  id: 'comment-1',
  content: 'This is a test comment',
  postId: 'post-1',
  authorId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  author: mockUser,
}

export const mockSession: ExtendedSession = {
  user: {
    id: 'user-1',
    userId: 'test_user',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
  },
  expires: '2025-01-01',
}

export const mockPosts: Post[] = [
  mockPost,
  {
    ...mockPost,
    id: 'post-2',
    content: 'Another test post',
    _count: {
      likes: 20,
      comments: 10,
    },
  },
]

export const mockComments: Comment[] = [
  mockComment,
  {
    ...mockComment,
    id: 'comment-2',
    content: 'Another test comment',
  },
]

