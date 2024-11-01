import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import './shop.css';
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
const Shop = () => {
  const [userCurrency, setUserCurrency] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'Users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserCurrency(userDoc.data().virtualCurrency || 0);
          }
        } catch (error) {
          setError('Error fetching user data');
          console.error('Error:', error);
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  const handlePurchase = async (item) => {
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
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        setError("Account not found");
        return;
      }
      const userData = userDoc.data();
      const newBalance = userData.virtualCurrency - item.price;
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
export default Shop;
