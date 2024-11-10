/* eslint-disable no-undef */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import {  createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { setDoc,  getDoc,  } from 'firebase/firestore'
import SignUp from './SignUp'

// Mock Firebase modules and functions for testing
jest.mock('../config/firebase', () => ({
    auth: {},
    db: {},
    provider: {}
}))

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn(() => ({}))
}))

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    serverTimestamp: jest.fn(),
}))

// Mock navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

describe('SignUp Component', () => {
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

    const moveToStepTwo = () => {
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
        fireEvent.click(screen.getByText('Submit'))
    }

    it('Shows error when username is empty', async () => {
        renderSignUp()
        moveToStepTwo()
        fireEvent.click(screen.getByTestId('dog-icon'))
        fireEvent.click(screen.getByText('Create Account'))
        expect(screen.getByText('Please choose a logo and enter a username')).toBeInTheDocument()
    })

    it('Shows error when logo is not selected', async () => {
        renderSignUp()
        moveToStepTwo()
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'kobe24' } })
        fireEvent.click(screen.getByText('Create Account'))
        expect(screen.getByText('Please choose a logo and enter a username')).toBeInTheDocument()
    })

    it('Shows error when email and password are empty', () => {
        renderSignUp()
        fireEvent.click(screen.getByText('Submit'))
        expect(screen.getByText('Please enter your email and password')).toBeInTheDocument()
    })

    it('Shows error for invalid email format', async () => {
        renderSignUp()
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'spongebob' } })
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'squarepants' } })
        await act(async () => {
            fireEvent.click(screen.getByText('Submit'))
        })
        expect(await screen.findByText('Invalid email')).toBeInTheDocument()
    })

    it('Allows logo selection and updates state', () => {
        renderSignUp()
        moveToStepTwo()
        const dogIcon = screen.getByTestId('dog-icon')
        fireEvent.click(dogIcon)
        expect(dogIcon.className).toContain('selected')
    })

    it('Successfully creates a new user in the database with valid credentials', async () => {
        const mockUser = { uid: 'test-uid' }
        createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser })
        setDoc.mockResolvedValueOnce()

        renderSignUp()
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'spongebob@krustykrab.com' } })
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'hello123' } })
        fireEvent.click(screen.getByText('Submit'))
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'spongebobmeboy' } })
        fireEvent.click(screen.getByTestId('bot-icon'))
        await act(async () => {
            fireEvent.click(screen.getByText('Create Account'))
        })

        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(undefined, 'spongebob@krustykrab.com', 'hello123')
        expect(setDoc).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/home')
    })

    it('Shows error message if sign up with Google fails', async () => {
        signInWithPopup.mockRejectedValueOnce(new Error('Google signup failed'))
        renderSignUp()
        fireEvent.click(screen.getByText('Sign Up with Google'))
        await waitFor(() => expect(screen.getByText('Failed to sign up with Google: Google signup failed')).toBeInTheDocument())
    })

    it('Prompts for username and logo after Google sign up for new user', async () => {
        const mockUser = { user: { uid: 'google-uid' } }
        signInWithPopup.mockResolvedValueOnce(mockUser)
        getDoc.mockResolvedValueOnce({ exists: () => false })
        renderSignUp()
        fireEvent.click(screen.getByText('Sign Up with Google'))
        await waitFor(() => expect(screen.getByText('Enter Username and Select Your Icon')).toBeInTheDocument())
    })

    it('Returns to previous page during email/password signup', () => {
        renderSignUp()
        moveToStepTwo()
        fireEvent.click(screen.getByText('Back'))
        expect(screen.getByText('Sign Up with Google')).toBeInTheDocument()
    })

    it('Navigates back to login when back button is clicked on first page', () => {
        renderSignUp()
        fireEvent.click(screen.getByText('Back'))
        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('Proceeds directly to home if Google user already exists in Firestore', async () => {
        const mockUser = { user: { uid: 'existing-google-uid' } }
        signInWithPopup.mockResolvedValueOnce(mockUser)
        getDoc.mockResolvedValueOnce({ exists: () => true })
        renderSignUp()
        fireEvent.click(screen.getByText('Sign Up with Google'))
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'))
    })

    it('Clears error messages on new form submission', async () => {
        renderSignUp()
        fireEvent.click(screen.getByText('Submit'))
        expect(screen.getByText('Please enter your email and password')).toBeInTheDocument()
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
        fireEvent.click(screen.getByText('Submit'))
        expect(screen.queryByText('Please enter your email and password')).not.toBeInTheDocument()
    })
})
