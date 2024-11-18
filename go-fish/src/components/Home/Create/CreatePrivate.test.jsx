import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import CreatePrivate from './CreatePrivate';
import { db } from '../../config/firebase';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'MOCKEDU'),
}));

describe('CreatePrivate Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    localStorage.setItem('username', 'testUser');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders correctly with default settings', () => {
    render(<CreatePrivate />);

    // Check if all main elements are rendered
    expect(screen.getByText(/Create Private Lobby/i)).toBeInTheDocument();
    expect(screen.getByText(/Player Limit/i)).toBeInTheDocument();
    expect(screen.getByText(/Fill Empty Slots with AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Deck Size/i)).toBeInTheDocument();
    expect(screen.getByText(/Login Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Lobby/i)).toBeInTheDocument();

    
  });

  it('updates player limit and deck size when player limit changes', () => {
    render(<CreatePrivate />);

    const playerLimitSelect = screen.getByLabelText(/Player Limit/i);
    fireEvent.change(playerLimitSelect, { target: { value: '3' } });

    // Check if player limit is updated
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();

    // Check if the deck size is updated to the first option of the new player limit
    expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // First option for 3 players
  });

  it('toggles AI usage when checkbox is clicked', () => {
    render(<CreatePrivate />);

    const aiToggle = screen.getByRole('checkbox');
    expect(aiToggle).toBeChecked(); // Default value is true

    fireEvent.click(aiToggle);
    expect(aiToggle).not.toBeChecked(); // AI usage should now be false
  });

  it('displays the correct lobby code', () => {
    render(<CreatePrivate />);
    expect(screen.getByText('Login Code')).toBeInTheDocument();
  });

  it('creates a new lobby and navigates to the lobby page on success', async () => {
    addDoc.mockResolvedValueOnce({ id: 'testLobbyId' });
    render(<CreatePrivate />);

    const createLobbyButton = screen.getByText(/Create Lobby/i);
    fireEvent.click(createLobbyButton);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'Lobbies'), 
        expect.objectContaining({
          playerLimit: 4,
          useAI: true,
          deckSize: 25,
          players: [],
          status: 'setting up',
          owner: 'testUser',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/lobby/testLobbyId');
    });
  });

  it('logs an error if creating a lobby fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    addDoc.mockRejectedValueOnce(new Error('Firestore error'));

    render(<CreatePrivate />);

    const createLobbyButton = screen.getByText(/Create Lobby/i);
    fireEvent.click(createLobbyButton);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating lobby:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});
