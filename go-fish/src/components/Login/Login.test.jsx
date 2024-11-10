import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import Login from './Login';
import { act } from 'react';

// Mock Firebase modules and functions to isolate the tests from external dependencies
jest.mock('../config/firebase', () => ({
    auth: {},
    db: {}
}));

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})), // Mock getAuth to return an empty object
    signInWithEmailAndPassword: jest.fn(), // Mock signInWithEmailAndPassword to simulate user login
    signInWithPopup: jest.fn(), // Mock signInWithPopup to simulate login with Google
    GoogleAuthProvider: jest.fn(() => ({})) // Mock GoogleAuthProvider
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(), // Mock doc function
    getDoc: jest.fn(), // Mock getDoc to simulate fetching documents
    setDoc: jest.fn() // Mock setDoc to simulate setting documents
}));

const mockNavigate = jest.fn(); // Mock navigation function
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    const renderLogin = () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
    };

    it('Shows error when email and password are empty', () => {
        // Input: Empty email and password
        // Expected Output: Display an error message
        renderLogin();
        fireEvent.click(screen.getByTestId('login-button'));
        expect(screen.getByTestId('error-message').textContent).toBe('Please enter your email and password');
    });

    it('Shows error for invalid email format', () => {
        // Input: Invalid email and valid password
        // Expected Output: Display an error message for invalid email format
        renderLogin();
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalidEmail' } });
        fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByTestId('login-button'));
        expect(screen.getByTestId('error-message').textContent).toBe('Please enter a valid email address');
    });

    it('Shows error when password is too short', () => {
        
        // Input: Valid email and too short password
        // Expected Output: Display an error message for short password
        renderLogin();
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('password-input'), { target: { value: '123' } });
        fireEvent.click(screen.getByTestId('login-button'));
        expect(screen.getByTestId('error-message').textContent).toBe('Password must be at least 6 characters');
    });

    it('Successfully logs in with valid credentials', async () => {

        // Input: Valid email and password
        // Expected Output: Navigate to home page and store user data in localStorage
        const mockUser = { uid: 'test-uid' };
        signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

        const mockUserData = { username: 'testuser', logo: 'dog', virtualCurrency: 500, gamesPlayed: 10, gamesWon: 5 };
        getDoc.mockResolvedValueOnce({ exists: () => true, data: () => mockUserData });

        renderLogin();
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });

        await act(async () => {
            fireEvent.click(screen.getByTestId('login-button'));
        });

        expect(mockNavigate).toHaveBeenCalledWith('/home');
        expect(localStorage.getItem('username')).toBe('testuser');
    });

    it('Displays error for invalid login credentials', async () => {

        // Input: Valid email and wrong password
        // Expected Output: Display an error message for invalid credentials
        signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid login credentials'));

        renderLogin();
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrongpassword' } });

        await act(async () => {
            fireEvent.click(screen.getByTestId('login-button'));
        });

        expect(screen.getByTestId('error-message').textContent).toBe('Invalid login credentials');
    });

    it('Successfully logs in with Google and proceeds to home for existing user', async () => {

        // Input: Google sign-in for an existing user
        // Expected Output: Navigate to home page and store user data in localStorage
        const mockUser = { uid: 'google-uid' };
        signInWithPopup.mockResolvedValueOnce({ user: mockUser });

        const mockUserData = { username: 'googleuser', logo: 'ghost', virtualCurrency: 300 };
        getDoc.mockResolvedValueOnce({ exists: () => true, data: () => mockUserData });

        renderLogin();

        await act(async () => {
            fireEvent.click(screen.getByTestId('google-login-button'));
        });

        expect(mockNavigate).toHaveBeenCalledWith('/home');
        expect(localStorage.getItem('username')).toBe('googleuser');
    });

    it('Proceeds to profile creation for new Google user', async () => {

        // Input: Google sign-in for a new user
        // Expected Output: Display username and icon input for new user profile setup
        const mockUser = { uid: 'new-google-uid' };
        signInWithPopup.mockResolvedValueOnce({ user: mockUser });

        getDoc.mockResolvedValueOnce({ exists: () => false });

        renderLogin();

        await act(async () => {
            fireEvent.click(screen.getByTestId('google-login-button'));
        });

        expect(screen.getByTestId('username-input')).toBeInTheDocument();
        expect(screen.getByTestId('icon-container')).toBeInTheDocument();
    });

    it('Shows error if username and logo are not selected for new Google user', () => {

        // Input: Attempt to complete profile without selecting username and logo
        // Expected Output: Display error message
        renderLogin();
        fireEvent.click(screen.getByTestId('google-login-button'));
        fireEvent.click(screen.getByTestId('complete-profile-button'));

        expect(screen.getByTestId('error-message').textContent).toBe('Please choose a logo and enter a username');
    });

    it('Successfully completes profile creation for new Google user', async () => {

        // Input: Username and logo selection for new Google user
        // Expected Output: Navigate to home page and store new user data in localStorage
        const mockUser = { uid: 'new-google-uid' };
        signInWithPopup.mockResolvedValueOnce({ user: mockUser });
        getDoc.mockResolvedValueOnce({ exists: () => false });
        setDoc.mockResolvedValueOnce();

        renderLogin();
        
        await act(async () => {
            fireEvent.click(screen.getByTestId('google-login-button'));
        });

        fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'newGoogleUser' } });
        fireEvent.click(screen.getByTestId('dog-icon')); // Select the dog icon

        await act(async () => {
            fireEvent.click(screen.getByTestId('complete-profile-button'));
        });

        expect(mockNavigate).toHaveBeenCalledWith('/home');
        expect(localStorage.getItem('username')).toBe('newGoogleUser');
        expect(localStorage.getItem('logo')).toBe('Dog');
    });
});
