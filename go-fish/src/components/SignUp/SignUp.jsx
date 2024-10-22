import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird } from 'lucide-react'; // Using Bot instead of Dollar Sign
import './Signup.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [step, setStep] = useState(1); // Multi-step form step
  const [error, setError] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false); // To track if it's a Google signup
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  // Handle email and password signup
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details in Firestore
      await setDoc(doc(db, 'Users', user.uid), {
        username: username,
        logo: selectedLogo,
        emailAccount: true,
        googleAccount: false,
        virtualCurrency: 500,
        friends: [],
        gamesPlayed: 0,
        gamesWon: 0,
      });

      // Store session type as 'Signup' in local storage
      localStorage.setItem('authType', 'Signup');

      // Navigate to the home page after successful signup
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

      // Check if the user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'Users', user.uid));

      if (!userDoc.exists()) {
        // If the user is new, they need to pick a username and logo
        setIsGoogleUser(true);
        setStep(2); // Move to the username and logo selection step
      } else {
        // If the user already exists, skip to home
        navigate('/home');
      }
    } catch (error) {
      setError('Failed to sign up with Google: ' + error.message);
    }
  };

  // Continue to the next step (username and logo selection) for non-Google users
  const handleNextStep = () => {
    if (email && password) {
      setStep(2);
    } else {
      setError('Please enter your email and password');
    }
  };

  // Handle logo selection
  const handleLogoClick = (logoCode) => {
    setSelectedLogo(logoCode);
  };

  // Submit the username and logo for Google users
  const handleGoogleUsernameLogoSubmit = async () => {
    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const user = auth.currentUser;

      // Store Google user details in Firestore
      await setDoc(doc(db, 'Users', user.uid), {
        username: username,
        logo: selectedLogo,
        emailAccount: false,
        googleAccount: true,
        virtualCurrency: 500,
        friends: [],
        gamesPlayed: 0,
        gamesWon: 0,
      });

      // Store session type as 'Signup' in local storage
      localStorage.setItem('authType', 'Signup');

      // Navigate to the Home page
      navigate('/home');
    } catch (error) {
      setError(error.message);
    }
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
          {error && <p className="error-message">{error}</p>}
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
            <div className={`team-logo ${selectedLogo === 'Bot' ? 'selected' : ''}`} onClick={() => handleLogoClick('Bot')}>
              <Bot className="glowing-icon" />
            </div>
            <div className={`team-logo ${selectedLogo === 'Bird' ? 'selected' : ''}`} onClick={() => handleLogoClick('Bird')}>
              <Bird className="glowing-icon" />
            </div>
          </div>
          <button className="signup-button" onClick={isGoogleUser ? handleGoogleUsernameLogoSubmit : handleSignup}>Create Account</button>
          <button className="back-button" onClick={() => setStep(1)}>Back</button>
        </>
      )}
    </div>
  );
};

export default Signup;
