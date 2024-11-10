import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import JoinPublic from "./JoinPublic";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Cat, Ghost, Dog, Bird } from "lucide-react";

// Mock Firebase Firestore functions
jest.mock("../../config/firebase", () => ({
    db: {}
}));

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    onSnapshot: jest.fn()
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("JoinPublic Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockLobbyData = [
        {
            id: "1",
            players: [{ username: "Player1", logo: "Cat" }],
            playerLimit: 4,
            lobbyType: "public",
            useAI: true,
            deckSize: 50
        },
        {
            id: "2",
            players: [{ username: "Player2", logo: "Dog" }],
            playerLimit: 4,
            lobbyType: "public",
            useAI: false,
            deckSize: 40
        },
        {
            id: "3",
            players: [{ username: "Player3", logo: "Ghost" }],
            playerLimit: 4,
            lobbyType: "private",
            useAI: true,
            deckSize: 30
        },
        {
            id: "4",
            players: [],
            playerLimit: 4,
            lobbyType: "public",
            useAI: true,
            deckSize: 20
        }
    ];

    const setupSnapshotMock = (data) => {
        onSnapshot.mockImplementationOnce((query, callback) => {
            callback({
                docs: data.map((lobby) => ({
                    id: lobby.id,
                    data: () => lobby
                }))
            });
            return jest.fn(); // mock unsubscribe
        });
    };

    const renderComponent = () => {
        render(
            <BrowserRouter>
                <JoinPublic />
            </BrowserRouter>
        );
    };

    it("fetches and displays available lobbies, filtering out private lobbies", async () => {
        setupSnapshotMock(mockLobbyData);

        renderComponent();
        await waitFor(() => {
            expect(screen.getByText("Open Lobbies")).toBeInTheDocument();
            expect(screen.getByText("Player1")).toBeInTheDocument();
            expect(screen.getByText("Player2")).toBeInTheDocument();
            expect(screen.queryByText("Player3")).not.toBeInTheDocument();
        });
    });

    it("expands and shows lobby details when a lobby is clicked, then collapses on back click", async () => {
        setupSnapshotMock(mockLobbyData);
        renderComponent();

        await waitFor(() => screen.getByText("Player1"));
        fireEvent.click(screen.getByText("Player1"));

        expect(screen.getByText("Lobby Type: public")).toBeInTheDocument();
        expect(screen.getByText("AI Fill: Enabled")).toBeInTheDocument();
        expect(screen.getByText("Deck Size: 50 Cards")).toBeInTheDocument();
        expect(screen.getByText("Join Lobby")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Back"));
        expect(screen.queryByText("Lobby Type: public")).not.toBeInTheDocument();
    });

    it("navigates to the correct lobby page when Join Lobby is clicked", async () => {
        setupSnapshotMock(mockLobbyData);
        renderComponent();

        await waitFor(() => screen.getByText("Player1"));
        fireEvent.click(screen.getByText("Player1"));
        fireEvent.click(screen.getByText("Join Lobby"));

        expect(mockNavigate).toHaveBeenCalledWith("/lobby/1");
    });

    it("shows 'No lobbies available' message when no lobbies are available", async () => {
        setupSnapshotMock([]);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("No lobbies available at the moment.")).toBeInTheDocument();
        });
    });

    it("navigates back to the previous page when Back button is clicked", () => {
        renderComponent();
        fireEvent.click(screen.getByText("Back"));

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("renders correct user icons based on logo type and defaults to Bird icon for unknown types", async () => {
        const iconData = [
            { username: "Player1", logo: Cat },
            { username: "Player2", logo: Dog },
            { username: "UnknownPlayer", logo: Bird } // Default case
        ];

        setupSnapshotMock([
            { id: "1", players: [{ username: "Player1", logo: "Cat" }], lobbyType: "public" },
            { id: "2", players: [{ username: "Player2", logo: "Dog" }], lobbyType: "public" },
            { id: "3", players: [{ username: "UnknownPlayer" }], lobbyType: "public" }
        ]);
        renderComponent();

        await waitFor(() => {
            iconData.forEach(({ username, logo }) => {
                expect(screen.getByText(username)).toBeInTheDocument();
                expect(screen.getByTestId(`icon-${username}`)).toBeInstanceOf(logo);
            });
        });
    });

    it("displays player count in the lobby summary for various scenarios", async () => {
        setupSnapshotMock([
            { id: "1", players: [{ username: "Player1" }], playerLimit: 4, lobbyType: "public" },
            { id: "2", players: [], playerLimit: 4, lobbyType: "public" },
            { id: "3", players: [{ username: "FullPlayer1" }, { username: "FullPlayer2" }], playerLimit: 2, lobbyType: "public" }
        ]);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("1 / 4 Players")).toBeInTheDocument();
            expect(screen.getByText("0 / 4 Players")).toBeInTheDocument();
            expect(screen.getByText("2 / 2 Players")).toBeInTheDocument();
        });
    });

    it("handles snapshot error gracefully and displays an error message", async () => {
        onSnapshot.mockImplementationOnce(() => {
            throw new Error("Failed to fetch lobbies");
        });

        renderComponent();
        await waitFor(() => {
            expect(screen.getByText("Error loading lobbies")).toBeInTheDocument();
        });
    });

    it("unsubscribes from snapshot listener on component unmount", async () => {
        const unsubscribeMock = jest.fn();
        onSnapshot.mockImplementationOnce(() => unsubscribeMock);

        const { unmount } = renderComponent();
        unmount();

        expect(unsubscribeMock).toHaveBeenCalled();
    });

    it("toggles expanded lobby view back to null if same lobby is clicked again", async () => {
        setupSnapshotMock(mockLobbyData);
        renderComponent();

        await waitFor(() => screen.getByText("Player1"));
        fireEvent.click(screen.getByText("Player1")); // First click to expand
        expect(screen.getByText("Lobby Type: public")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Player1")); // Second click to collapse
        expect(screen.queryByText("Lobby Type: public")).not.toBeInTheDocument();
    });

    it("navigates correctly on second join lobby after back button clicked", async () => {
        setupSnapshotMock(mockLobbyData);
        renderComponent();

        await waitFor(() => screen.getByText("Player1"));
        fireEvent.click(screen.getByText("Player1"));
        fireEvent.click(screen.getByText("Back")); // Collapse details

        fireEvent.click(screen.getByText("Player2")); // Expand second lobby
        fireEvent.click(screen.getByText("Join Lobby"));
        expect(mockNavigate).toHaveBeenCalledWith("/lobby/2");
    });
});
