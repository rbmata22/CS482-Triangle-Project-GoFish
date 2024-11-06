// Import useState and useEffect hooks from React
import { useState, useEffect } from 'react';
// Import authentication function from Firebase authentication module
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// Import functions to interact with Firestore database
import { getDoc, doc, updateDoc } from 'firebase/firestore';
// Import the database configuration from the local config file
import { db } from '../config/firebase';
// Import the useNavigate hook from react-router-dom for navigation
import { useNavigate } from 'react-router-dom';
// Import CSS styles for Shop component
import './shop.css';
// Import music for the shop
import backgroundMusic from '../../assets/background-music.mp3';
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
// Shop component
const Shop = () => {
  // Hooks for currency, error messages, and success messages
  const [userCurrency, setUserCurrency] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Hook for controlling background music
  const [audio] = useState(new Audio(backgroundMusic));
  const [isPlaying, setIsPlaying] = useState(true);
  // Initialize Firebase Authentication
  const auth = getAuth();
  // Hook to navigate
  const navigate = useNavigate();
  // Get authType from localStorage to determine if user is a guest
  const authType = localStorage.getItem('authType');
  // Function to navigate home and stop the music
  const goHome = () => {
    audio.pause();
    audio.currentTime = 0;
    navigate('/home');
  };
  // Effect to handle music play and loop on component mount
  useEffect(() => {
    audio.loop = true;
    audio.play();
    setIsPlaying(true);
    // Cleanup function to stop music when the component unmounts
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);
  // Function to toggle music play/pause
  const toggleMusic = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  // Effect to fetch user currency based on authType
  useEffect(() => {
    const fetchUserData = async () => {
      if (authType === 'Guest') {
        // Set guest user data from localStorage
        const guestCurrency = 500;
        setUserCurrency(guestCurrency);
      } else {
        // For non-guest users, fetch data from Firestore
        const userId = auth?.currentUser?.uid;
        if (userId) {
          try {
            // Get user document from Firestore
            const userDoc = await getDoc(doc(db, 'Users', userId));
            if (userDoc.exists()) {
              setUserCurrency(userDoc.data().virtualCurrency || 0);
            } else {
              setError("User document not found");
            }
          } catch (error) {
            setError("Error fetching user data");
            console.error("Error:", error);
          }
        }
      }
    };
    fetchUserData();
  }, [authType, auth]);
  // Function to handle item purchase
  const handlePurchase = async (item) => {
    if (authType === 'Guest') {
      setError("Guest accounts cannot make purchases");
      return;
    }
    if (!auth.currentUser) {
      setError("To buy something you have to be logged in");
      return;
    }
    if (userCurrency < item.price) {
      setError("You need more money");
      return;
    }
    try {
      const userRef = doc(db, 'Users', auth.currentUser.uid);
      const newBalance = userCurrency - item.price;
      await updateDoc(userRef, {
        virtualCurrency: newBalance,
        [`inventory.${item.id}`]: true
      });
      setUserCurrency(newBalance);
      setSuccessMessage(`You bought it! ${item.name}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      navigate('/shape', { state: { selectedItem: item } });
    } catch (error) {
      setError("Something went wrong");
      console.error("Error during purchase:", error);
    }
  };
  return (
    <div className="shop-container">
      <div className="shop-header">
        <div className="button-container">
          <button className="home-button" onClick={goHome}>Home</button>
          <button className="music-button" onClick={toggleMusic}>
            {isPlaying ? 'Pause Music' : 'Music'}
          </button>
        </div>
        <div className="currency-display">
          Your Balance: {userCurrency} coins
        </div>
      </div>
      <div className="shop-title-container">
        <h1 className="shop-title">Shop</h1>
      </div>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      <div className="items-grid">
        {shopItems.map(item => (
          <div key={item.id} className="shop-item">
            <h2>{item.name}</h2>
            <img src={item.image} alt={item.name} className="item-image" />
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
export default Shop;