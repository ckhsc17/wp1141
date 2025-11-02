import { Session } from 'next-auth'

export interface User {
  id: string
  userId: string
  name: string
  email?: string | null
  image?: string | null
  bio?: string | null
  createdAt?: Date
  updatedAt?: Date
  _count?: {
    posts: number
    likes: number
    comments: number
  }
}

export interface Post {
  id: string
  content: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  author?: User
  _count?: {
    likes: number
    comments: number
  }
}

export interface Like {
  id: string
  postId: string
  userId: string
  createdAt: Date
}

export interface Comment {
  id: string
  content: string
  postId: string
  authorId: string
  parentId?: string | null
  createdAt: Date
  updatedAt: Date
  author?: User
  _count?: {
    replies: number
  }
}

export interface ExtendedSession extends Session {
  user: {
    id: string
    userId?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreatePostInput {
  content: string
}

export interface CreateCommentInput {
  content: string
  postId: string
  parentId?: string
}

