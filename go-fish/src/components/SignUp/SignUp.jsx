import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LAL, MIA, GSW, NYK, BOS } from 'react-nba-logos';
import './Signup.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [step, setStep] = useState(1); // Multi-step form step
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  // Handle signup with email and password
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore with logo stored as 3-letter symbol
      await setDoc(doc(db, 'Users', user.uid), {
        username: username,
        logo: selectedLogo, // Store 3-letter team code (e.g., 'LAL', 'MIA')
        emailAccount: true,
        googleAccount: false,
        virtualCurrency: 500,
        friends: [],
        friendRequests: [],
        gamesPlayed: 0,
        gamesWon: 0,
        bets: []
      });

      // Navigate to the Home page after successful account creation
      navigate('/home');
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle Google signup
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create Google user in Firestore
      await setDoc(doc(db, 'Users', user.uid), {
        username: user.displayName || 'GoogleUser',
        logo: 'LAL', // Set a default logo for Google sign-in
        emailAccount: false,
        googleAccount: true,
        virtualCurrency: 500,
        friends: [],
        friendRequests: [],
        gamesPlayed: 0,
        gamesWon: 0,
        bets: []
      });

      // Navigate to the Home page after successful Google sign-in
      navigate('/home');
    } catch (error) {
      setError('Failed to sign up with Google: ' + error.message);
    }
  };

  const handleNextStep = () => {
    if (email && password) {
      setStep(2);
    } else {
      setError('Please enter your email and password');
    }
  };

  // Define click handlers for each logo
  const handleLogoClick = (logoCode) => {
    setSelectedLogo(logoCode);
  };

  return (
    <div className="signup-container">
      {step === 1 ? (
        <>
          <h1 className="signup-title">Signup</h1>
          {error && <p className="error-message">{error}</p>}
          <div className="signup-form">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="signup-input" 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="signup-input" 
            />
          </div>
          <button className="signup-button" onClick={handleNextStep}>Submit</button>
          <button className="google-signup-button" onClick={handleGoogleSignup}>Sign Up with Google</button>
          <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        </>
      ) : (
        <>
          <h2 className="team-selection-title">Enter Username and Select Team Logo</h2>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="signup-input"
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
          <button className="signup-button" onClick={handleSignup}>Create Account</button>
          <button className="back-button" onClick={() => setStep(1)}>Back</button>
        </>
      )}
    </div>
  );
};

export default Signup;
