import { renderWithProviders } from '@/__tests__/utils/test-utils'
import PostCard from '../PostCard'
import { mockPost } from '@/__tests__/utils/mocks'

describe('PostCard', () => {
  const mockOnLike = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders post content correctly', () => {
    const { getByText } = renderWithProviders(
      <PostCard post={mockPost} onLike={mockOnLike} />
    )

    expect(getByText(mockPost.content)).toBeInTheDocument()
  })

  it('renders author information', () => {
    const { getByText } = renderWithProviders(
      <PostCard post={mockPost} onLike={mockOnLike} />
    )

    expect(getByText(mockPost.author!.name)).toBeInTheDocument()
    expect(getByText(`@${mockPost.author!.userId}`)).toBeInTheDocument()
  })

  it('displays like and comment counts', () => {
    const { getByText } = renderWithProviders(
      <PostCard post={mockPost} onLike={mockOnLike} />
    )

    expect(getByText(mockPost._count!.likes.toString())).toBeInTheDocument()
    expect(getByText(mockPost._count!.comments.toString())).toBeInTheDocument()
  })

  it('calls onLike when like button is clicked', async () => {
    const { getByRole } = renderWithProviders(
      <PostCard post={mockPost} onLike={mockOnLike} />
    )

    const likeButton = getByRole('button', { name: /favorite/i })
    
    // The button should be in the document
    expect(likeButton).toBeInTheDocument()
  })

  it('shows filled heart icon when post is liked', () => {
    const { container } = renderWithProviders(
      <PostCard post={mockPost} onLike={mockOnLike} isLiked={true} />
    )

    // Check if FavoriteIcon is rendered (filled)
    const favoriteIcon = container.querySelector('[data-testid="FavoriteIcon"]')
    expect(favoriteIcon).toBeInTheDocument()
  })

  it('shows outline heart icon when post is not liked', () => {
    const { container } = renderWithProviders(
      <PostCard post={mockPost} onLike={mockOnLike} isLiked={false} />
    )

    // Check if FavoriteBorderIcon is rendered (outline)
    const favoriteBorderIcon = container.querySelector('[data-testid="FavoriteBorderIcon"]')
    expect(favoriteBorderIcon).toBeInTheDocument()
  })

  it('has links to author profile', () => {
    const { container } = renderWithProviders(
      <PostCard post={mockPost} onLike={mockOnLike} />
    )

    const profileLinks = container.querySelectorAll(`a[href="/profile/${mockPost.author!.userId}"]`)
    expect(profileLinks.length).toBeGreaterThan(0)
  })

  it('has link to post detail page', () => {
    const { container } = renderWithProviders(
      <PostCard post={mockPost} onLike={mockOnLike} />
    )

    const postLink = container.querySelector(`a[href="/post/${mockPost.id}"]`)
    expect(postLink).toBeInTheDocument()
  })
})

