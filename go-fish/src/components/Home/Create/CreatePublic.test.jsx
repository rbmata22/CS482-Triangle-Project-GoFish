import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import CreatePublic from './CreatePublic';
import { db } from '../../config/firebase';

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
describe('CreatePublic Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    localStorage.setItem('username', 'testuser'); // Mocking a username in localStorage
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders with default values', () => {
    render(
      <BrowserRouter>
        <CreatePublic />
      </BrowserRouter>
    );

    // Check default player limit
    expect(screen.getByLabelText(/Player Limit/i).value).toBe('4');
    // Check default AI toggle
    expect(screen.getByRole('checkbox', { name: /Fill Empty Slots with AI/i })).toBeChecked();
    // Check default deck size
    expect(screen.getByLabelText(/Deck Size/i).value).toBe('25');
  });

  it('updates player limit and deck size correctly', () => {
    render(
      <BrowserRouter>
        <CreatePublic />
      </BrowserRouter>
    );

    // Change player limit to 3
    fireEvent.change(screen.getByLabelText(/Player Limit/i), { target: { value: '3' } });
    expect(screen.getByLabelText(/Player Limit/i).value).toBe('3');

    // Check if deck size updates according to player limit
    expect(screen.getByLabelText(/Deck Size/i).value).toBe('20');
  });

  it('toggles AI fill option', () => {
    render(
      <BrowserRouter>
        <CreatePublic />
      </BrowserRouter>
    );

    const aiToggle = screen.getByRole('checkbox', { name: /Fill Empty Slots with AI/i });
    // Uncheck the checkbox
    fireEvent.click(aiToggle);
    expect(aiToggle).not.toBeChecked();

    // Check the checkbox again
    fireEvent.click(aiToggle);
    expect(aiToggle).toBeChecked();
  });

  it('creates a lobby and navigates to the lobby page', async () => {
    addDoc.mockResolvedValueOnce({ id: 'lobby123' });

    render(
      <BrowserRouter>
        <CreatePublic />
      </BrowserRouter>
    );

    // Click the Create Lobby button
    fireEvent.click(screen.getByText(/Create Lobby/i));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(collection(db, 'Lobbies'), {
        playerLimit: 4,
        useAI: true,
        deckSize: 25,
        players: [],
        status: 'setting up',
        createdAt: expect.any(Date),
        owner: 'testuser',
      });

      // Check if it navigates to the correct lobby page
      expect(mockNavigate).toHaveBeenCalledWith('/lobby/lobby123');
    });
  });

  it('displays an error message when lobby creation fails', async () => {
    addDoc.mockRejectedValueOnce(new Error('Failed to create lobby'));

    render(
      <BrowserRouter>
        <CreatePublic />
      </BrowserRouter>
    );

    // Mock console.error to prevent clutter in test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Click the Create Lobby button
    fireEvent.click(screen.getByText(/Create Lobby/i));

    await waitFor(() => {
      // Check if console.error was called
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating lobby:',
        expect.any(Error)
      );
    });

    // Restore console.error after test
    consoleErrorSpy.mockRestore();
  });
});
