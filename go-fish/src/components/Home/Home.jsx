import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Dices, BadgeDollarSign, Cat, Ghost, Dog, Bird } from 'lucide-react';
import { signOut } from 'firebase/auth';  // Import signOut from Firebase
import './Home.css';

const Home = () => {
  const [userData, setUserData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth?.currentUser?.uid;
      if (userId) {
        const userDoc = await getDoc(doc(db, 'Users', userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };

    fetchUserData();
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Log the user out
      navigate('/'); // Redirect to the main App.jsx page (assuming the root path is for App.jsx)
    } catch (error) {
      console.error('Logout failed: ', error);
    }
  };

  // Render user logo based on stored value in Firestore
  const renderUserLogo = () => {
    switch (userData.logo) {
      case '/mnt/data/Cat.png':
        return <Cat className="user-logo" />;
      case '/mnt/data/Ghost.png':
        return <Ghost className="user-logo" />;
      case '/mnt/data/Dog.png':
        return <Dog className="user-logo" />;
      case '/mnt/data/Bird.png':
        return <Bird className="user-logo" />;
      case '/mnt/data/BadgeDollarSign.png':
        return <BadgeDollarSign className="user-logo" />;
      default:
        return <Dices className="user-logo" />; // Default to Dice if no logo is selected
    }
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <div className="user-info">
          {renderUserLogo()}
          <p className="username">{userData.username}</p>
          <p className="currency">
            <BadgeDollarSign className="currency-icon" />
            <span className="currency-value">{userData.virtualCurrency}</span>
          </p>
        </div>
        <div className="sidebar-options">
          <button className="sidebar-button" onClick={() => handleNavigate('/friends')}>Friends</button>
          <button className="sidebar-button" onClick={() => handleNavigate('/shop')}>Shop</button>
          {/* Add Logout Button */}
          <button className="sidebar-button" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="main-content">
        <div className="central-image">
          <Dices className="central-dice" />
        </div>
        <div className="main-options">
          <button className="main-button" onClick={() => handleNavigate('/create-lobby')}>Create Lobby</button>
          <button className="main-button" onClick={() => handleNavigate('/join-lobby')}>Join Lobby</button>
          <button className="main-button" onClick={() => handleNavigate('/tutorial')}>Tutorial</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
