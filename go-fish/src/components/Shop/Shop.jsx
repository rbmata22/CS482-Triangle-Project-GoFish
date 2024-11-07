import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getDoc, doc, runTransaction, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import './shop.css';
import backgroundMusic from '../../assets/background-music.mp3';
import { Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem } from 'lucide-react';
import purchaseErrorSound from '../../assets/purchase-error.mp3';
import purchaseSuccessSound from '../../assets/purchase-succesful.mp3';

const shopItems = [
  { id: 1, name: "Apple", price: 200, icon: Apple },
  { id: 2, name: "Banana", price: 200, icon: Banana },
  { id: 3, name: "Cherry", price: 250, icon: Cherry },
  { id: 4, name: "Grape", price: 300, icon: Grape },
  { id: 5, name: "Candy", price: 300, icon: Candy },
  { id: 6, name: "Pizza", price: 400, icon: Pizza },
  { id: 7, name: "Croissant", price: 500, icon: Croissant },
  { id: 8, name: "Gem", price: 1000, icon: Gem }
];

const Shop = () => {
  const [userCurrency, setUserCurrency] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [inventory, setInventory] = useState({});
  const [audio] = useState(new Audio(backgroundMusic));
  const [isPlaying, setIsPlaying] = useState(true);
  
  const auth = getAuth();
  const navigate = useNavigate();
  const authType = localStorage.getItem('authType');
  
  const successAudio = new Audio(purchaseSuccessSound);
  const errorAudio = new Audio(purchaseErrorSound);

  const goHome = () => {
    audio.pause();
    audio.currentTime = 0;
    navigate('/home');
  };

  useEffect(() => {
    audio.loop = true;
    audio.play();
    setIsPlaying(true);
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  const toggleMusic = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (authType === 'Guest') {
        let guestCurrency = parseInt(localStorage.getItem('guestCurrency')) || 500;
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

  const handlePurchase = async (item) => {
    if (userCurrency < item.price) {
      setError("You need more money");
      errorAudio.play();
      return;
    }
    if (inventory[item.id]) {
      setError("You already own this item");
      errorAudio.play();
      return;
    }

    if (authType === 'Guest') {
      const guestId = localStorage.getItem('guestId');
      const newBalance = userCurrency - item.price;
      const updatedInventory = { ...inventory, [item.id]: true };
      setUserCurrency(newBalance);
      setInventory(updatedInventory);

      // Update guest unlocked icons in local storage and Firestore
      const guestUnlockedIcons = JSON.parse(localStorage.getItem('guestUnlockedIcons')) || [];
      guestUnlockedIcons.push(item.name);
      localStorage.setItem('guestCurrency', newBalance);
      localStorage.setItem('guestInventory', JSON.stringify(updatedInventory));
      localStorage.setItem('guestUnlockedIcons', JSON.stringify(guestUnlockedIcons));

      // Update Firestore with the guest's new balance, inventory, and unlocked icons
      try {
        const guestRef = doc(db, 'Guests', guestId);
        await setDoc(guestRef, {
          virtualCurrency: newBalance,
          inventory: updatedInventory,
          unlockedIcons: arrayUnion(item.name)
        }, { merge: true });
      } catch (error) {
        setError("Error updating guest data: " + error.message);
        console.error("Error updating guest data in Firestore:", error);
        errorAudio.play();
        return;
      }

      setSuccessMessage(`You bought ${item.name}!`);
      successAudio.play();
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      try {
        const userRef = doc(db, 'Users', auth.currentUser.uid);
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw "User does not exist";

          const currentBalance = userDoc.data().virtualCurrency || 0;
          const currentInventory = userDoc.data().inventory || {};

          if (currentBalance < item.price) {
            throw "Insufficient funds";
          }
          if (currentInventory[item.id]) {
            throw "Item already purchased";
          }

          const newBalance = currentBalance - item.price;
          const updatedInventory = { ...currentInventory, [item.id]: true };

          // Update currency, inventory, and add item to unlockedIcons array
          transaction.update(userRef, {
            virtualCurrency: newBalance,
            inventory: updatedInventory,
            unlockedIcons: arrayUnion(item.name) // Adds item name to unlockedIcons array
          });

          setUserCurrency(newBalance);
          setInventory(updatedInventory);
        });

        setSuccessMessage(`You bought ${item.name}!`);
        successAudio.play();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        setError("Transaction failed: " + error);
        console.error("Error during transaction:", error);
        errorAudio.play();
      }
    }
  };

  const renderItemIcon = (itemId, IconComponent) => {
    const isPurchased = inventory[itemId];
    return <IconComponent className={`item-icon ${!isPurchased ? "spin" : ""}`} />;
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
            {renderItemIcon(item.id, item.icon)}
            <p className="item-price">{item.price} Coins</p>
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

export default Shop;
