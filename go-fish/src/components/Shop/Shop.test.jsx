import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Shop from "./Shop";
import {handlePurchase} from "./Shop"
import { updateDoc, getDoc, doc } from "firebase/firestore";
import { BrowserRouter } from "react-router-dom";
import shopItems from './Shop';
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
    getFirestore: jest.fn(),
    updateDoc: jest.fn(), // Mock updateDoc

}))

// Mock react-router-dom navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

describe('Shop Component', () => {
    let setError, setUserCurrency, setInventory, errorAudio, userCurrency, inventory, authType;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        inventory = {}; // Ensure inventory is initialized as an empty object

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

        expect(await screen.findByText(/Your Balance:/i)).toBeInTheDocument();
    });
    it('should update localStorage for guest users', () => {
        // Mock localStorage methods
        const localStorageMock = (function() {
            let store = {};
            return {
              getItem: (key) => store[key] || null,
              setItem: (key, value) => store[key] = value,
              removeItem: (key) => delete store[key],
              clear: () => store = {}
            };
          })();
    
          Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
          });
      
          // Mock the authType for testing
          const authType = 'Guest';
          const newBalance = 1000;
          const updatedInventory = { item1: true };
      
          // Render the Shop component within a BrowserRouter
          render(
            <BrowserRouter>
              <Shop authType={authType} newBalance={newBalance} updatedInventory={updatedInventory} />
            </BrowserRouter>
          )
            // Assert that localStorage.setItem was called correctly
    expect(localStorage.setItem).toHaveBeenCalledWith('guestCurrency', newBalance.toString());
    expect(localStorage.setItem).toHaveBeenCalledWith('guestInventory', JSON.stringify(updatedInventory));
  
          
        });
    it('should handle item purchase successfully', async () => {
        const item = { id: 1, name: 'Apple Icon', price: 200 };
        const userCurrency = 500;
        const inventory = {}; // Start with an empty inventory
    
        const newBalance = userCurrency - item.price;
        const updatedInventory = { ...inventory, [item.id]: true };
        
        doc.mockReturnValue({ uid: 'testUserId' });
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

        const itemId = 1; // ID of the item to purchase
        const item = shopItems.find(i => i.id === itemId);
      
        let successMessage = screen.queryByText(new RegExp(`You bought ${item.name}!`, 'i'));
        expect(successMessage).toBeInTheDocument();        expect(screen.getByText(/Your Balance: 800 coins/i)).toBeInTheDocument();
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

    

    // Testcase 6: Navigates back to home when "Home" button is clicked
    it('navigates back to home page when Home button is clicked', () => {
        renderShop();

        const homeButton = screen.getByText('Home');
        fireEvent.click(homeButton);

        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
    it('sets error if user already owns the item', async () => {
        const item = { id: 'item1', price: 500 };
        inventory[item.id] = true;
    
        await handlePurchase(item, {
          userCurrency,
          inventory,
          setError,
          setUserCurrency,
          setInventory,
          authType,
          errorAudio,
        });
    
        expect(setError).toHaveBeenCalledWith('You already own this item');
        expect(errorAudio.play).toHaveBeenCalled();
        expect(setUserCurrency).not.toHaveBeenCalled();
      });
    
});

  
    
 
