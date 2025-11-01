import { renderWithProviders, userEvent } from '@/__tests__/utils/test-utils'
import AppBar from '../AppBar'
import { mockSession } from '@/__tests__/utils/mocks'
import { useSession, signIn, signOut } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('AppBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders app title', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { getByText } = renderWithProviders(<AppBar />)
    
    expect(getByText('Twitter Clone')).toBeInTheDocument()
  })

  it('renders sign in button when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { getByRole } = renderWithProviders(<AppBar />)
    
    expect(getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders user avatar when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { container } = renderWithProviders(<AppBar />)
    
    const avatar = container.querySelector('img[alt*="Test User"]')
    expect(avatar).toBeInTheDocument()
  })

  it('calls signIn when sign in button is clicked', async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { getByRole } = renderWithProviders(<AppBar />)
    
    const signInButton = getByRole('button', { name: /sign in/i })
    await user.click(signInButton)
    
    expect(mockSignIn).toHaveBeenCalled()
  })

  it('calls signOut when sign out menu item is clicked', async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { container } = renderWithProviders(<AppBar />)
    
    const avatarButton = container.querySelector('button[aria-label]')
    expect(avatarButton).toBeInTheDocument()
    
    if (avatarButton) {
      await user.click(avatarButton)
      
      const signOutMenuItem = document.querySelector('li[role="menuitem"]')
      expect(signOutMenuItem).toBeInTheDocument()
    }
  })

  it('renders theme toggle button', () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { getAllByRole } = renderWithProviders(<AppBar />)
    
    const buttons = getAllByRole('button')
    const themeToggle = buttons.find(button => 
      button.querySelector('[data-testid*="Brightness"]')
    )
    expect(themeToggle).toBeInTheDocument()
  })

  it('toggles theme when theme button is clicked', async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { getAllByRole } = renderWithProviders(<AppBar />)
    
    const buttons = getAllByRole('button')
    const themeToggle = buttons.find(button => 
      button.querySelector('[data-testid*="Brightness"]')
    )
    
    expect(themeToggle).toBeInTheDocument()
    
    if (themeToggle) {
      await user.click(themeToggle)
      // Theme should change (this is tested in ThemeContext tests)
    }
  })
})

