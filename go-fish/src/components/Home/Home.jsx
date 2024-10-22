import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Dices } from 'lucide-react';
import Support from './Support/Support';
import './Home.css';

const Home = () => {
  const [userData, setUserData] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
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

  const handleSupportClick = () => {
    setIsVisible(!isVisible);
  }

  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };

  const handleInputSubmit = (event) => {
    if (event.key === 'Enter' && userInput.trim() !== '') {
      setChatLog([...chatLog, userInput]);
      setUserInput('');
    }
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <div className="user-info">
          <img src={`/${userData.logo}.png`} alt="team-logo" className="team-logo" />
          <p className="username">{userData.username}</p>
          <p className="currency">
            <span className="currency-symbol">💰</span> {userData.virtualCurrency}
          </p>
        </div>
        <div className="sidebar-options">
          <button className="sidebar-button" onClick={() => handleNavigate('/friends')}>Friends</button>
          <button className="sidebar-button" onClick={() => handleNavigate('/Messages')}>Messages</button>
          <button className="sidebar-button" onClick={() => handleNavigate('/shop')}>Shop</button>
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

      <div className="support">
        <button className="support-button" onClick={handleSupportClick}>
          Admin Support
        </button>
        {isVisible && (
          <Support 
            userInput={userInput}
            onInputChange={handleInputChange}
            onInputSubmit={handleInputSubmit}
            chatLog={chatLog}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
