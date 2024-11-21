/* eslint-disable no-undef */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Lobby from './Lobby';
import { onSnapshot, updateDoc, deleteDoc, arrayUnion, getDoc } from 'firebase/firestore';

// Mock Firebase functions and modules
jest.mock('../../config/firebase', () => ({
    auth: { currentUser: { uid: 'test-user-id' } },
    db: {}
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    onSnapshot: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDoc: jest.fn(),
    arrayUnion: jest.fn()
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({ lobbyId: 'test-lobby-id' })
}));

describe('Lobby Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    const mockLobbyData = {
        lobbyType: 'public',
        playerLimit: 4,
        players: [
            { username: 'Player1', logo: 'Cat', isReady: true, betAmount: 100 },
            { username: 'Player2', logo: 'Dog', isReady: false }
        ],
        useAI: false,
        owner: 'Player1',
        lobbyCode: '12345',
        bettingTotal: 100
    };

    const mockUserData = {
        username: 'Player1',
        logo: 'Cat',
        virtualCurrency: 1000,
        isReady: false
    };

    const setupSnapshotMock = (data = mockLobbyData) => {
        onSnapshot.mockImplementation((_, callback) => {
            callback({ exists: () => true, data: () => data });
            return jest.fn();
        });
    };

    const setupUserDocMock = (data = mockUserData) => {
        getDoc.mockImplementationOnce(() => Promise.resolve({
            exists: () => true,
            data: () => data
        }));
    };

    // Basic Rendering Tests
   

    it('renders lobby with all components when data is loaded', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);
        
        await waitFor(() => {
            expect(screen.getByText("Player1's Lobby")).toBeInTheDocument();
        });
    });

    

    it('handles guest user data correctly', async () => {
        localStorage.setItem('authType', 'Guest');
        localStorage.setItem('username', 'GuestUser');
        localStorage.setItem('logo', 'Ghost');
        localStorage.setItem('guestId', 'guest-123');

        setupSnapshotMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            expect(screen.getByText('GuestUser')).toBeInTheDocument();
            expect(screen.getByText('500')).toBeInTheDocument(); // default guest currency
        });
    });

    // Betting System Tests
    it('opens bet popup when "Place Bet" button is clicked', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            fireEvent.click(screen.getByTestId('open bet menu'));
            expect(screen.getByText('Place Your Bet')).toBeInTheDocument();
        });
    });

    it('handles valid bet placement', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            fireEvent.click(screen.getByTestId('open bet menu'));
        });

        const betInput = screen.getByPlaceholderText('Enter bet amount');
        fireEvent.change(betInput, { target: { value: '100' } });
        fireEvent.click(screen.getByTestId("placing bet button"));

        
    });

   


    // Game Start Tests
    it('starts game when all players are ready and bets are placed', async () => {
        setupSnapshotMock({
            ...mockLobbyData,
            players: [
                { username: 'Player1', logo: 'Cat', isReady: true, betAmount: 100 },
                { username: 'Player2', logo: 'Dog', isReady: true, betAmount: 100 }
            ]
        });
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            const goFishButton = screen.getByText('GO FISH!');
            expect(goFishButton).not.toBeDisabled();
            fireEvent.click(goFishButton);
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            '/lobby/test-lobby-id/game',
            expect.objectContaining({
                state: expect.objectContaining({
                    lobbyId: 'test-lobby-id',
                    bettingTotal: expect.any(Number)
                })
            })
        );
    });

    // Lobby Management Tests
    

    it('handles non-owner leaving lobby', async () => {
        setupSnapshotMock({
            ...mockLobbyData,
            owner: 'OtherPlayer'
        });
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            fireEvent.click(screen.getByText('Leave Lobby'));
        });

        expect(deleteDoc).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    // Private Lobby Tests
    it('displays lobby code for private lobbies', async () => {
        setupSnapshotMock({
            ...mockLobbyData,
            lobbyType: 'private'
        });
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            expect(screen.getByText('Login Code:')).toBeInTheDocument();
            expect(screen.getByText('12345')).toBeInTheDocument();
        });
    });

    // Error Handling Tests
    it('handles error when fetching user data', async () => {
        getDoc.mockImplementationOnce(() => Promise.reject(new Error('Fetch error')));
        setupSnapshotMock();

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        render(<BrowserRouter><Lobby /></BrowserRouter>);
        
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching user data: ', expect.any(Error));
        });
        
        consoleSpy.mockRestore();
    });


    // Component Cleanup Tests
    it('unsubscribes from snapshot listener on unmount', async () => {
        const unsubscribeMock = jest.fn();
        onSnapshot.mockImplementation(() => unsubscribeMock);

        const { unmount } = render(<BrowserRouter><Lobby /></BrowserRouter>);
        unmount();

        expect(unsubscribeMock).toHaveBeenCalled();
    });
});
