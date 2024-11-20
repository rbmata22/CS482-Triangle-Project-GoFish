import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JoinPrivate from "./JoinPrivate";
import { BrowserRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import JoinPublic from "./JoinPublic"
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Cat, Ghost, Dog, Bot, Bird, Check, X } from 'lucide-react';

// Mock the entire firebase.js config file
jest.mock('../../config/firebase', () => ({
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
jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    onSnapshot: jest.fn()
}));

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("JoinPublic Component", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it("fetches and displays available lobbies", async () => {
      // Arrange
      const mockLobbies = [
        { id: "1", players: [{ username: "Player1", logo: "Cat" }], playerLimit: 4, lobbyType: "public", useAI: true },
        { id: "2", players: [{ username: "Player2", logo: "Dog" }], playerLimit: 4, lobbyType: "public", useAI: false },
      ];
  
      onSnapshot.mockImplementationOnce((query, callback) => {
        callback({
          docs: mockLobbies.map((lobby) => ({
            id: lobby.id,
            data: () => lobby,
          })),
        });
        return jest.fn(); // mock unsubscribe
      });
  
      render(
        <BrowserRouter>
          <JoinPublic />
        </BrowserRouter>
      );
  
      // Act & Assert
      await waitFor(() => {
        expect(screen.getByText("Open Lobbies")).toBeInTheDocument();
        expect(screen.getByText("Player1")).toBeInTheDocument();
        expect(screen.getByText("Player2")).toBeInTheDocument();
      });
    });
  
    it("expands and shows lobby details when clicked", async () => {
      // Arrange
      const mockLobbies = [
        { id: "1", players: [{ username: "Player1", logo: "Cat" }], playerLimit: 4, lobbyType: "public", useAI: true },
      ];
  
      onSnapshot.mockImplementationOnce((query, callback) => {
        callback({
          docs: mockLobbies.map((lobby) => ({
            id: lobby.id,
            data: () => lobby,
          })),
        });
        return jest.fn(); // mock unsubscribe
      });
  
      render(
        <BrowserRouter>
          <JoinPublic />
        </BrowserRouter>
      );
  
      // Act
      fireEvent.click(screen.getByText("Player1"));
  
      // Assert
      expect(screen.getByText("Lobby Type: public")).toBeInTheDocument();
      expect(screen.getByText("AI Fill: Enabled")).toBeInTheDocument();
      expect(screen.getByText("Join Lobby")).toBeInTheDocument();
    });
  
    it("navigates to the lobby page when Join Lobby is clicked", async () => {
      // Arrange
      const mockLobbies = [
        { id: "1", players: [{ username: "Player1", logo: "Cat" }], playerLimit: 4, lobbyType: "public", useAI: true },
      ];
  
      onSnapshot.mockImplementationOnce((query, callback) => {
        callback({
          docs: mockLobbies.map((lobby) => ({
            id: lobby.id,
            data: () => lobby,
          })),
        });
        return jest.fn(); // mock unsubscribe
      });
  
      render(
        <BrowserRouter>
          <JoinPublic />
        </BrowserRouter>
      );
  
      // Act
      fireEvent.click(screen.getByText("Player1"));
      fireEvent.click(screen.getByText("Join Lobby"));
  
      // Assert
      expect(mockNavigate).toHaveBeenCalledWith("/lobby/1");
    });
  
    it("shows 'No lobbies available' message when no lobbies are available", async () => {
      // Arrange
      onSnapshot.mockImplementationOnce((query, callback) => {
        callback({
          docs: [],
        });
        return jest.fn(); // mock unsubscribe
      });
  
      render(
        <BrowserRouter>
          <JoinPublic />
        </BrowserRouter>
      );
  
      // Assert
      expect(screen.getByText("No lobbies available at the moment.")).toBeInTheDocument();
    });
  
    it("navigates back to the previous page when Back button is clicked", () => {
      // Arrange
      render(
        <BrowserRouter>
          <JoinPublic />
        </BrowserRouter>
      );
  
      // Act
      fireEvent.click(screen.getByText("Back"));
  
      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
