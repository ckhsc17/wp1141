import { renderWithProviders, userEvent } from '@/__tests__/utils/test-utils'
import PostForm from '../PostForm'
import { mockSession } from '@/__tests__/utils/mocks'
import { useSession } from 'next-auth/react'
import { useCreatePost } from '@/hooks'
import { waitFor } from '@testing-library/react'

// Mock the hooks
jest.mock('next-auth/react')
jest.mock('@/hooks')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseCreatePost = useCreatePost as jest.MockedFunction<typeof useCreatePost>

describe('PostForm', () => {
  const mockMutateAsync = jest.fn()
  const mockOnPostCreated = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })
    mockUseCreatePost.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
  })

  it('renders the form with all inputs', () => {
    const { getByPlaceholderText, getByRole } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    expect(getByPlaceholderText("What's happening?")).toBeInTheDocument()
    expect(getByRole('button', { name: /post/i })).toBeInTheDocument()
  })

  it('renders user avatar when authenticated', () => {
    const { container } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    const avatar = container.querySelector('img[alt*="Test User"]')
    expect(avatar).toBeInTheDocument()
  })

  it('does not render when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { queryByPlaceholderText } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    expect(queryByPlaceholderText("What's happening?")).not.toBeInTheDocument()
  })

  it('disables submit button when input is empty', () => {
    const { getByRole } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    const submitButton = getByRole('button', { name: /post/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when input has content', async () => {
    const user = userEvent.setup()
    const { getByPlaceholderText, getByRole } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    const input = getByPlaceholderText("What's happening?")
    await user.type(input, 'Hello world')

    const submitButton = getByRole('button', { name: /post/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('disables submit button when posting', async () => {
    mockUseCreatePost.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any)

    const user = userEvent.setup()
    const { getByPlaceholderText, getByRole } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    const input = getByPlaceholderText("What's happening?")
    await user.type(input, 'Hello world')

    const submitButton = getByRole('button', { name: /post/i })
    expect(submitButton).toBeDisabled()
  })

  it('calls createPost mutation when form is submitted', async () => {
    const user = userEvent.setup()
    const { getByPlaceholderText, getByRole } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    const input = getByPlaceholderText("What's happening?")
    await user.type(input, 'Hello world')

    const submitButton = getByRole('button', { name: /post/i })
    await user.click(submitButton)

    expect(mockMutateAsync).toHaveBeenCalledWith({ content: 'Hello world' })
  })

  it('clears input after successful post', async () => {
    mockMutateAsync.mockResolvedValueOnce({})

    const user = userEvent.setup()
    const { getByPlaceholderText, getByRole } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    const input = getByPlaceholderText("What's happening?")
    await user.type(input, 'Hello world')

    const submitButton = getByRole('button', { name: /post/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(getByPlaceholderText("What's happening?")).toHaveValue('')
    })
  })

  it('calls onPostCreated callback after successful post', async () => {
    mockMutateAsync.mockResolvedValueOnce({})

    const user = userEvent.setup()
    const { getByPlaceholderText, getByRole } = renderWithProviders(
      <PostForm onPostCreated={mockOnPostCreated} />
    )

    const input = getByPlaceholderText("What's happening?")
    await user.type(input, 'Hello world')

    const submitButton = getByRole('button', { name: /post/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnPostCreated).toHaveBeenCalled()
    })
  })
})

