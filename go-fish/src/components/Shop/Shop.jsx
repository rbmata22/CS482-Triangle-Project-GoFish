// Import useState and useEffect hooks from React
import { useState, useEffect } from 'react';
// Import authentication function from Firebase authentication module
import { getAuth } from 'firebase/auth';
// Import functions to interact with Firestore database
import { getDoc, doc, updateDoc } from 'firebase/firestore';
// Import the database configuration from the local config file
import { db } from '../config/firebase';
// Import the useNavigate hook from react-router-dom for navigation
import { useNavigate } from 'react-router-dom';
// Import CSS styles for the Shop component
import './shop.css';
// An array of shop items with details
const shopItems = [
  {
    id: 1,
    name: "NBA Card Theme",
    image: "https://external-preview.redd.it/4XfJcJFWh7usKB-htKE7QdoiW2GupdFiIhqNU0X7dns.jpg?width=640&crop=smart&auto=webp&s=42be24e79f0e031252dc83454987f7f78ed2a44e",
    price: 75,
    featured: false
  },
  {
    id: 2,
    name: "SpongeBob Theme",
    image: "https://ae01.alicdn.com/kf/S92677255435745c0bc3fe8fba1a127e5Z.jpg_960x960.jpg",
    price: 250,
    featured: true
  }
];
// Define the Shop component function
const Shop = () => {
  // Hooks for currency, error messages, and success messages
  const [userCurrency, setUserCurrency] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Initialize Firebase Authentication
  const auth = getAuth();
  // Hook to navigate
  const navigate = useNavigate();
  // Effect hook fetches user data from Firebase 
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          // Get user document from Firestore
          const userDoc = await getDoc(doc(db, 'Users', auth.currentUser.uid));
          // If user document exists update state with user's virtual currency
          if (userDoc.exists()) {
            setUserCurrency(userDoc.data().virtualCurrency || 0);
          }
        } catch (error) {
          // Set error state and log the error if fetching user data fails
          setError('Error fetching user data');
          console.error('Error:', error);
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);
  // Function to handle item purchase
  const handlePurchase = async (item) => {
    // Check if user is logged in
    if (!auth.currentUser) {
      setError("To buy something you have to be logged in");
      return;
    }
    // Check if user has enough currency to buy the item
    if (userCurrency < item.price) {
      setError("You need more money");
      return;
    }
    try {
      // Reference to user's Firestore document
      const userRef = doc(db, 'Users', auth.currentUser.uid);
      // Get user document
      const userDoc = await getDoc(userRef);
      // Check if user document exists
      if (!userDoc.exists()) {
        setError("Account not found");
        return;
      }
      // Get new balance after purchase
      const userData = userDoc.data();
      const newBalance = userData.virtualCurrency - item.price;
      // Update user's virtual currency in Firestore
      await updateDoc(userRef, {
        virtualCurrency: newBalance,
        [`inventory.${item.id}`]: true
      });
      // Update user currency state and set success message
      setUserCurrency(newBalance);
      setSuccessMessage(`You bought it! ${item.name}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      // Navigate to a different route
      navigate('/shape', { state: { selectedItem: item } });
    } catch (error) {
      // Set error state and log the error if purchase fails
      setError("Something went wrong");
      console.error("Here's what went wrong", error);
    }
  };
  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <div className="currency-display">
          Your Balance: {userCurrency} coins
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      <div className="items-grid">
        {shopItems.map(item => (
          <div key={item.id} className="shop-item">
            <h2>{item.name}</h2>
            <img src={item.image} alt={item.name} className="item-image"/>
            <p className="item-price">{item.price} Coins</p>
            <button
              onClick={() => handlePurchase(item)}
              className="purchase-button"
              disabled={userCurrency < item.price}
            >
              {userCurrency < item.price ? 'Out of money' : 'Purchase'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
// Export Shop default export
export default Shop;