import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird, Dices, BadgeDollarSign } from 'lucide-react';
import { signOut } from 'firebase/auth';
import './Home.css';

const Home = () => {
  const [userData, setUserData] = useState({});
  const navigate = useNavigate();
  const authType = localStorage.getItem('authType'); // Check if user is Guest or regular user

  useEffect(() => {
    const fetchUserData = async () => {
      if (authType === 'Guest') {
        // Fetch guest data from local storage
        const guestUsername = localStorage.getItem('username');
        const guestLogo = localStorage.getItem('logo');
        setUserData({
          username: guestUsername,
          logo: guestLogo,
          virtualCurrency: 500, // Default for guests
        });
      } else {
        // Fetch signed-in user data from Firestore
        const userId = auth?.currentUser?.uid;
        if (userId) {
          const userDoc = await getDoc(doc(db, 'Users', userId));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      }
    };

    fetchUserData();
  }, [authType]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Log the user out
      localStorage.clear(); // Clear local storage
      navigate('/'); // Redirect to the main page
    } catch (error) {
      console.error('Logout failed: ', error);
    }
  };

  // Render user logo based on the stored value
  const renderUserLogo = () => {
    switch (userData.logo) {
      case 'Cat':
        return <Cat className="user-logo" />;
      case 'Ghost':
        return <Ghost className="user-logo" />;
      case 'Dog':
        return <Dog className="user-logo" />;
      case 'Bot':
        return <Bot className="user-logo" />;
      case 'Bird':
        return <Bird className="user-logo" />;
      default:
        return <Dices className="user-logo" />; // Default icon if no logo is selected
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
