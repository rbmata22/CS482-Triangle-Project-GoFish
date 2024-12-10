import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import SignUp from './SignUp'
import { act } from 'react'

/* 
*  Mock Firebase modules and functions for testing 
*  
*  - No real Firebase calls are made to ensure database is not tampered with
*  - Easier verification of exactly how the Firebase functions were called
*  - Mock Firebase means that we can test error handling
*/
// Mock the entire firebase.js config file
jest.mock('../config/firebase', () => ({
    auth: {},
    db: {},
    provider: {}
}))

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn(() => ({}))
}))

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    getFirestore: jest.fn()
}))

// Mock react-router-dom navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

// Testcases for signing up
describe('SignUp Component', () => {
    // Clearing each mock Jest and local storage before each testcase
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

    // Helper function to move to next step in signup process
    const moveToStepTwo = () => {
        fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' }
        })
        fireEvent.click(screen.getByText('Submit'))
    }

    // Testcase 1: User doesn't input a username
    it('Shows error when username is empty', async () => {
        renderSignUp()
        moveToStepTwo()
        
        // Select a logo but leave username empty
        fireEvent.click(screen.getByTestId('dog-icon'))
        fireEvent.click(screen.getByText('Create Account'))
        
        expect(screen.getByText('Please choose a logo and enter a username')).toBeInTheDocument()
    })

    // Testcase 2: User inputs username but no logo
    it('Shows error when logo is not selected', async () => {
        renderSignUp()
        moveToStepTwo()
        
        // Enter username but don't select logo
        fireEvent.change(screen.getByPlaceholderText('Username'), {
        target: { value: 'kobe24' }
        })
        fireEvent.click(screen.getByText('Create Account'))
        
        expect(screen.getByText('Please choose a logo and enter a username')).toBeInTheDocument()
    })

    // Testcase 3: No Email and password
    it('Shows error when email and password are empty', () => {
        renderSignUp()
        fireEvent.click(screen.getByText('Submit'))
        
        expect(screen.getByText('Please enter your email and password')).toBeInTheDocument()
    })

    // Testcase 4: Email with no '@' symbol
    it('Shows error for invalid email format', async () => {
        // Reset mock before setting up new mock implementation
        createUserWithEmailAndPassword.mockReset();

        // Set up the mock rejection BEFORE rendering and interactions
        createUserWithEmailAndPassword.mockRejectedValue(new Error('Invalid email'));
        
        renderSignUp();
        
        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: { value: 'spongebob' }
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'squarepants' }
        });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Submit'));
        });
        
        expect(await screen.findByText('Invalid email')).toBeInTheDocument();
    });

    // Testcase 5: Allows for selection of logo
    it('Allows logo selection and updates state', () => {
        renderSignUp()
        moveToStepTwo()
        
        const dogIcon = screen.getByTestId('dog-icon')
        fireEvent.click(dogIcon)
        
        expect(dogIcon.className).toContain('selected')
    })

    // Testcase 6: Signing up using email and password
    it('Successfully creates a new user in the database with valid credentials', async () => {
        // Reset all mocks and their implementations
        jest.resetAllMocks();
        
        // Mock the Firebase auth response with a specific UID
        const mockUser = { uid: 'test-uid' };
        createUserWithEmailAndPassword.mockResolvedValue({
            user: mockUser
        });
    
        // Create mock implementations for setDoc to capture the data
        let capturedUserData = null;
        let capturedUserMessages = null;
        const setDocPromises = [];
        
        setDoc.mockImplementation((docRef, data) => {
            const promise = new Promise(resolve => {
                if (docRef.id === 'test-uid') {
                    if (capturedUserData === null) {
                        capturedUserData = data;
                    } else {
                        capturedUserMessages = data;
                    }
                }
                resolve();
            });
            setDocPromises.push(promise);
            return promise;
        });
        
        // Mock the doc function
        doc.mockReturnValue({ id: 'test-uid' });
        
        renderSignUp();
        
        // Fill in email and password
        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: { value: 'spongebob@krustykrab.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'hello123' }
        });
        
        // Wait for the submit button to be clicked
        await act(async () => {
            fireEvent.click(screen.getByText('Submit'));
        });
        
        // Fill in username and select logo
        fireEvent.change(screen.getByPlaceholderText('Username'), {
            target: { value: 'spongebobmeboy' }
        });
        fireEvent.click(screen.getByTestId('bot-icon'));
        
        // Create account and wait for all promises to resolve
        await act(async () => {
            fireEvent.click(screen.getByText('Create Account'));
            await Promise.all([
                createUserWithEmailAndPassword.mock.results[0].value,
                ...setDocPromises
            ]);
        });
        
        // Verify authentication was called with correct credentials
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            undefined,
            'spongebob@krustykrab.com',
            'hello123'
        );
    
        // Verify the document reference was created with the correct user ID for both collections
        expect(doc).toHaveBeenCalledTimes(2);
        expect(doc).toHaveBeenNthCalledWith(1, expect.anything(), 'Users', 'test-uid');
        expect(doc).toHaveBeenNthCalledWith(2, expect.anything(), 'UserMessages', 'test-uid');
        
        // Verify the captured user data contains all required fields
        expect(capturedUserData).toEqual({
            username: 'spongebobmeboy',
            logo: expect.any(String),
            emailAccount: true,
            googleAccount: false,
            virtualCurrency: 500,
            friends: [],
            gamesPlayed: 0,
            gamesWon: 0,
        });
    
        // Verify the captured user messages data
        expect(capturedUserMessages).toEqual({
            messages: [],
        });
    });


    // Testcase 7: Signing up using Google
    it('Prompts for username and logo after Google sign up', async () => {
        const { signInWithPopup } = require('firebase/auth')
        const { getDoc } = require('firebase/firestore')

        signInWithPopup.mockResolvedValueOnce({
        user: { uid: 'google-uid' }
        })
        getDoc.mockResolvedValueOnce({ exists: () => false })
        
        renderSignUp()
        
        fireEvent.click(screen.getByText('Sign Up with Google'))
        
        await waitFor(() => {
        expect(screen.getByText('Enter Username and Select Your Icon')).toBeInTheDocument()
        })
    })

    // Testcase 8: Returning to login/signup during registration
    it('Returns to opening page when back button is clicked', () => {
        renderSignUp()
        
        const backButton = screen.getByText('Back')
        fireEvent.click(backButton)
        
        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    // Testcase 9: Returns to previous page during email/password signup
    it('Returns to first page when back is clicked after submitting email and password', () => {
        renderSignUp()
        
        // Move to next step in account registration
        fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@testing.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'testtest' }
        })
        fireEvent.click(screen.getByText('Submit'))
        
        // Click back button
        fireEvent.click(screen.getByText('Back'))
        
        // Verify we're back at the first page we started with
        expect(screen.getByText('Sign Up with Google')).toBeInTheDocument()
    })
})
