import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Lobby from './Lobby';
import { doc, onSnapshot, updateDoc, deleteDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth } from '../../config/firebase';

// Mock Firebase functions and modules for testing
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
      { username: 'Player1', logo: 'Cat', isReady: true, betAmount: 0 },
      { username: 'Player2', logo: 'Dog', isReady: false, betAmount: 0 },
      { username: 'Player3', logo: 'Bot', isReady: true, betAmount: 10 },
      { username: 'Player4', logo: 'Ghost', isReady: false, betAmount: 5 }
    ],
    useAI: false,
    owner: 'Player1',
    lobbyCode: '12345',
    bettingTotal: 15
  };

  const mockGuestUserData = {
    username: 'GuestUser',
    logo: 'Ghost',
    guestId: 'guest_123',
    virtualCurrency: 500,
    isReady: false
  };

  const setupSnapshotMock = (data = mockLobbyData) => {
    onSnapshot.mockImplementation((_, callback) => {
      callback({ exists: () => true, data: () => data });
      return jest.fn(); // unsubscribe mock
    });
  };

  const setupGetDocMock = (data = { username: 'Player1', logo: 'Cat', virtualCurrency: 100 }) => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => data
    });
  };

  it('renders the lobby and displays user information', async () => {
    setupSnapshotMock();
    setupGetDocMock();

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText("Player1's Lobby")).toBeInTheDocument();
      expect(screen.getByText('Player1')).toBeInTheDocument();
      expect(screen.getByText('Player2')).toBeInTheDocument();
      expect(screen.getByText('Player3')).toBeInTheDocument();
      expect(screen.getByText('Player4')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('Not Ready')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
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

  it('fetches authenticated user data from Firestore', async () => {
    setupGetDocMock();

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
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
    setupGetDocMock();

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
    setupGetDocMock();

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    await act(async () => {
      fireEvent.click(screen.getByText('Leave Lobby'));
    });

    expect(deleteDoc).toHaveBeenCalledWith(expect.any(Object));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('leaves the lobby without deletion if the user is not the owner', async () => {
    setupSnapshotMock({ ...mockLobbyData, owner: 'AnotherPlayer' });
    setupGetDocMock();

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    await act(async () => {
      fireEvent.click(screen.getByText('Leave Lobby'));
    });

    expect(deleteDoc).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('disables "GO FISH!" button if not all players are ready', () => {
    setupSnapshotMock();
    setupGetDocMock();

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    const goFishButton = screen.getByText('GO FISH!');
    expect(goFishButton).toBeDisabled();
    expect(goFishButton).toHaveStyle('background-color: #555');
  });

  it('enables "GO FISH!" button and navigates to game if all players are ready', async () => {
    setupSnapshotMock({
      ...mockLobbyData,
      players: [
        { username: 'Player1', isReady: true },
        { username: 'Player2', isReady: true },
        { username: 'Player3', isReady: true },
        { username: 'Player4', isReady: true }
      ]
    });
    setupGetDocMock();

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    const goFishButton = screen.getByText('GO FISH!');
    expect(goFishButton).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(goFishButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith(`/lobby/${mockLobbyData.lobbyId}/game`, {
      state: { lobbyId: 'test-lobby-id', bettingTotal: mockLobbyData.bettingTotal }
    });
  });

  it('adds the current user to the lobby if not already present', async () => {
    setupSnapshotMock({ ...mockLobbyData, players: [{ username: 'AnotherPlayer', isReady: true }] });
    setupGetDocMock();

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

  it('handles place bet', async () => {
    setupSnapshotMock();
    setupGetDocMock();

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    await act(async () => {
      fireEvent.click(screen.getByText('Place Bet'));
      const betInput = screen.getByLabelText('Bet Amount');
      fireEvent.change(betInput, { target: { value: '20' } });
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
    });

    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ players: expect.any(Array) })
    );
  });

  it('shows error message when bet amount exceeds user virtual currency', async () => {
    setupSnapshotMock();
    setupGetDocMock({ username: 'Player1', logo: 'Cat', virtualCurrency: 10 });

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    await act(async () => {
      fireEvent.click(screen.getByText('Place Bet'));
      const betInput = screen.getByLabelText('Bet Amount');
      fireEvent.change(betInput, { target: { value: '20' } });
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
    });

    expect(screen.getByText('Insufficient funds!')).toBeInTheDocument();
  });

  it('does not add the current user to the lobby if they are already present', async () => {
    setupSnapshotMock(mockLobbyData);
    setupGetDocMock();

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('handles error when adding AI players', async () => {
    setupSnapshotMock({
      ...mockLobbyData,
      useAI: true,
      players: [{ username: 'Player1', logo: 'Cat', isReady: true }]
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    await act(async () => {
      fireEvent.click(screen.getByText('Ready'));
    });

    expect(console.error).toHaveBeenCalledWith('Error adding bots:', expect.any(Error));
  });

  it('handles error when starting the game', async () => {
    setupSnapshotMock({
      ...mockLobbyData,
      players: [
        { username: 'Player1', isReady: true },
        { username: 'Player2', isReady: true },
        { username: 'Player3', isReady: true },
        { username: 'Player4', isReady: true }
      ]
    });
    setupGetDocMock();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<BrowserRouter><Lobby /></BrowserRouter>);

    const goFishButton = screen.getByText('GO FISH!');
    await act(async () => {
      fireEvent.click(goFishButton);
    });

    expect(console.error).toHaveBeenCalledWith('Error starting game:', expect.any(Error));
    expect(screen.getByText('Error starting game. Please try again.')).toBeInTheDocument();
  });
});