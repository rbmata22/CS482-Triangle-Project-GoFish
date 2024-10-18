import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LAL, MIA, GSW, NYK, BOS } from 'react-nba-logos';
import './Guest.css';

const Guest = () => {
  const [username, setUsername] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGuestSignup = async (e) => {
    e.preventDefault();

    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const guestId = 'guest_' + Math.random().toString(36).substr(2, 9); // Generate a random guest ID

      // Create guest document in Firestore
      await setDoc(doc(db, 'Guests', guestId), {
        username: username,
        logo: selectedLogo, // Store 3-letter team code
        virtualCurrency: 500,
      });

      // Navigate to the Home page after joining as a guest
      navigate('/home');
    } catch (error) {
      setError(error.message);
    }
  };

  // Define click handlers for each logo
  const handleLogoClick = (logoCode) => {
    setSelectedLogo(logoCode);
  };

  return (
    <div className="guest-container">
      <h2 className="team-selection-title">Enter Username and Select Team Logo</h2>
      {error && <p className="error-message">{error}</p>}
      <input 
        type="text" 
        placeholder="Username" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
        className="guest-input"
      />
      <div className="logo-container-horizontal">
        <div className={`team-logo ${selectedLogo === 'LAL' ? 'selected' : ''}`} onClick={() => handleLogoClick('LAL')}>
          <LAL className="glowing-logo" />
        </div>
        <div className={`team-logo ${selectedLogo === 'MIA' ? 'selected' : ''}`} onClick={() => handleLogoClick('MIA')}>
          <MIA className="glowing-logo" />
        </div>
        <div className={`team-logo ${selectedLogo === 'GSW' ? 'selected' : ''}`} onClick={() => handleLogoClick('GSW')}>
          <GSW className="glowing-logo" />
        </div>
        <div className={`team-logo ${selectedLogo === 'NYK' ? 'selected' : ''}`} onClick={() => handleLogoClick('NYK')}>
          <NYK className="glowing-logo" />
        </div>
        <div className={`team-logo ${selectedLogo === 'BOS' ? 'selected' : ''}`} onClick={() => handleLogoClick('BOS')}>
          <BOS className="glowing-logo" />
        </div>
      </div>
      <button className="guest-button" onClick={handleGuestSignup}>Join as Guest</button>
      <button className="back-button" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default Guest;
