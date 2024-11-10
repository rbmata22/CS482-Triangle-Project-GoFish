/* eslint-disable no-undef */
import { render, screen, fireEvent,  act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { setDoc, doc } from 'firebase/firestore'
import Guest from './Guest'

// Mock Firebase functions and modules for testing
jest.mock('../config/firebase', () => ({
    db: {}
}))

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn(),
}))

// Mock navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

describe('Guest Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    const renderGuest = () => {
        render(
            <BrowserRouter>
                <Guest />
            </BrowserRouter>
        )
    }

    it('Successfully joins as guest and sets data in Firestore and local storage', async () => {
        setDoc.mockResolvedValueOnce() // Mock Firestore document set to succeed

        renderGuest()

        // Move to step 2 by entering a username and submitting
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'guestUser' } })
        fireEvent.click(screen.getByText('Submit'))

        // Select an icon and click 'Join as Guest'
        fireEvent.click(screen.getByTestId('dog-icon')) // Assuming a test ID for icon selection
        await act(async () => {
            fireEvent.click(screen.getByText('Join as Guest'))
        })

        // Assert that Firestore's setDoc was called with appropriate data
        expect(setDoc).toHaveBeenCalledWith(doc(expect.anything(), 'Guests', expect.stringContaining('guest_')), {
            username: 'guestUser',
            logo: 'Dog',
            virtualCurrency: 500,
            inventory: {},
            unlockedIcons: ['Dog']
        })

        // Check localStorage data
        expect(localStorage.getItem('authType')).toBe('Guest')
        expect(localStorage.getItem('username')).toBe('guestUser')
        expect(localStorage.getItem('logo')).toBe('Dog')
        expect(localStorage.getItem('guestCurrency')).toBe('500')
        expect(localStorage.getItem('guestInventory')).toBe(JSON.stringify({}))
        expect(localStorage.getItem('guestUnlockedIcons')).toBe(JSON.stringify(['Dog']))

        // Verify navigation to home page
        expect(mockNavigate).toHaveBeenCalledWith('/home')
    })

    it('Handles Firestore error gracefully and displays error message', async () => {
        setDoc.mockRejectedValueOnce(new Error('Firestore error')) // Mock Firestore error

        renderGuest()

        // Move to step 2 by entering a username and submitting
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'guestUser' } })
        fireEvent.click(screen.getByText('Submit'))

        // Select an icon and attempt to join as guest
        fireEvent.click(screen.getByTestId('bird-icon')) // Assuming a test ID for icon selection
        await act(async () => {
            fireEvent.click(screen.getByText('Join as Guest'))
        })

        // Verify the error message is displayed
        expect(screen.getByText('Firestore error')).toBeInTheDocument()
    })

    it('Displays error if username or icon is not selected', async () => {
        renderGuest()

        // Try to proceed without entering username
        fireEvent.click(screen.getByText('Submit'))
        expect(screen.getByText('Please enter your username')).toBeInTheDocument()

        // Enter username, but do not select icon
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'guestUser' } })
        fireEvent.click(screen.getByText('Submit'))
        fireEvent.click(screen.getByText('Join as Guest'))
        expect(screen.getByText('Please choose an icon and enter a username')).toBeInTheDocument()
    })

    it('Correctly sets icon selection state', () => {
        renderGuest()
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'guestUser' } })
        fireEvent.click(screen.getByText('Submit'))
        const dogIcon = screen.getByTestId('dog-icon') // Assuming a test ID for the Dog icon
        fireEvent.click(dogIcon)
        expect(dogIcon.className).toContain('selected')
    })

    it('Allows navigation back to username entry step', () => {
        renderGuest()
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'guestUser' } })
        fireEvent.click(screen.getByText('Submit'))
        fireEvent.click(screen.getByText('Back'))
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
    })

    it('Clears error messages on returning to the username entry step', () => {
        renderGuest()
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'guestUser' } })
        fireEvent.click(screen.getByText('Submit'))
        fireEvent.click(screen.getByText('Join as Guest'))
        expect(screen.getByText('Please choose an icon and enter a username')).toBeInTheDocument()
        
        fireEvent.click(screen.getByText('Back'))
        expect(screen.queryByText('Please choose an icon and enter a username')).not.toBeInTheDocument()
    })

    it('Navigates back to previous page when back button is clicked on first page', () => {
        renderGuest()
        fireEvent.click(screen.getByText('Back'))
        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
})
