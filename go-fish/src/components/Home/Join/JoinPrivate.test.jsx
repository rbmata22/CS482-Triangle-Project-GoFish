/* eslint-disable no-undef */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JoinPrivate from "./JoinPrivate";
import {  getDocs } from "firebase/firestore";
import { BrowserRouter } from "react-router-dom";

jest.mock("../../config/firebase", () => ({
    db: {}
}));

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn()
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate
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
        getDocs.mockResolvedValueOnce({ empty: true });

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "INVALIDCODE" }
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() =>
            expect(screen.getByText("Invalid or inactive lobby code.")).toBeInTheDocument()
        );
    });

    it("displays lobby details on valid lobby code", async () => {
        const mockLobbyData = {
            id: "lobby123",
            playerLimit: 10,
            useAI: true,
            deckSize: 50,
            players: [
                { username: "Player1", logo: "Cat" },
                { username: "Player2", logo: "Dog" }
            ]
        };
        getDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: "lobby123", data: () => mockLobbyData }]
        });

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "VALIDCODE" }
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() => {
            expect(screen.getByText("Lobby Details")).toBeInTheDocument();
            expect(screen.getByText("Player1")).toBeInTheDocument();
            expect(screen.getByText("Player2")).toBeInTheDocument();
            expect(screen.getByText("Deck Size: 50 Cards")).toBeInTheDocument();
            expect(screen.getByText("AI Fill: Enabled")).toBeInTheDocument();
        });
    });

    it("resets to join form when Back button is clicked from lobby details view", async () => {
        getDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: "lobby123", data: () => ({ playerLimit: 10, players: [] }) }]
        });

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "VALIDCODE" }
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() => expect(screen.getByText("Lobby Details")).toBeInTheDocument());

        fireEvent.click(screen.getByText("Back"));
        expect(screen.getByPlaceholderText("Enter Lobby Code")).toBeInTheDocument();
        expect(screen.queryByText("Lobby Details")).not.toBeInTheDocument();
    });

    it("navigates to lobby on Join Lobby button click", async () => {
        const mockLobbyData = { id: "lobby123", players: [] };
        getDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: "lobby123", data: () => mockLobbyData }]
        });

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "VALIDCODE" }
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() => screen.getByText("Join Lobby"));

        fireEvent.click(screen.getByText("Join Lobby"));
        expect(mockNavigate).toHaveBeenCalledWith("/lobby/lobby123");
    });

    it("displays error message on Firestore error", async () => {
        getDocs.mockRejectedValueOnce(new Error("Firestore error"));

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "VALIDCODE" }
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() =>
            expect(
                screen.getByText("An error occurred while trying to join the lobby.")
            ).toBeInTheDocument()
        );
    });

    it("displays player icons based on logo in lobby details view", async () => {
        const mockLobbyData = {
            id: "lobby123",
            playerLimit: 10,
            useAI: true,
            deckSize: 50,
            players: [
                { username: "Player1", logo: "Cat" },
                { username: "Player2", logo: "Dog" },
                { username: "Player3", logo: "Ghost" },
                { username: "Player4", logo: "Unknown" } // Testing default case
            ]
        };
        getDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: "lobby123", data: () => mockLobbyData }]
        });

        renderComponent();
        fireEvent.change(screen.getByPlaceholderText("Enter Lobby Code"), {
            target: { value: "VALIDCODE" }
        });
        fireEvent.click(screen.getByText("Join Lobby"));

        await waitFor(() => {
            expect(screen.getByText("Player1")).toBeInTheDocument();
            expect(screen.getByText("Player2")).toBeInTheDocument();
            expect(screen.getByText("Player3")).toBeInTheDocument();
            expect(screen.getByText("Player4")).toBeInTheDocument();
            expect(screen.getByTestId("cat-icon")).toBeInTheDocument();
            expect(screen.getByTestId("dog-icon")).toBeInTheDocument();
            expect(screen.getByTestId("ghost-icon")).toBeInTheDocument();
            expect(screen.getByTestId("default-icon")).toBeInTheDocument(); // Default for unknown logo
        });
    });

    it("navigates back to previous page on form Back button click", () => {
        renderComponent();
        fireEvent.click(screen.getByText("Back", { selector: ".back-button" }));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});
