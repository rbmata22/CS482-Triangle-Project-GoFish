import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cat, Ghost, Dog, BadgeDollarSign, Bird } from 'lucide-react';
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

      // Save selectedLogo image URL to Firestore
      const logoUrl = `/mnt/data/${selectedLogo}.png`; // Use uploaded PNG files for logos

      // Create user document in Firestore with logo stored as the image URL
      await setDoc(doc(db, 'Users', user.uid), {
        username: username,
        logo: logoUrl, // Store the logo URL here
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
        logo: '/mnt/data/Cat.png', // Default logo for Google sign-in
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

  // Handle logo click to set the selected logo
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
          <h2 className="team-selection-title">Enter Username and Select Your Icon</h2>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="signup-input"
          />
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
            <div className={`team-logo ${selectedLogo === 'BadgeDollarSign' ? 'selected' : ''}`} onClick={() => handleLogoClick('BadgeDollarSign')}>
              <BadgeDollarSign className="glowing-icon" />
            </div>
            <div className={`team-logo ${selectedLogo === 'Bird' ? 'selected' : ''}`} onClick={() => handleLogoClick('Bird')}>
              <Bird className="glowing-icon" />
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
