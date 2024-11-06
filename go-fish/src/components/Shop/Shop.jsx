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
// Import music for the shop
import backgroundMusic from '../../assets/background-music.mp3';
// Import shop icons from Lucide
import { Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem } from 'lucide-react';
// Import sound effects for purchase errors
import purchaseErrorSound from '../../assets/purchase-error.mp3';
// Import sound effects for purchase success
import purchaseSuccessSound from '../../assets/purchase-succesful.mp3';
// An array of shop items with details
const shopItems = [
  { id: 1, name: "Apple Icon", price: 200, icon: Apple },
  { id: 2, name: "Banana Icon", price: 200, icon: Banana },
  { id: 3, name: "Cherry Icon", price: 250, icon: Cherry },
  { id: 4, name: "Grape Icon", price: 300, icon: Grape },
  { id: 5, name: "Candy Icon", price: 300, icon: Candy },
  { id: 6, name: "Pizza Icon", price: 400, icon: Pizza },
  { id: 7, name: "Croissant Icon", price: 500, icon: Croissant },
  { id: 8, name: "Gem Icon", price: 1000, icon: Gem }
];
// Shop component
const Shop = () => {
  // Define state for user currency
  const [userCurrency, setUserCurrency] = useState(0);
  // Define state for displaying error messages
  const [error, setError] = useState('');
  // Define state for displaying success messages
  const [successMessage, setSuccessMessage] = useState('');
  // Define state to store the inventory (items that have been purchased)
  const [inventory, setInventory] = useState({});
  // Create an Audio instance for background music and store it in state
  const [audio] = useState(new Audio(backgroundMusic));
  // Define state for tracking if music is playing
  const [isPlaying, setIsPlaying] = useState(true);
  // Initialize Firebase authentication instance
  const auth = getAuth();
  // Initialize navigation hook to allow redirecting users to different pages
  const navigate = useNavigate();
  // Retrieve the authentication type (e.g., guest or signed-in user) from localStorage
  const authType = localStorage.getItem('authType');
  // Define audio instances for success and error sounds
  const successAudio = new Audio(purchaseSuccessSound);
  const errorAudio = new Audio(purchaseErrorSound);
  //CHECK THIS OUT <Marley>, here's why I am pleased with this addition of code. It was something that really brought the whole shop component together for me. Once I got the functionality working, it was soothing, innovative, and creative. Something that would set our project apart from others.
  // Function to navigate back to the home page and stop the music
  const goHome = () => {
    // Pause the background music
    audio.pause();
    // Reset the audio play time to the beginning
    audio.currentTime = 0;
    // Navigate to the home route
    navigate('/home');
  };
  // useEffect to handle playing and looping background music on component mount
  useEffect(() => {
    // Set the audio to loop
    audio.loop = true;
    // Play the audio on component mount
    audio.play();
    // Set the isPlaying state to true
    setIsPlaying(true);
    // Cleanup function to pause the audio when the component unmounts
    return () => {
      // Pause the audio
      audio.pause();
      // Reset the audio play time to the beginning
      audio.currentTime = 0;
    };
  }, [audio]);
  // Function to toggle the music play/pause state
  const toggleMusic = () => {
    // Check if music is currently playing
    if (isPlaying) {
      // Pause the audio if it is playing
      audio.pause();
    } else {
      // Play the audio if it is paused
      audio.play();
    }
    // Toggle the isPlaying state to reflect the new audio state
    setIsPlaying(!isPlaying);
  };
  // useEffect to fetch user currency and inventory data based on authentication type
  useEffect(() => {
    const fetchUserData = async () => {
      if (authType === 'Guest') {
        // Fetch guest data from localStorage
        let guestCurrency = parseInt(localStorage.getItem('guestCurrency'));
        if (isNaN(guestCurrency)) {
          guestCurrency = 500;  // Default balance for a new guest
          localStorage.setItem('guestCurrency', guestCurrency);
        }
        setUserCurrency(guestCurrency);
        setInventory(JSON.parse(localStorage.getItem('guestInventory')) || {});
      } else {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDoc = await getDoc(doc(db, 'Users', userId));
          if (userDoc.exists()) {
            setUserCurrency(userDoc.data().virtualCurrency || 0);
            setInventory(userDoc.data().inventory || {});
          }
        }
      }
    };
    fetchUserData();
  }, [authType, auth]);
  // Function to handle purchasing items
const handlePurchase = async (item) => {
  // Check if the user has enough currency to purchase the item
  if (userCurrency < item.price) {
    setError("You need more money");
    errorAudio.play();
    return;
  }
  // Check if the item has already been purchased
  if (inventory[item.id]) {
    setError("You already own this item");
    errorAudio.play();
    return;
  }
  // Calculate the new balance after the purchase
  const newBalance = userCurrency - item.price;
  const updatedInventory = { ...inventory, [item.id]: true };
  // Update user currency in state
  setUserCurrency(newBalance);
  // Update inventory in state
  setInventory(updatedInventory);
  if (authType === 'Guest') {
    // Update guest data in localStorage
    localStorage.setItem('guestCurrency', newBalance);
    localStorage.setItem('guestInventory', JSON.stringify(updatedInventory));
  } else {
    // For signed-in users, update Firestore
    try {
      const userRef = doc(db, 'Users', auth.currentUser.uid);
      await updateDoc(userRef, {
        virtualCurrency: newBalance,
        inventory: updatedInventory
      });
    } catch (error) {
      setError("Something went wrong while updating your balance");
      console.error("Error during purchase:", error);
      errorAudio.play();
      return;
    }
  }
  setSuccessMessage(`You bought ${item.name}!`);
  successAudio.play(); 
  setTimeout(() => setSuccessMessage(''), 3000);
};
  // Render each item’s icon, conditionally applying spin if not purchased
  const renderItemIcon = (itemId, IconComponent) => {
    const isPurchased = inventory[itemId];
    return <IconComponent className={`item-icon ${!isPurchased ? "spin" : ""}`} />;
  };
  // Render the Shop component UI
  return (
    <div className="shop-container">
      {/* Header section of the shop */}
      <div className="shop-header">
        {/* Container for navigation buttons */}
        <div className="button-container">
          {/* Home button to navigate back to home */}
          <button className="home-button" onClick={goHome}>Home</button>
          {/* Button to toggle background music */}
          <button className="music-button" onClick={toggleMusic}>
            {isPlaying ? 'Pause Music' : 'Music'}
          </button>
        </div>
        {/* Display for user currency balance */}
        <div className="currency-display">
          Your Balance: {userCurrency} coins
        </div>
      </div>
      {/* Title section of the shop */}
      <div className="shop-title-container">
        <h1 className="shop-title">Shop</h1>
      </div>
      {/* Display error messages if any */}
      {error && <div className="error-message">{error}</div>}
      {/* Display success messages if any */}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {/* Grid layout for displaying shop items */}
      <div className="items-grid">
        {/* Map over each item in shopItems array */}
        {shopItems.map(item => (
          // Container for individual shop item
          <div key={item.id} className="shop-item">
            {/* Display item name */}
            <h2>{item.name}</h2>
            {/* Display item icon based on item id */}
            {renderItemIcon(item.id, item.icon)}
            {/* Display item price */}
            <p className="item-price">{item.price} Coins</p>
            {/* Purchase button, disabled if the item is already owned */}
            <button
              onClick={() => handlePurchase(item)}
              className="purchase-button"
              disabled={inventory[item.id]}
            >
              {inventory[item.id] ? 'Purchased' : 'Purchase'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
// Export the Shop component as default
export default Shop;