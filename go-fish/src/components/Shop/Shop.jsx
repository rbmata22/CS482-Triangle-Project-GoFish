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
// Import CSS styles for Shop component
import './shop.css';
// An array of shop items with details
const shopItems = [
  {
    id: 1,
    name: "NBA Cards",
    image: "https://external-preview.redd.it/4XfJcJFWh7usKB-htKE7QdoiW2GupdFiIhqNU0X7dns.jpg?width=640&crop=smart&auto=webp&s=42be24e79f0e031252dc83454987f7f78ed2a44e",
    price: 200,
    featured: false
  },
  {
    id: 2,
    name: "Women cards",
    image: "https://www.the-outrage.com/cdn/shop/products/wc25_preview.jpeg?v=1511887627",
    price: 200,
    featured: true
  },
  {
    id: 3,
    name: "Christmas cards",
    image: "https://cdn.shopify.com/s/files/1/0041/7579/0209/files/Christmas_Playing_Cards_-_A_-_3d.webp?v=1699989088",
    price: 250,
    featured: true
  },
  {
    id: 4,
    name: "Star Wars cards",
    image: "https://cdn.shopify.com/s/files/1/0013/7332/files/resized-005_cba8f816-6559-4b89-88bf-85cf31a8b5bb.jpg?v=1650568718",
    price: 300,
    featured: true
  },
  {
    id: 5,
    name: "Marvel cards",
    image: "https://store.theory11.com/cdn/shop/files/product.avengers.court-cards_97d23a31-e43f-473d-8cb7-1eabeff01acf.png?v=1650372539&width=4000",
    price: 300,
    featured: true
  },
  {
    id: 6,
    name: "Dragon Ball Z cards",
    image: "https://tccplayingcard.com/cdn/shop/files/Dragon_Ball_Z_3.jpg?v=1723003025&width=1780",
    price: 400,
    featured: true
  },
  {
    id: 7,
    name: "Vietnamese cards",
    image: "https://cdn.myportfolio.com/e6cfaaf0-38d5-4c18-9230-8a03d0f616cb/9ce60e68-a75a-4619-8867-547dfd97d7d3_rw_1920.jpg?h=bc323e23758059e0ee248037a72c80aa",
    price: 500,
    featured: true
  },
  {
    id: 8,
    name: "SpongeBob cards",
    image: "https://ae01.alicdn.com/kf/S92677255435745c0bc3fe8fba1a127e5Z.jpg_960x960.jpg",
    price: 1000,
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
  // Navigate to the home route
  const goHome = () => {
    navigate('/home'); 
  };
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
      // Check if user document is there
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
      <button className="home-button" onClick={goHome}>Home</button>
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