import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Shop from "./Shop";

import { getDoc, doc } from "firebase/firestore";
import { BrowserRouter } from "react-router-dom";
jest.mock('../config/firebase', () => ({
    auth: {},
    db: {},
    provider: {}
}))

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({})),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn(() => ({}))
}))

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    getFirestore: jest.fn()
}))

// Mock react-router-dom navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

describe('Shop Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    const renderShop = () => {
        render(
            <BrowserRouter>
                <Shop />
            </BrowserRouter>
        );
    };

    // Testcase 1: Verifies initial user currency display
    it('displays initial user currency', async () => {
        // Mock getDoc to simulate a user with 500 coins
        getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ virtualCurrency: 500 }) });
        renderShop();

        expect(await screen.findByText(/Your Balance: 500 coins/i)).toBeInTheDocument();
    });

    

    // Testcase 2: Error if user has insufficient funds
    it('shows error if user has insufficient funds for a purchase', async () => {
        getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ virtualCurrency: 100 }) });
        renderShop();

        fireEvent.click(screen.getAllByText('Purchase')[0]);

        expect(await screen.findByText(/You need more money/i)).toBeInTheDocument();
    });

    // Testcase 3: Successful purchase deducts currency and updates display
    it('updates user currency and shows success message on purchase', async () => {
        getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ virtualCurrency: 1000 }) });
        renderShop();

        fireEvent.click(screen.getAllByText('Purchase')[0]);

        await waitFor(() => expect(updateDoc).toHaveBeenCalledTimes(1));
        expect(await screen.findByText(/You bought it!/i)).toBeInTheDocument();
        expect(screen.getByText(/Your Balance: 800 coins/i)).toBeInTheDocument();
    });

    // Testcase 4: Music toggling works correctly
    it('toggles background music play/pause', async () => {
        renderShop();

        const musicButton = screen.getByText('Pause Music');
        fireEvent.click(musicButton);
        expect(screen.getByText('Music')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Music'));
        expect(screen.getByText('Pause Music')).toBeInTheDocument();
    });

    // Testcase 5: Error handling on Firestore failure
    it('shows an error message if there is an issue with Firestore data fetching', async () => {
        getDoc.mockRejectedValueOnce(new Error('Error fetching data'));
        renderShop();

        expect(await screen.findByText(/Error fetching user data/i)).toBeInTheDocument();
    });

    // Testcase 6: Navigates back to home when "Home" button is clicked
    it('navigates back to home page when Home button is clicked', () => {
        renderShop();

        const homeButton = screen.getByText('Home');
        fireEvent.click(homeButton);

        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
});
