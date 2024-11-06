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
// Import shop icons
import { Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem } from 'lucide-react';
// An array of shop items with details
const shopItems = [
  { id: 1, name: "Apple Icon", price: 200, featured: false },
  { id: 2, name: "Banana Icon", price: 200, featured: true },
  { id: 3, name: "Cherry Icon", price: 250, featured: true },
  { id: 4, name: "Grape Icon", price: 300, featured: true },
  { id: 5, name: "Candy Icon", price: 300, featured: true },
  { id: 6, name: "Pizza Icon", price: 400, featured: true },
  { id: 7, name: "Croissant Icon", price: 500, featured: true },
  { id: 8, name: "Gem Icon", price: 1000, featured: true }
];
// Function to render the correct icon based on item id
const renderItemIcon = (id) => {
  switch (id) {
    case 1: return <Apple className="item-icon" />;
    case 2: return <Banana className="item-icon" />;
    case 3: return <Cherry className="item-icon" />;
    case 4: return <Grape className="item-icon" />;
    case 5: return <Candy className="item-icon" />;
    case 6: return <Pizza className="item-icon" />;
    case 7: return <Croissant className="item-icon" />;
    case 8: return <Gem className="item-icon" />;
    default: return <Apple className="item-icon" />; 
  }
};
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
    // Define an asynchronous function to fetch user data
    const fetchUserData = async () => {
      // Check if the user is a guest
      if (authType === 'Guest') {
        // Load the guest currency from localStorage, defaulting to 500 if not found
        const guestCurrency = parseInt(localStorage.getItem('guestCurrency')) || 500;
        setUserCurrency(guestCurrency);
        
        // Load the guest inventory from localStorage
        const guestInventory = JSON.parse(localStorage.getItem('guestInventory')) || {};
        setInventory(guestInventory);
      } else {
        // For signed-in users, fetch data from Firestore
        const userId = auth?.currentUser?.uid;
        // Check if the user is authenticated
        if (userId) {
          try {
            // Get the user document from Firestore
            const userDoc = await getDoc(doc(db, 'Users', userId));
            // Check if the user document exists
            if (userDoc.exists()) {
              // Set user currency from Firestore, defaulting to 0 if not present
              setUserCurrency(userDoc.data().virtualCurrency || 0);
              // Set user inventory from Firestore
              setInventory(userDoc.data().inventory || {});
            } else {
              // Set an error message if the user document is not found
              setError("User document not found");
            }
          } catch (error) {
            // Set an error message if there is an issue fetching user data
            setError("Error fetching user data");
            // Log the error for debugging
            console.error("Error:", error);
          }
        }
      }
    };
    // Call the fetchUserData function
    fetchUserData();
  }, [authType, auth]);
  // Function to handle purchasing items
  const handlePurchase = async (item) => {
    // Check if the user has enough currency to purchase the item
    if (userCurrency < item.price) {
      setError("You need more money");
      return;
    }
    // Check if the item has already been purchased
    if (inventory[item.id]) {
      setError("You already own this item");
      return;
    }
    if (authType === 'Guest') {
      // For guests, update the balance and inventory in localStorage
      const newBalance = userCurrency - item.price;
      localStorage.setItem('guestCurrency', newBalance); // Update currency in localStorage
      setUserCurrency(newBalance);
      // Update the inventory in localStorage
      const guestInventory = { ...inventory, [item.id]: true };
      localStorage.setItem('guestInventory', JSON.stringify(guestInventory));
      setInventory(guestInventory);
      // Show success message for the purchase
      setSuccessMessage(`You bought it! ${item.name}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      // For signed-in users, update Firestore
      try {
        // Reference the user's document in Firestore
        const userRef = doc(db, 'Users', auth.currentUser.uid);
        // Calculate the new balance after the purchase
        const newBalance = userCurrency - item.price;
        // Update the user's currency and inventory in Firestore
        await updateDoc(userRef, {
          virtualCurrency: newBalance,
          [`inventory.${item.id}`]: true
        });
        // Update the user currency in the component state
        setUserCurrency(newBalance);
        // Update the inventory state to reflect the purchase
        setInventory(prevInventory => ({ ...prevInventory, [item.id]: true }));
        // Set a success message to notify the user of the successful purchase
        setSuccessMessage(`You bought it! ${item.name}!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        // Navigate to the shape page, passing the selected item as state
        navigate('/shape', { state: { selectedItem: item } });
      } catch (error) {
        // Set an error message if the purchase process fails
        setError("Something went wrong");
        // Log the error for debugging
        console.error("Error during purchase:", error);
      }
    }
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
          {renderItemIcon(item.id)}
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
}
// Export the Shop component as default
export default Shop;