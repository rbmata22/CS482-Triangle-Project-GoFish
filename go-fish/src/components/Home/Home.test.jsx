import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { act } from 'react';
import Home from './Home';

jest.mock('../config/firebase', () => ({
    auth: {
        currentUser: { uid: 'testUID' }
    },
    db: {}
}));

jest.mock('firebase/firestore', () => ({
    getDoc: jest.fn(),
    doc: jest.fn(),
    deleteDoc: jest.fn(),
    updateDoc: jest.fn()
}));

jest.mock('firebase/auth', () => ({
    signOut: jest.fn()
}));

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

    it('Loads guest or registered user data correctly and displays currency', async () => {
        const testCases = [
            {
                authType: 'Guest',
                localStorageData: {
                    username: 'testGuest',
                    logo: 'Dog',
                    guestId: 'guest-123',
                    guestCurrency: '750'
                },
                firestoreData: null,
                expectedCurrency: '750'
            },
            {
                authType: 'Login',
                localStorageData: null,
                firestoreData: {
                    username: 'ExampleUser',
                    logo: 'Cat',
                    virtualCurrency: 1000
                },
                expectedCurrency: '1000'
            }
        ];

        for (const testCase of testCases) {
            if (testCase.authType === 'Guest') {
                localStorage.setItem('authType', 'Guest');
                localStorage.setItem('username', testCase.localStorageData.username);
                localStorage.setItem('logo', testCase.localStorageData.logo);
                localStorage.setItem('guestId', testCase.localStorageData.guestId);
                localStorage.setItem('guestCurrency', testCase.localStorageData.guestCurrency);
                getDoc.mockResolvedValueOnce({ exists: () => false });
            } else {
                localStorage.setItem('authType', 'Login');
                getDoc.mockResolvedValueOnce({
                    exists: () => true,
                    data: () => testCase.firestoreData
                });
            }

            renderHome();
            await waitFor(() => {
                expect(screen.getByText(testCase.expectedCurrency)).toBeInTheDocument();
            });
            jest.clearAllMocks();
        }
    });

    it('Handles logout and navigation for guest and registered users', async () => {
        const testCases = [
            { authType: 'Guest', expectDelete: true },
            { authType: 'Login', expectDelete: false }
        ];

        for (const testCase of testCases) {
            localStorage.setItem('authType', testCase.authType);
            if (testCase.authType === 'Guest') {
                localStorage.setItem('guestId', 'guest-123');
            }

            renderHome();
            await act(async () => fireEvent.click(screen.getByText('Logout')));

            expect(mockNavigate).toHaveBeenCalledWith('/');
            if (testCase.expectDelete) {
                expect(deleteDoc).toHaveBeenCalled();
            }
            expect(signOut).toHaveBeenCalled();
            jest.clearAllMocks();
        }
    });

    it('Handles navigation to Friends, Messages, and Shop', () => {
        renderHome();
        const navItems = [
            { label: 'Friends', path: '/Friends' },
            { label: 'Messages', path: '/Messages' },
            { label: 'Shop', path: '/shop' }
        ];

        navItems.forEach(({ label, path }) => {
            fireEvent.click(screen.getByText(label));
            expect(mockNavigate).toHaveBeenCalledWith(path);
        });
    });

    it('Displays dropdowns and closes on outside click', () => {
        renderHome();

        const dropdowns = [
            { label: 'Create Lobby', options: ['Public Lobby', 'Private Lobby'] },
            { label: 'Join Lobby', options: ['Join Public', 'Join Private'] }
        ];

        dropdowns.forEach(({ label, options }) => {
            fireEvent.click(screen.getByText(label));
            options.forEach(option => {
                expect(screen.getByText(option)).toBeInTheDocument();
            });

            fireEvent.click(document.body);
            options.forEach(option => {
                expect(screen.queryByText(option)).not.toBeInTheDocument();
            });
        });
    });

    it('Displays and hides support model on Admin Support click', () => {
        renderHome();

        fireEvent.click(screen.getByText('Admin Support'));
        expect(screen.getByText('What do you need help with?')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(screen.queryByText('What do you need help with?')).not.toBeInTheDocument();
    });

    it('Updates user icon for both guest and registered users', async () => {
        const testCases = [
            {
                authType: 'Guest',
                initialIcon: 'Dog',
                newIcon: 'Bot',
                updateDocCalled: false
            },
            {
                authType: 'Login',
                initialIcon: 'Cat',
                newIcon: 'Bird',
                updateDocCalled: true
            }
        ];

        for (const { authType, initialIcon, newIcon, updateDocCalled } of testCases) {
            localStorage.setItem('authType', authType);
            if (authType === 'Guest') {
                localStorage.setItem('logo', initialIcon);
            } else {
                getDoc.mockResolvedValueOnce({
                    exists: () => true,
                    data: () => ({ logo: initialIcon })
                });
            }

            renderHome();
            fireEvent.click(screen.getByTestId('user-logo'));
            fireEvent.click(screen.getByText('Change Icon'));
            fireEvent.click(screen.getByText(newIcon));

            expect(screen.getByTestId('user-logo')).toHaveClass('user-logo');
            if (updateDocCalled) {
                expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), { logo: newIcon });
            } else {
                expect(localStorage.getItem('logo')).toBe(newIcon);
            }

            jest.clearAllMocks();
        }
    });

    it('Displays owner left message and removes it from localStorage', () => {
        localStorage.setItem('ownerLeftMessage', 'The lobby owner has left');
        renderHome();

        expect(screen.getByText('The lobby owner has left')).toBeInTheDocument();
        expect(localStorage.getItem('ownerLeftMessage')).toBeNull();
    });

    it('Handles fetch errors gracefully for guest and registered users', async () => {
        const testCases = [
            { authType: 'Guest', errorMessage: 'Error fetching guest data' },
            { authType: 'Login', errorMessage: 'Error loading user data' }
        ];

        for (const { authType, errorMessage } of testCases) {
            localStorage.setItem('authType', authType);
            getDoc.mockRejectedValueOnce(new Error('Firestore fetch failed'));

            renderHome();

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            jest.clearAllMocks();
        }
    });
});
