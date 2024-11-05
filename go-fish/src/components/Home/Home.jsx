import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc, deleteDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird, Dices, BadgeDollarSign, ChevronDown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Support from './Support/Support';
import './Home.css';

const Home = () => {
  const [showSupport, setShowSupport] = useState(false);
  const [userData, setUserData] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [showJoinDropdown, setShowJoinDropdown] = useState(false);
  const [ownerLeftMessage, setOwnerLeftMessage] = useState(null);
  const navigate = useNavigate();
  const authType = localStorage.getItem('authType');

  useEffect(() => {
    // Check for the "owner has left" message in localStorage
    const message = localStorage.getItem('ownerLeftMessage');
    if (message) {
      setOwnerLeftMessage(message);
      localStorage.removeItem('ownerLeftMessage');
    }

    const fetchUserData = async () => {
      if (authType === 'Guest') {
        const guestUsername = localStorage.getItem('username');
        const guestLogo = localStorage.getItem('logo');
        const guestId = localStorage.getItem('guestId');
        setUserData({
          username: guestUsername,
          logo: guestLogo,
          guestId: guestId,
          virtualCurrency: 500,
        });
      } else {
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
    setShowDropdown(false);
    setShowJoinDropdown(false);
  };

  const handleLogout = async () => {
    try {
      if (authType === 'Guest') {
        const guestId = localStorage.getItem('guestId');
        if (guestId) {
          await deleteDoc(doc(db, 'Guests', guestId));
        }
        localStorage.clear();
      }
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout failed: ', error);
    }
  };

  const toggleSupport = () => {
    setShowSupport(!showSupport);
  };

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
        return <Dices className="user-logo" />;
    }
  };

  const handlePlayerLeave = async (lobbyId) => {
    if (userData.username) {
      const lobbyRef = doc(db, 'Lobbies', lobbyId);
      await updateDoc(lobbyRef, {
        players: arrayRemove({
          username: userData.username,
          logo: userData.logo,
          isReady: false,
        }),
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown') && !event.target.closest('.join-dropdown')) {
        setShowDropdown(false);
        setShowJoinDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="home-container">
      {ownerLeftMessage && (
        <div className="alert-message">
          <p>{ownerLeftMessage}</p>
        </div>
      )}
      
      <div className="sidebar">
        <div className="user-info">
          {renderUserLogo()}
          <p className="username">{userData.username}</p>
          <p className="currency">
            <BadgeDollarSign className="currency-icon" style={{ stroke: 'black', fill: 'green' }} />
            <span className="currency-value">{userData.virtualCurrency}</span>
          </p>
        </div>
        <div className="sidebar-options">
          <button className="sidebar-button" onClick={() => handleNavigate('/Friends')}>Friends</button>
          <button className="sidebar-button" onClick={() => handleNavigate('/Messages')}>Messages</button>
          <button className="sidebar-button" onClick={() => handleNavigate('/shop')}>Shop</button>

          <button className="sidebar-button" onClick={handleLogout}>Logout</button>
          <button className="support-button" onClick={toggleSupport}>Admin Support</button>
          {showSupport && <Support onClose={() => setShowSupport(false)} />}
        </div>
      </div>

      <div className="main-content">
        <div className="central-image">
          <Dices className="central-dice" />
        </div>
        <div className="main-options">
          <div className="dropdown">
            <button className="main-button create-lobby-button" onClick={() => setShowDropdown(!showDropdown)}>
              Create Lobby <ChevronDown className="dropdown-icon" size={150} />
            </button>
            {showDropdown && (
              <div className="dropdown-content show">
                <button onClick={() => handleNavigate('/create-public')}>Public Lobby</button>
                <button onClick={() => handleNavigate('/create-private')}>Private Lobby</button>
              </div>
            )}
          </div>
          <div className="join-dropdown">
            <button className="main-button join-lobby-button" onClick={() => setShowJoinDropdown(!showJoinDropdown)}>
              Join Lobby <ChevronDown className="dropdown-icon" size={150} />
            </button>
            {showJoinDropdown && (
              <div className="dropdown-content show">
                <button onClick={() => handleNavigate('/join-public')}>Join Public</button>
                <button onClick={() => handleNavigate('/join-private')}>Join Private</button>
              </div>
            )}
          </div>
          <button className="main-button" onClick={() => handleNavigate('/tutorial')}>Tutorial</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
