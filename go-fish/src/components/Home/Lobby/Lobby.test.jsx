import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Lobby from './Lobby';
import { doc, onSnapshot, updateDoc, deleteDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { auth } from '../../config/firebase';

// Mock Firebase functions and modules for testing
jest.mock('../../config/firebase', () => ({
    auth: { currentUser: { uid: 'user-id' } },
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
            { username: 'Player1', logo: 'Cat', isReady: true },
            { username: 'Player2', logo: 'Dog', isReady: false }
        ],
        useAI: false,
        owner: 'Player1',
        lobbyCode: '12345'
    };

    const setupSnapshotMock = (data = mockLobbyData) => {
        onSnapshot.mockImplementation((_, callback) => {
            callback({ exists: () => true, data: () => data });
            return jest.fn(); // unsubscribe mock
        });
    };

    it('renders the lobby and displays user information', async () => {
        setupSnapshotMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        expect(screen.getByText("Player1's Lobby")).toBeInTheDocument();
        expect(screen.getByText('Player1')).toBeInTheDocument();
        expect(screen.getByText('Player2')).toBeInTheDocument();
        expect(screen.getByText('Ready')).toBeInTheDocument();
        expect(screen.getByText('Not Ready')).toBeInTheDocument();
    });

    it('navigates to home if lobby document is deleted', async () => {
        onSnapshot.mockImplementation((_, callback) => {
            callback({ exists: () => false }); // Simulate document deletion
        });

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await waitFor(() => {
            expect(localStorage.getItem('ownerLeftMessage')).toBe('Owner of session has left');
            expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });

    it('fetches guest user data from localStorage', () => {
        localStorage.setItem('authType', 'Guest');
        localStorage.setItem('username', 'GuestUser');
        localStorage.setItem('logo', 'Ghost');
        localStorage.setItem('guestId', 'guest_123');

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        expect(screen.getByText('GuestUser')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('adds AI players when all real users are ready and AI fill is enabled', async () => {
        setupSnapshotMock({
            ...mockLobbyData,
            useAI: true,
            players: [{ username: 'Player1', logo: 'Cat', isReady: true }]
        });

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await act(async () => {
            fireEvent.click(screen.getByText('Ready'));
        });

        expect(arrayUnion).toHaveBeenCalledWith(
            expect.objectContaining({ username: expect.stringContaining('Botman') })
        );
    });

    it('handles ready/unready toggle for current user and updates Firestore', async () => {
        setupSnapshotMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await act(async () => {
            fireEvent.click(screen.getByText('Ready'));
        });

        expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
            players: expect.arrayContaining([expect.objectContaining({ username: 'Player1', isReady: false })])
        });
    });

    it('leaves the lobby and navigates home if the user is the owner', async () => {
        setupSnapshotMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await act(async () => {
            fireEvent.click(screen.getByText('Leave Lobby'));
        });

        expect(deleteDoc).toHaveBeenCalledWith(expect.any(Object));
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('leaves the lobby without deletion if the user is not the owner', async () => {
        setupSnapshotMock({ ...mockLobbyData, owner: 'AnotherPlayer' });

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        await act(async () => {
            fireEvent.click(screen.getByText('Leave Lobby'));
        });

        expect(deleteDoc).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('disables "GO FISH!" button if not all players are ready', () => {
        setupSnapshotMock();

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        const goFishButton = screen.getByText('GO FISH!');
        expect(goFishButton).toBeDisabled();
        expect(goFishButton).toHaveStyle('background-color: #555');
    });

    it('enables "GO FISH!" button and navigates to game if all players are ready', async () => {
        setupSnapshotMock({ ...mockLobbyData, players: [{ username: 'Player1', isReady: true }, { username: 'Player2', isReady: true }] });

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        const goFishButton = screen.getByText('GO FISH!');
        expect(goFishButton).not.toBeDisabled();
        await act(async () => {
            fireEvent.click(goFishButton);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/game', { state: { numberOfPlayers: 2 } });
    });

    it('adds the current user to the lobby if not already present', async () => {
        setupSnapshotMock({ ...mockLobbyData, players: [{ username: 'AnotherPlayer', isReady: true }] });

        render(<BrowserRouter><Lobby /></BrowserRouter>);

        expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
            players: arrayUnion(expect.objectContaining({ username: 'Player1' }))
        });
    });

    it('renders loading message if lobby data is not yet available', () => {
        onSnapshot.mockImplementation(() => {
            return jest.fn(); // unsubscribe mock
        });

        render(<BrowserRouter><Lobby /></BrowserRouter>);
        expect(screen.getByText('Loading lobby...')).toBeInTheDocument();
    });
    
});
