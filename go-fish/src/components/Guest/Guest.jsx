import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird } from 'lucide-react';
import './Guest.css';
import guestMusic from '../../assets/guest-music.mp3';

const Guest = () => {
  const [username, setUsername] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [step, setStep] = useState(1); // Multi-step form step
  const [error, setError] = useState('');
  const [audio] = useState(new Audio(guestMusic));
  const navigate = useNavigate();
  
  useEffect(() => {
    // Clear local storage when visiting Guest login to prevent previous user data from being retained
    localStorage.clear();

    audio.loop = true;
    audio.play().catch((err) => console.log("Music playback error:", err));

    return () => {

      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  
  const toggleMusic = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.log("Music playback error:", err));
    }
    setIsPlaying(!isPlaying);
  };


  // Handle guest account creation
  const handleGuestSignup = async (e) => {
    e.preventDefault();

    if (!selectedLogo || !username) {
      setError('Please choose an icon and enter a username');
      return;
    }

    try {
      const guestId = 'guest_' + Math.random().toString(36).substr(2, 9); // Generate a random guest ID

      // Initialize guest data for Firestore and local storage
      const initialCurrency = 500;
      const initialInventory = {}; // Start with an empty inventory
      const initialUnlockedIcons = [selectedLogo]; // Initially unlock only the selected logo

      // Save guest data to Firestore
      await setDoc(doc(db, 'Guests', guestId), {
        username: username,
        logo: selectedLogo, // Store the selected logo identifier
        virtualCurrency: initialCurrency,
        inventory: initialInventory,
        unlockedIcons: initialUnlockedIcons,
      });

      // Store session type and guest info in local storage
      localStorage.setItem('authType', 'Guest');
      localStorage.setItem('guestId', guestId); // Store guest ID for deletion later
      localStorage.setItem('username', username);
      localStorage.setItem('logo', selectedLogo);
      localStorage.setItem('guestCurrency', initialCurrency);
      localStorage.setItem('guestInventory', JSON.stringify(initialInventory));
      localStorage.setItem('guestUnlockedIcons', JSON.stringify(initialUnlockedIcons));

      // Stop the music when navigating to the Home page
      audio.pause();
      navigate('/home');
    } catch (error) {
      setError(error.message);
    }
  };
  const handleNextStep = () => {
    if (username) {
      setStep(2);
    } else {
      setError('Please enter your username');
    }
  };

  // Handle logo selection
  const handleLogoClick = (logoCode) => {
    setSelectedLogo(logoCode);
  };

  return (
    <div className="guest-container">
      {step === 1 ? (
        <>
          <h1 className="guest-title">Join as Guest</h1>
          {error && <p className="error-message">{error}</p>}
          <div className="guest-form">
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="guest-input" 
            />
          </div>
          <button className="guest-button" onClick={handleNextStep}>Submit</button>
          <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        </>
      ) : (
        <>
          <h2 className="icon-selection-title">Select Your Icon</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="icon-container">
            <div className={`team-logo ${selectedLogo === 'Cat' ? 'selected' : ''}`} onClick={() => handleLogoClick('Cat')}>
              <Cat className="glowing-icon" />
            </div>
            <div className={`team-logo ${selectedLogo === 'Ghost' ? 'selected' : ''}`} onClick={() => handleLogoClick('Ghost')}>
              <Ghost className="glowing-icon" />
            </div>
            <div className={`team-logo ${selectedLogo === 'Dog' ? 'selected' : ''}`} onClick={() => handleLogoClick('Dog')}>
              <Dog className="glowing-icon" />
            </div>
            <div className={`team-logo ${selectedLogo === 'Bot' ? 'selected' : ''}`} onClick={() => handleLogoClick('Bot')}>
              <Bot className="glowing-icon" />
            </div>
            <div className={`team-logo ${selectedLogo === 'Bird' ? 'selected' : ''}`} onClick={() => handleLogoClick('Bird')}>
              <Bird className="glowing-icon" />
            </div>
          </div>
          <button className="guest-button" onClick={handleGuestSignup}>Join as Guest</button>
          <button className="back-button" onClick={() => setStep(1)}>Back</button>
        </>
      )}
    </div>
  );
};

export default Guest;
