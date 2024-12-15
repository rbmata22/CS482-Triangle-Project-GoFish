import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import "@testing-library/jest-dom";
import  handleGoogleLogin  from "./Login.jsx";  // Replace with your actual function path

import { BrowserRouter, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';

import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import Login from './Login';
import { act } from 'react';

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
    db: {}
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})),
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn(() => ({}))
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    getFirestore: jest.fn()
}));

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
const mockSetError = jest.fn();
const mockSetIsGoogleUser = jest.fn();
const mockSetStep = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Testcases for logging into an existing account
describe('Login Component', () => {
    // Clearing each mock Jest and local storage before each testcase
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
    it('should log the user in and redirect to home if user exists', async () => {
        const mockUser = { uid: 'user123', email: 'testuser@gmail.com' };
        const mockUserDoc = { exists: () => true, data: () => ({ username: 'testuser', logo: 'logo_url' }) };
    
        signInWithPopup.mockResolvedValueOnce({ user: mockUser });
        getDoc.mockResolvedValueOnce(mockUserDoc);  // Simulate user doc exists
    
        // Simulate calling handleGoogleLogin
        await handleGoogleLogin({
          auth: {}, 
          googleProvider: {}, 
          navigate: mockNavigate, 
          setError: mockSetError, 
          setIsGoogleUser: mockSetIsGoogleUser, 
          setStep: mockSetStep,
        });
    
        // Check that user data was saved in localStorage
        expect(localStorage.setItem).toHaveBeenCalledWith('authType', 'Login');
        expect(localStorage.setItem).toHaveBeenCalledWith('username', 'testuser');
        expect(localStorage.setItem).toHaveBeenCalledWith('logo', 'logo_url');
    
        // Check if navigation to home page was triggered
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    
    // Testcase 1: No email and password
    it('Shows error when email and password are empty', () => {
        renderLogin();
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        expect(screen.getByText('Please enter email and password')).toBeInTheDocument();
    });

    // Testcase 2: Invalid email format
    it('Shows error for invalid email format', async () => {
        renderLogin();
        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: { value: 'InvalidEmail' }
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' }
        });

        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Testcase 3: Password too short
    it('Shows error when password is too short', async () => {
        renderLogin();
        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: '123' }
        });

        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    // Testcase 4: Successful login with email and password
    it('Successfully logs in with valid credentials', async () => {
        // Mock the user object returned by Firebase authentication, as well as the function to sign in
        const mockAuthUser = { uid: 'test-uid' };
        signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockAuthUser });

        // Mock the user document that would be retrieved from Firestore
        const mockUserDoc = {
            exists: () => true,
            data: () => ({ username: 'testuser', logo: 'dog' })
        };
        getDoc.mockResolvedValueOnce(mockUserDoc);

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' }
        });

        // Wrap this in act() and make it async because it triggers state updates
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Login' }));
        });

        // Assert that user is directed to home page after logging in and correct values were stored in localStorage
        expect(mockNavigate).toHaveBeenCalledWith('/home');
        expect(localStorage.getItem('authType')).toBe('Login');
        expect(localStorage.getItem('username')).toBe('testuser');
        expect(localStorage.getItem('logo')).toBe('logo_url');
    });

    // Testcase 5: Invalid login credentials
    it('Displays error for invalid login credentials', async () => {
        // Error for invalid login credentials pre-input (before user inputs login to compare with actual output)
        signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid login credentials'));

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText('Email'), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'wrongpassword' }
        });

        // Wrap this in act() and make it async because it triggers state updates
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Login' }));
        });

        expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    });
    it('renders username input', () => {
        // Mock data for selectedLogo and username
        const selectedLogo = 'Cat';
        const setUsername = jest.fn();
        const setStep = jest.fn();
        const handleLogoClick = jest.fn();
        const handleGoogleUsernameLogoSubmit = jest.fn();
      
        render(
          <Login 
            selectedLogo={selectedLogo} 
            setUsername={setUsername} 
            setStep={setStep} 
            handleLogoClick={handleLogoClick} 
            handleGoogleUsernameLogoSubmit={handleGoogleUsernameLogoSubmit}
          />
        );
      
        // Check if the title is rendered
      
        // Check if error message is rendered when error exists
        
      
        // Check if username input is rendered and can be typed into
        const usernameInput = screen.getByPlaceholderText('Email');
        fireEvent.change(usernameInput, { target: { value: 'Test User' } });
        expect(usernameInput.value).toBe('Test User');
      
        // Check if team logos are rendered correctly
       
       
        // Simulate clicking a logo
       
      
      
      
        // Check if Back button is rendered and functional
        const backButton = screen.getByText('Back');
        fireEvent.click(backButton);
      });
    
   
});
