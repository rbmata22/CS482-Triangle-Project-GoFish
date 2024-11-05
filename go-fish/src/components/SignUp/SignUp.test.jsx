import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { getAuth, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import SignUp from './SignUp'

// Mock Firebase modules. Replicas of Firebase authentication functions to avoid real API calls and to track testing
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn(() => ({}))
}))

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn()
}))

jest.mock('../config/firebase', () => ({
    db: {}
}))

// Mock navigation
// Preserves real router functionality while mocking navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

describe('SignUp Component', () => {
    // Clears all mocks and localStorage before each test
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    // Creates a helper function to render the SignUp component consistently
    const renderSignUp = () => {
        render(
        <BrowserRouter>
            <SignUp />
        </BrowserRouter>
        )
    }

    describe('Initial Render', () => {
        it('Renders the signup form with email and password inputs', () => {
            renderSignUp()
            expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
            expect(screen.getByText('Sign Up with Google')).toBeInTheDocument()
        })
    })

    describe('Email Password SignUp Flow', () => {
        it('Moves to step 2 when email and password are provided', async () => {
        renderSignUp()
        
        const emailInput = screen.getByPlaceholderText('Email')
        const passwordInput = screen.getByPlaceholderText('Password')
        
        fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        
        fireEvent.click(screen.getByText('Submit'))
        
        await waitFor(() => {
            expect(screen.getByText('Enter Username and Select Your Icon')).toBeInTheDocument()
        })
        })

        it('Shows error when trying to proceed without email or password', () => {
        renderSignUp()
        
        fireEvent.click(screen.getByText('Submit'))
        
        expect(screen.getByText('Please enter your email and password')).toBeInTheDocument()
        })

        it('Shows error when trying to create account without username', async () => {
            renderSignUp()
            
            // Move to step 2
            fireEvent.change(screen.getByPlaceholderText('Email'), { 
            target: { value: 'test@test.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('Password'), { 
            target: { value: 'password123' }
            })
            fireEvent.click(screen.getByText('Submit'))
            
            // Select logo but no username
            await waitFor(() => {
            const catLogo = screen.getByTestId('cat-icon')
            fireEvent.click(catLogo)
            })
            
            // Try to create account
            fireEvent.click(screen.getByText('Create Account'))
            
            expect(screen.getByText('Please choose a logo and enter a username')).toBeInTheDocument()
            expect(createUserWithEmailAndPassword).not.toHaveBeenCalled()
            expect(setDoc).not.toHaveBeenCalled()
        })

        it('Completes signup process with valid information', async () => {
        const mockUser = { uid: 'testuid123' }
        createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser })
        setDoc.mockResolvedValue()
        
        renderSignUp()
        
        // Step 1: Email and password
        fireEvent.change(screen.getByPlaceholderText('Email'), { 
            target: { value: 'test@test.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Password'), { 
            target: { value: 'password123' }
        })
        fireEvent.click(screen.getByText('Submit'))
        
        // Step 2: Username and logo
        await waitFor(() => {
            fireEvent.change(screen.getByPlaceholderText('Username'), {
            target: { value: 'testuser' }
            })
        })
        
        // Click the Cat logo
        const catLogo = screen.getByTestId('cat-icon')
        fireEvent.click(catLogo)
        
        // Create account
        fireEvent.click(screen.getByText('Create Account'))
        
        await waitFor(() => {
            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            'test@test.com',
            'password123'
            )
            expect(setDoc).toHaveBeenCalledTimes(2)
            expect(mockNavigate).toHaveBeenCalledWith('/home')
            expect(localStorage.getItem('authType')).toBe('SignUp')
        })
        })
    })

    it('Redirects existing Google users to home', async () => {
        const mockUser = { uid: 'existinggoogleuid123' }
        signInWithPopup.mockResolvedValue({ user: mockUser })
        getDoc.mockResolvedValue({ exists: () => true })
        
        renderSignUp()
        
        fireEvent.click(screen.getByText('Sign Up with Google'))
        
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/home')
        })
    })

    it('Handles Google signup error', async () => {
        signInWithPopup.mockRejectedValue(new Error('Google signup failed'))
        
        renderSignUp()
        
        fireEvent.click(screen.getByText('Sign Up with Google'))
        
        await waitFor(() => {
            expect(screen.getByText('Failed to sign up with Google: Google signup failed')).toBeInTheDocument()
        })
    })
})


describe('Navigation', () => {
    // Clears all mocks and localStorage before each test
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    const renderSignUp = () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        )
    }

    it('Goes back when back button is clicked', () => {
        renderSignUp()

        fireEvent.click(screen.getByText('Back'))

        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('Returns to step 1 when back button is clicked in step 2', async () => {
        renderSignUp()
        
        // Move to step 2
        fireEvent.change(screen.getByPlaceholderText('Email'), { 
        target: { value: 'test@test.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Password'), { 
        target: { value: 'password123' }
        })
        fireEvent.click(screen.getByText('Submit'))
        
        // Click back in step 2
        await waitFor(() => {
        fireEvent.click(screen.getByText('Back'))
        })
        
        expect(screen.getByText('Sign Up with Google')).toBeInTheDocument()
    })
})