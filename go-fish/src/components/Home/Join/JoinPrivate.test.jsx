import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JoinPrivate from "./JoinPrivate";
import { query, where, getDocs } from "firebase/firestore";
import { BrowserRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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
}));

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("JoinPrivate Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = () => {
        render(
            <BrowserRouter>
                <JoinPrivate />
            </BrowserRouter>
        );
    };

    it("renders the join private lobby form", () => {
        renderComponent();
        expect(screen.getByPlaceholderText("Enter Lobby Code")).toBeInTheDocument();
        expect(screen.getByText("Join Lobby")).toBeInTheDocument();
    });

    it("displays error if no lobby code is entered", async () => {
        renderComponent();
        fireEvent.click(screen.getByText("Join Lobby"));

        expect(screen.getByText("Please enter a lobby code.")).toBeInTheDocument();
    });

    it("displays error for invalid lobby code", async () => {
        getDocs.mockResolvedValueOnce({ empty: true }); // Mock an empty response from Firestore

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "INVALIDCODE" },
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() => expect(screen.getByText("Invalid or inactive lobby code.")).toBeInTheDocument());
    });

    it("displays lobby details on valid lobby code", async () => {
        const mockLobbyData = {
            id: "lobby123",
            lobbyCode: "VALIDCODE",
            playerLimit: 10,
            useAI: true,
            players: [
                { username: "Player1", logo: "Cat" },
                { username: "Player2", logo: "Dog" },
            ],
        };
        getDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: "lobby123", data: () => mockLobbyData }],
        });

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "VALIDCODE" },
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() => {
            expect(screen.getByText("Lobby Details")).toBeInTheDocument();
            expect(screen.getByText("Player1")).toBeInTheDocument();
            expect(screen.getByText("Player2")).toBeInTheDocument();
        });
    });

    it("resets to join form when Back button is clicked from lobby details view", async () => {
        // Mock valid lobby data for initial join
        getDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: "lobby123", data: () => ({ playerLimit: 10, players: [] }) }],
        });

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "VALIDCODE" },
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() => expect(screen.getByText("Lobby Details")).toBeInTheDocument());

        // Click Back button
        fireEvent.click(screen.getByText("Back"));
        expect(screen.getByPlaceholderText("Enter Lobby Code")).toBeInTheDocument();
    });

    it("navigates to lobby on Join Lobby button click", async () => {
        const mockLobbyData = {
            id: "lobby123",
            players: [],
        };
        getDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: "lobby123", data: () => mockLobbyData }],
        });

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "VALIDCODE" },
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() => screen.getByText("Join Lobby"));

        fireEvent.click(screen.getByText("Join Lobby"));
        expect(mockNavigate).toHaveBeenCalledWith("/lobby/lobby123");
    });
    
    it("navigates back to the previous page when Back button is clicked", () => {
        // Arrange
        render(
          <BrowserRouter>
            <JoinPrivate />
          </BrowserRouter>
        );
    
        // Act
        fireEvent.click(screen.getByText("Back"));
    
        // Assert
        expect(mockNavigate).toHaveBeenCalledWith(-1);
      });
});
