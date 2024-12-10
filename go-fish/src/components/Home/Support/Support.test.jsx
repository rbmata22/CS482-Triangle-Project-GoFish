import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Support from "./Support";
import { addDoc, collection } from "firebase/firestore";
import { auth } from "../../config/firebase";

// Mock Firebase functions
jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    addDoc: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
    auth: { currentUser: { uid: "test-user" } },
    db: {},
}));

describe("Support Component", () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the support popup with form elements", () => {
        render(<Support onClose={mockOnClose} />);

        expect(screen.getByPlaceholderText("What do you need help with?")).toBeInTheDocument();
        expect(screen.getByText("Send")).toBeInTheDocument();
        expect(screen.getByText("Close")).toBeInTheDocument();
    });

    it("does not submit if message is empty", async () => {
        render(<Support onClose={mockOnClose} />);

        fireEvent.click(screen.getByText("Send"));

        await waitFor(() => expect(addDoc).not.toHaveBeenCalled());
    });

    it("submits a message and calls onClose", async () => {
        render(<Support onClose={mockOnClose} />);
        collection.mockReturnValueOnce("mockCollection"); // Mock collection reference

        fireEvent.change(screen.getByPlaceholderText("What do you need help with?"), {
            target: { value: "I need help!" },
        });
        fireEvent.click(screen.getByText("Send"));

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalledWith("mockCollection", {
                userId: "test-user",
                message: "I need help!",
                timestamp: expect.any(Date),
            });
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it("logs an error if addDoc fails", async () => {
        console.error = jest.fn(); // Mock console.error
        addDoc.mockRejectedValueOnce(new Error("Firestore error"));

        render(<Support onClose={mockOnClose} />);
        fireEvent.change(screen.getByPlaceholderText("What do you need help with?"), {
            target: { value: "Test error" },
        });
        fireEvent.click(screen.getByText("Send"));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(
                "Error sending message: ",
                expect.any(Error)
            );
        });
    });

    it("calls onClose when Close button is clicked", () => {
        render(<Support onClose={mockOnClose} />);
        
        fireEvent.click(screen.getByText("Close"));
        
        expect(mockOnClose).toHaveBeenCalled();
    });
});
