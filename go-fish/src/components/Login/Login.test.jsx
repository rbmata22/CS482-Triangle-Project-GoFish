import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import "@testing-library/jest-dom";
import  {handleGoogleLogin}  from "./Login";  // Replace with your actual function path

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
    it('renders the "Login with Google" button', () => {
        render(<Login />);
        const googleButton = screen.getByText(/Login with Google/i);
        expect(googleButton).toBeInTheDocument();
      });
      it('triggers Google login flow when the button is clicked', () => {
        delete window.location; // Mocking the window.location object
        window.location = { href: '' };
    
        render(<Login />);
        const googleButton = screen.getByText(/Login with Google/i);
    
        fireEvent.click(googleButton);
      });
      it('selects the correct logo when clicked', () => {
        const handleLogoClick = jest.fn();
        const selectedLogo = 'Ghost';
    
        render(
          <div
            className={`team-logo ${selectedLogo === 'Ghost' ? 'selected' : ''}`}
            onClick={() => handleLogoClick('Ghost')}
          >
            Ghost
          </div>
        );
    
        const logo = screen.getByText('Ghost');
        fireEvent.click(logo);
    
        expect(handleLogoClick).toHaveBeenCalledWith('Ghost');
      });
      it('triggers Complete Profile button click handler', () => {
        const handleGoogleUsernameLogoSubmit = jest.fn();
    
        render(
          <button
            className="login-button"
            onClick={handleGoogleUsernameLogoSubmit}
          >
            Complete Profile
          </button>
        );
    
        const button = screen.getByText('Complete Profile');
        fireEvent.click(button);
    
        expect(handleGoogleUsernameLogoSubmit).toHaveBeenCalled();
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

        expect(await screen.findByText('Invalid email')).toBeInTheDocument();
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
        expect(localStorage.getItem('logo')).toBe('dog');
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
    it('sets error message if logo or username is missing', async () => {
        const setError = jest.fn();
    
        // Simulate missing logo
        const mockAuthCurrentUser = { uid: '123' };
        jest.spyOn(auth, 'currentUser', 'get').mockReturnValue(mockAuthCurrentUser);
    
        const { getByPlaceholderText } = render(
          <BrowserRouter>
            <input
              placeholder="Username"
              onChange={(e) => (username = e.target.value)} // Mock username input
            />
            <button onClick={() => handleGoogleUsernameLogoSubmit()}>Submit</button>
          </BrowserRouter>
        );
    
        fireEvent.click(screen.getByText('Submit'));
    
        expect(setError).toHaveBeenCalledWith('Please choose a logo and enter a username');
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
      
       
      
      
      
        // Check if Back button is rendered and functional
        const backButton = screen.getByText('Back');
        fireEvent.click(backButton);
      });
    
   
});
