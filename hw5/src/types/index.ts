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
    following: number
    followers: number
  }
}

export interface Post {
  id: string
  content: string
  authorId: string
  originalPostId?: string | null
  originalCommentId?: string | null
  createdAt: Date
  updatedAt: Date
  author?: User
  originalPost?: Post
  originalComment?: Comment
  isLikedByCurrentUser?: boolean
  isRepostedByCurrentUser?: boolean
  _count?: {
    likes: number
    comments: number
    repostRecords?: number
  }
}

export interface Like {
  id: string
  postId?: string | null
  commentId?: string | null
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
    likes?: number
    repostRecords?: number
  }
}

export interface Mention {
  id: string
  postId?: string | null
  commentId?: string | null
  mentionerId: string
  mentionedId: string
  createdAt: Date
  read: boolean
  mentioner?: User
  mentioned?: User
  post?: Post
  comment?: Comment
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

export interface Repost {
  id: string
  postId?: string | null
  commentId?: string | null
  userId: string
  createdAt: Date
}

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'mention' | 'follow'
  userId: string
  actorId: string
  postId?: string | null
  commentId?: string | null
  mentionId?: string | null
  read: boolean
  createdAt: Date
  actor?: User
  post?: Post
  comment?: Comment
}


