import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem, Dices, BadgeDollarSign, ChevronDown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Support from './Support/Support';
import './Home.css';
import homeMusic from '../assets/home-music.mp3'; 

const Home = () => {
  const [showSupport, setShowSupport] = useState(false);
  const [userData, setUserData] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [showJoinDropdown, setShowJoinDropdown] = useState(false);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [showIconChangeMenu, setShowIconChangeMenu] = useState(false);
  const [ownerLeftMessage, setOwnerLeftMessage] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); // Music state
  const [audio] = useState(new Audio(homeMusic)); // Initialize home music
  const navigate = useNavigate();
  const authType = localStorage.getItem('authType');

  const iconComponents = {
    Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem,
    default: Dices,
  };

  useEffect(() => {
    // Handle owner-left message
    const message = localStorage.getItem('ownerLeftMessage');
    if (message) {
      setOwnerLeftMessage(message);
      localStorage.removeItem('ownerLeftMessage');
    }

    // Fetch user data
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
  }, [authType, audio]);

  const toggleMusic = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.log('Music playback error:', err));
    }
    setIsPlaying(!isPlaying);
  };

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
          <button className="main-button" onClick={() => handleNavigate('/create-lobby')}>Create Lobby</button>
          <button className="main-button" onClick={() => handleNavigate('/join-lobby')}>Join Lobby</button>
          <button className="main-button" onClick={() => handleNavigate('/tutorial')}>Tutorial</button>
        </div>
      </div>
    </div>
  );
};
export default Home;