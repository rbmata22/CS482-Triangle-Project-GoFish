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
    it('renders loading state initially', () => {
        render(<BrowserRouter><Lobby /></BrowserRouter>);
        expect(screen.getByText('Loading lobby...')).toBeInTheDocument();
    });

    it('renders lobby with all components when data is loaded', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);
        
        await waitFor(() => {
            expect(screen.getByText("Player1's Lobby")).toBeInTheDocument();
            expect(screen.getByText('Current Bet Pool')).toBeInTheDocument();
            expect(screen.getByText('100')).toBeInTheDocument(); // betting total
        });
    });

    // User Data Fetching Tests
    it('fetches and displays authenticated user data correctly', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            expect(screen.getByText('Player1')).toBeInTheDocument();
            expect(screen.getByText('1000')).toBeInTheDocument();
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
            fireEvent.click(screen.getByText('Place Bet'));
            expect(screen.getByText('Place Your Bet')).toBeInTheDocument();
        });
    });

    it('handles valid bet placement', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            fireEvent.click(screen.getByText('Place Bet'));
        });

        const betInput = screen.getByPlaceholderText('Enter bet amount');
        fireEvent.change(betInput, { target: { value: '100' } });
        fireEvent.click(screen.getByText('Place Bet'));

        expect(updateDoc).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                players: expect.any(Array)
            })
        );
    });

    it('prevents invalid bet amounts', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            fireEvent.click(screen.getByText('Place Bet'));
        });

        const betInput = screen.getByPlaceholderText('Enter bet amount');
        fireEvent.change(betInput, { target: { value: '2000' } }); // More than virtual currency
        
        const placeBetButton = screen.getByText('Place Bet');
        expect(placeBetButton).toBeDisabled();
    });

    // AI Player Tests
    it('adds AI players when enabled and all real players are ready', async () => {
        setupSnapshotMock({
            ...mockLobbyData,
            useAI: true,
            players: [{ username: 'Player1', logo: 'Cat', isReady: true }],
            playerLimit: 4
        });
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            expect(arrayUnion).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    username: expect.stringMatching(/SpongeBot|LeBot|Botman|J\.A\.R\.V\.I\.S|Ultron|Cyborg/),
                    logo: 'Bot',
                    isReady: true
                })
            );
        });
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
    it('handles lobby deletion by owner', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            fireEvent.click(screen.getByText('Leave Lobby'));
        });

        expect(deleteDoc).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

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

    it('handles error when starting game', async () => {
        setupSnapshotMock({
            ...mockLobbyData,
            players: [
                { username: 'Player1', logo: 'Cat', isReady: true },
                { username: 'Player2', logo: 'Dog', isReady: true }
            ]
        });
        setupUserDocMock();

        updateDoc.mockImplementationOnce(() => Promise.reject(new Error('Update error')));
        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            fireEvent.click(screen.getByText('GO FISH!'));
        });

        expect(alertMock).toHaveBeenCalledWith('Error starting game. Please try again.');
        alertMock.mockRestore();
    });

    // User Ready Status Tests
    it('toggles ready status correctly', async () => {
        setupSnapshotMock();
        setupUserDocMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            fireEvent.click(screen.getByText('Ready'));
        });

        expect(updateDoc).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                players: expect.arrayContaining([
                    expect.objectContaining({
                        username: 'Player1',
                        isReady: expect.any(Boolean)
                    })
                ])
            })
        );
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