import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird } from 'lucide-react';
import './SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  // Initial and unlockable icons for Firestore storage
  const initialIcons = ['Cat', 'Ghost', 'Dog', 'Bot', 'Bird'];
  const unlockableIcons = ['Apple', 'Banana', 'Cherry', 'Grape', 'Candy', 'Pizza', 'Croissant', 'Gem'];

  useEffect(() => {
    // Clear any leftover user data on mount to prevent conflicts
    localStorage.clear();
  }, []);

  // Handle email and password signup
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details in Firestore, including timestamp and unlocked icons
      await setDoc(doc(db, 'Users', user.uid), {
        username: username,
        logo: selectedLogo,
        emailAccount: true,
        googleAccount: false,
        virtualCurrency: 500,
        friends: [],
        gamesPlayed: 0,
        gamesWon: 0,
        initialIcons: initialIcons,
        unlockableIcons: unlockableIcons,
        unlockedIcons: [selectedLogo],
        createdAt: serverTimestamp(),
      });

      localStorage.setItem('authType', 'SignUp');
      localStorage.setItem('username', username);
      localStorage.setItem('logo', selectedLogo);
      navigate('/home');
    } catch (error) {
      setError(error.message);
    }
  };

  const isValidEmail = (email) => email.includes('@');

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'Users', user.uid));

      if (!userDoc.exists()) {
        setIsGoogleUser(true);
        setStep(2);
      } else {
        navigate('/home');
      }
    } catch (error) {
      setError('Failed to sign up with Google: ' + error.message);
    }
  };

  const handleNextStep = () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Invalid email');
      return;
    }

    setStep(2);
  };

  const handleLogoClick = (logo) => {
    setSelectedLogo(logo);
  };

  const handleGoogleUsernameLogoSubmit = async () => {
    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const user = auth.currentUser;

      // Store Google user details in Firestore, with only selected icon unlocked
      await setDoc(doc(db, 'Users', user.uid), {
        username: username,
        logo: selectedLogo,
        emailAccount: false,
        googleAccount: true,
        virtualCurrency: 500,
        friends: [],
        gamesPlayed: 0,
        gamesWon: 0,
        initialIcons: initialIcons,
        unlockableIcons: unlockableIcons,
        unlockedIcons: [selectedLogo],
        createdAt: serverTimestamp(),
      });

      localStorage.setItem('authType', 'SignUp');
      navigate('/home');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="signup-container">
      {step === 1 ? (
        <>
          <h1 className="signup-title">Sign Up</h1>
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
          <button className="google-signup-button" onClick={handleGoogleSignUp}>Sign Up with Google</button>
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
            {initialIcons.map((icon) => (
              <div
                key={icon}
                className={`team-logo ${selectedLogo === icon ? 'selected' : ''}`}
                onClick={() => handleLogoClick(icon)}
              >
                {icon === 'Cat' && <Cat className="glowing-icon" />}
                {icon === 'Ghost' && <Ghost className="glowing-icon" />}
                {icon === 'Dog' && <Dog className="glowing-icon" />}
                {icon === 'Bot' && <Bot className="glowing-icon" />}
                {icon === 'Bird' && <Bird className="glowing-icon" />}
                <p>{icon}</p>
              </div>
            ))}
          </div>
          <button className="signup-button" onClick={isGoogleUser ? handleGoogleUsernameLogoSubmit : handleSignUp}>Create Account</button>
          <button className="back-button" onClick={() => setStep(1)}>Back</button>
        </>
      )}
    </div>
  );
};

export default SignUp;
