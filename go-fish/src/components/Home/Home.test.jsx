import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { getDoc, doc, deleteDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { act } from 'react';
import Home from './Home';

// Mock Firebase modules
jest.mock('../config/firebase', () => ({
    auth: {
        currentUser: {
            uid: 'testUID' 
        }
    },
    db: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
    getDoc: jest.fn(),
    doc: jest.fn(),
    deleteDoc: jest.fn(),
    updateDoc: jest.fn(),
    arrayRemove: jest.fn()
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
    signOut: jest.fn()
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

describe('Home Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    const renderHome = () => {
        render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        );
    };

    // Testcase 1: Loading guest user data
    it('Loads guest user data correctly from localStorage', async () => {
        localStorage.setItem('authType', 'Guest');
        localStorage.setItem('username', 'testGuest');
        localStorage.setItem('logo', 'Dog');
        localStorage.setItem('guestId', 'guest-123');

        renderHome();

        expect(await screen.findByText('testGuest')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument(); // Default virtual currency
    });

    // Testcase 2: Load registered user data
    it('Loads registered user data correctly from Firestore', async () => {
        localStorage.setItem('authType', 'Login');
    
        const mockUserData = {
            username: 'ExampleUser',
            logo: 'Cat',
            virtualCurrency: 1000
        };
    
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => mockUserData
        });
    
        await act(async () => {
            renderHome();
        });
    
        await waitFor(() => {
            expect(screen.getByText(mockUserData.username)).toBeInTheDocument();
            expect(screen.getByText(mockUserData.virtualCurrency.toString())).toBeInTheDocument();
            expect(screen.getByTestId('user-logo')).toBeInTheDocument();
        }, { timeout: 5000 });
    
        expect(getDoc).toHaveBeenCalled();
    });

    // Testcase 3: Guest logout
    it('Handles guest logout correctly', async () => {
        localStorage.setItem('authType', 'Guest');
        localStorage.setItem('guestId', 'guest-123');

        renderHome();

        await act(async () => {
            fireEvent.click(screen.getByText('Logout'));
        });

        expect(deleteDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
        expect(localStorage.length).toBe(0);
    });

    // Testcase 4: Navigation to different pages
    it('Navigates to different pages correctly', () => {
        renderHome();

        fireEvent.click(screen.getByText('Friends'));
        expect(mockNavigate).toHaveBeenCalledWith('/Friends');

        fireEvent.click(screen.getByText('Messages'));
        expect(mockNavigate).toHaveBeenCalledWith('/Messages');

        fireEvent.click(screen.getByText('Shop'));
        expect(mockNavigate).toHaveBeenCalledWith('/shop');
    });

    // Testcase 5: Create Lobby dropdown
    it('Shows create lobby dropdown options', async () => {
        renderHome();

        fireEvent.click(screen.getByText('Create Lobby'));

        expect(screen.getByText('Public Lobby')).toBeInTheDocument();
        expect(screen.getByText('Private Lobby')).toBeInTheDocument();
    });

    // Testcase 6: Join Lobby dropdown
    it('Shows join lobby dropdown options', async () => {
        renderHome();

        fireEvent.click(screen.getByText('Join Lobby'));

        expect(screen.getByText('Join Public')).toBeInTheDocument();
        expect(screen.getByText('Join Private')).toBeInTheDocument();
    });

    // Testcase 7: Owner left message display
    it('Displays owner left message when present in localStorage', () => {
        localStorage.setItem('ownerLeftMessage', 'The lobby owner has left');
        
        renderHome();

        expect(screen.getByText('The lobby owner has left')).toBeInTheDocument();
        expect(localStorage.getItem('ownerLeftMessage')).toBeNull();
    });

    // Testcase 8: Support modal toggle
    it('Toggles support modal visibility', () => {
        renderHome();

        // Initially, support modal should not be visible
        expect(screen.queryByText('What do you need help with?')).not.toBeInTheDocument();

        // Click to open support
        fireEvent.click(screen.getByText('Admin Support'));
        
        // Check if support modal is now visible
        expect(screen.getByText('Admin Support')).toBeInTheDocument();

        // Close the support modal
        const closeButton = screen.getByRole('button', { name: 'Close' });
        fireEvent.click(closeButton);

        // Verify support modal is no longer visible
        expect(screen.queryByText('What do you need help with?')).not.toBeInTheDocument();
    });

    // Testcase 9: Dropdown closing on outside click
    it('Closes dropdowns when clicking outside', () => {
        renderHome();

        fireEvent.click(screen.getByText('Create Lobby'));
        expect(screen.getByText('Public Lobby')).toBeInTheDocument();

        fireEvent.click(document.body);
        expect(screen.queryByText('Public Lobby')).not.toBeInTheDocument();
    });
});