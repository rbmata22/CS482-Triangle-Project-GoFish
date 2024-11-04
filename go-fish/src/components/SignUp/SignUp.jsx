import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird } from 'lucide-react'; // Using Bot instead of Dollar Sign
import './SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [step, setStep] = useState(1); // Using 2 steps for this, when you login with google
                                      // it would bypass the username and logo credentials, this fixes that
  const [error, setError] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false); // Tracks the Google Sign Ups for us
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  // Handle email and password signup
  const handleSignUp = async (e) => {
    e.preventDefault();

    // Prompts user to input their info for a logo and username
    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details in our Firestore DB
      await setDoc(doc(db, 'Users', user.uid), { // Our attributes per user
        username: username,
        logo: selectedLogo,
        emailAccount: true,
        googleAccount: false,
        virtualCurrency: 500,
        friends: [],
        gamesPlayed: 0,
        gamesWon: 0,
      });

      await setDoc(doc(db, 'UserMessages', user.uid), {
        messages: [],
      });
      
      // Store session type as 'SignUp' in local storage
      localStorage.setItem('authType', 'SignUp');

      // Navigates to the Home/HUB after successful signup
      navigate('/home');
    } catch (error) {
      setError(error.message);
    }
  };

  // Handles Google signup for users that want to sign up that way
  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if the user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'Users', user.uid));

      if (!userDoc.exists()) {

        // If the user is new, they need to pick a username and logo
        setIsGoogleUser(true);
        setStep(2); // Move to the username and logo selection step (part 2 of our process)

      } else {

        // If the user already exists, skip to home
        navigate('/home');
      }

      // Error checking
    } catch (error) {
      setError('Failed to sign up with Google: ' + error.message);
    }
  };

  // Continue to the next step (username and logo selection) for normal email users
  const handleNextStep = () => {
    if (email && password) {
      setStep(2);
    } else {
      setError('Please enter your email and password');
    }
  };

  // Handle logo selection
  const handleLogoClick = (logo) => {
    setSelectedLogo(logo);
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
        username: username, // Same logic as before
        logo: selectedLogo,
        emailAccount: false,
        googleAccount: true,
        virtualCurrency: 500,
        friends: [],
        gamesPlayed: 0,
        gamesWon: 0,
      });

      // Store session type as 'SignUp' in local storage
      localStorage.setItem('authType', 'SignUp');

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
          <h1 className="signup-title">SignUp</h1>
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

          {/* Handles our Sign in (with normal email) Logic */}
          <button className="signup-button" onClick={handleNextStep}>Submit</button>

          {/* Handles our Google Sign in Logic */}
          <button className="google-signup-button" onClick={handleGoogleSignUp}>Sign Up with Google</button>
          
          {/* Handles our redirection back to App.jsx */}
          <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        </>
      ) : (
        <>

        {/* Handles our User and Logo input Logic */}
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
          <div 
            className={`team-logo ${selectedLogo === 'Cat' ? 'selected' : ''}`} 
            onClick={() => handleLogoClick('Cat')}
            data-testid="cat-icon"
          >
            <Cat className="glowing-icon" />
          </div>

          <div 
            className={`team-logo ${selectedLogo === 'Ghost' ? 'selected' : ''}`} 
            onClick={() => handleLogoClick('Ghost')}
            data-testid="ghost-icon"
          >
            <Ghost className="glowing-icon" />
          </div>

          <div 
            className={`team-logo ${selectedLogo === 'Dog' ? 'selected' : ''}`} 
            onClick={() => handleLogoClick('Dog')}
            data-testid="dog-icon"
          >
            <Dog className="glowing-icon" />
          </div>

          <div 
            className={`team-logo ${selectedLogo === 'Bot' ? 'selected' : ''}`} 
            onClick={() => handleLogoClick('Bot')}
            data-testid="bot-icon"
          >
            <Bot className="glowing-icon" />
          </div>

          <div 
            className={`team-logo ${selectedLogo === 'Bird' ? 'selected' : ''}`} 
            onClick={() => handleLogoClick('Bird')}
            data-testid="bird-icon"
          >
            <Bird className="glowing-icon" />
          </div>
          </div>
          <button className="signup-button" onClick={isGoogleUser ? handleGoogleUsernameLogoSubmit : handleSignUp}>Create Account</button>
          <button className="back-button" onClick={() => setStep(1)}>Back</button>
        </>
      )}
    </div>
  );
};

export default SignUp;