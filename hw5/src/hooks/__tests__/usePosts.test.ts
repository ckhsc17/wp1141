import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import axios from 'axios'
import { usePosts, useCreatePost, useUpdatePost, useDeletePost, usePost } from '../usePosts'
import { mockPosts, mockPost } from '@/__tests__/utils/mocks'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('usePosts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches posts successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { posts: mockPosts } })

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(result.current.data).toEqual(mockPosts)
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/posts', {
      params: { page: undefined, limit: undefined },
    })
  })

  it('fetches posts with pagination params', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { posts: mockPosts } })

    const { result } = renderHook(() => usePosts({ page: 2, limit: 10 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/posts', {
      params: { page: 2, limit: 10 },
    })
  })

  it('fetches user posts', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { posts: mockPosts } })

    const { result } = renderHook(() => usePosts({ userId: 'user-1' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/user-1/posts', {
      params: { page: undefined, limit: undefined },
    })
  })

  it('handles error when fetching posts fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreatePost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a post successfully', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { post: mockPost } })

    const { result } = renderHook(() => useCreatePost(), {
      wrapper: createWrapper(),
    })

    const mutation = result.current
    
    mutation.mutate({ content: 'Test post' })

    await waitFor(() => expect(mutation.isSuccess).toBe(true))
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/posts', { content: 'Test post' })
  })
})

describe('useUpdatePost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('updates a post successfully', async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: { post: mockPost } })

    const { result } = renderHook(() => useUpdatePost(), {
      wrapper: createWrapper(),
    })

    const mutation = result.current
    
    mutation.mutate({ id: 'post-1', input: { content: 'Updated content' } })

    await waitFor(() => expect(mutation.isSuccess).toBe(true))
    
    expect(mockedAxios.put).toHaveBeenCalledWith('/api/posts/post-1', { content: 'Updated content' })
  })
})

describe('useDeletePost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deletes a post successfully', async () => {
    mockedAxios.delete.mockResolvedValueOnce({})

    const { result } = renderHook(() => useDeletePost(), {
      wrapper: createWrapper(),
    })

    const mutation = result.current
    
    mutation.mutate('post-1')

    await waitFor(() => expect(mutation.isSuccess).toBe(true))
    
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/posts/post-1')
  })
})

describe('usePost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches a single post successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { post: mockPost } })

    const { result } = renderHook(() => usePost('post-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(result.current.data).toEqual(mockPost)
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/posts/post-1')
  })

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => usePost(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(mockedAxios.get).not.toHaveBeenCalled()
  })
})
