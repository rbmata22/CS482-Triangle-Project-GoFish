import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem, Dices, BadgeDollarSign, ChevronDown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Support from './Support/Support';
import homeMusic from '../../assets/home-music.mp3';
import './Home.css';

const Home = () => {
  const [showSupport, setShowSupport] = useState(false);
  const [userData, setUserData] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [showJoinDropdown, setShowJoinDropdown] = useState(false);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [showIconChangeMenu, setShowIconChangeMenu] = useState(false);
  const [ownerLeftMessage, setOwnerLeftMessage] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); 
  const audio = new Audio(homeMusic); 
  const navigate = useNavigate();
  const authType = localStorage.getItem('authType');

  const iconComponents = {
    Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem,
    default: Dices,
  };


  useEffect(() => {
    audio.loop = true;
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.log('Autoplay blocked:', err);
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);
  const toggleMusic = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.log('Music playback error:', err));
    }
    setIsPlaying(!isPlaying);
  };
  useEffect(() => {
    const message = localStorage.getItem('ownerLeftMessage');
    if (message) {
      setOwnerLeftMessage(message);
      localStorage.removeItem('ownerLeftMessage');
    }
    const fetchUserData = async () => {
      let userDocData = null;

      if (authType === 'Guest') {
        const guestId = localStorage.getItem('guestId');
        try {
          const guestDoc = await getDoc(doc(db, 'Guests', guestId));
          userDocData = guestDoc.exists() ? guestDoc.data() : null;
        } catch (error) {
          console.error("Error fetching guest data: ", error);
        }

        if (!userDocData) {
          userDocData = {
            username: localStorage.getItem('username'),
            logo: localStorage.getItem('logo'),
            guestId,
            virtualCurrency: parseInt(localStorage.getItem('guestCurrency')) || 500,
            unlockedIcons: JSON.parse(localStorage.getItem('guestUnlockedIcons')) || ['Cat', 'Ghost', 'Dog', 'Bot', 'Bird'],
            createdAt: new Date().toLocaleDateString(),
          };
        }
      } else {
        const userId = auth?.currentUser?.uid;
        if (userId) {
          try {
            const userDoc = await getDoc(doc(db, 'Users', userId));
            userDocData = userDoc.exists() ? userDoc.data() : null;
          } catch (error) {
            console.error("Error fetching user data: ", error);
          }
        }
      }

      if (userDocData) {
        setUserData({
          username: userDocData.username || 'User',
          logo: userDocData.logo || 'Dices',
          virtualCurrency: userDocData.virtualCurrency || 500,
          gamesPlayed: userDocData.gamesPlayed || 0,
          gamesWon: userDocData.gamesWon || 0,
          unlockedIcons: userDocData.unlockedIcons || ['Cat', 'Ghost', 'Dog', 'Bot', 'Bird'],
          createdAt: userDocData.createdAt || new Date().toLocaleDateString(),
        });
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

  const toggleSupport = () => setShowSupport(!showSupport);

  const renderUserLogo = () => {
    const LogoComponent = iconComponents[userData.logo] || iconComponents.default;
    return (
      <LogoComponent
        className="user-logo"
        data-testid="user-logo"
        onClick={() => setShowPlayerMenu(!showPlayerMenu)}
      />
    );
  };

  const handleIconChange = async (newIcon) => {
    if (authType === 'Guest') {
      localStorage.setItem('logo', newIcon);
      setUserData({ ...userData, logo: newIcon });
    } else {
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          const userRef = doc(db, 'Users', userId);
          await updateDoc(userRef, { logo: newIcon });
          setUserData({ ...userData, logo: newIcon });
        } catch (error) {
          console.error("Error updating icon for user: ", error);
        }
      }
    }
    setShowIconChangeMenu(false);
  };

  const renderIconChangeMenu = () => (
    <div className={`icon-change-menu ${showIconChangeMenu ? 'slide-in' : ''}`}>
      <h3>Choose Your Icon</h3>
      <p>Select an icon you've unlocked.</p>
      <div className="icon-options">
        {userData.unlockedIcons?.map((icon) => {
          const IconComponent = iconComponents[icon];
          return IconComponent ? (
            <div
              key={icon}
              className="icon-option"
              onClick={() => handleIconChange(icon)}
            >
              <IconComponent className="icon-preview" />
              <p>{icon}</p>
            </div>
          ) : null;
        })}
      </div>
      <button className="close-button" onClick={() => setShowIconChangeMenu(false)}>Close</button>
    </div>
  );

  const renderPlayerMenu = () => (
    <div className="player-menu">
      <h3>Player Stats</h3>
      <p><strong>Username:</strong> {userData.username || 'User'}</p>
      <p><strong>Games Played:</strong> {userData.gamesPlayed || 0}</p>
      <p><strong>Games Won:</strong> {userData.gamesWon || 0}</p>
      <p><strong>Virtual Currency:</strong> {userData.virtualCurrency || 500}</p>
      <p><strong>Account Created:</strong> {userData.createdAt || new Date().toLocaleDateString()}</p>
      <button onClick={() => setShowIconChangeMenu(true)}>Change Icon</button>
      <button onClick={() => setShowPlayerMenu(false)}>Close</button>
    </div>
  );

  const renderSidebarOptions = () => {
    if (authType === 'Guest') {
      return (
        <>
          <button className="sidebar-button" onClick={() => handleNavigate('/shop')}>Shop</button>
          <button className="sidebar-button" onClick={handleLogout}>Logout</button>
        </>
      );
    }
    
    return (
      <>
        <button className="sidebar-button" onClick={() => handleNavigate('/Friends')}>Friends</button>
        <button className="sidebar-button" onClick={() => handleNavigate('/Messages')}>Messages</button>
        <button className="sidebar-button" onClick={() => handleNavigate('/shop')}>Shop</button>
        <button className="sidebar-button" onClick={handleLogout}>Logout</button>
      </>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown') && !event.target.closest('.join-dropdown')) {
        setShowDropdown(false);
        setShowJoinDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
          <p className="username">{userData.username || 'User'}</p>
          <p className="currency">
            <BadgeDollarSign className="currency-icon" style={{ stroke: 'black', fill: 'green' }} />
            <span className="currency-value">{userData.virtualCurrency || 500}</span>
          </p>
        </div>
        <div className="sidebar-options">
          {renderSidebarOptions()}
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

      {showPlayerMenu && renderPlayerMenu()}
      {showIconChangeMenu && renderIconChangeMenu()}
    </div>
  );
};

export default Home;