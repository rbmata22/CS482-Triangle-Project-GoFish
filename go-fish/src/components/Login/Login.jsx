import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cat, Ghost, Dog, Bot, Bird } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [setIsGoogleUser] = useState(false);
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const initialIcons = ['Cat', 'Ghost', 'Dog', 'Bot', 'Bird'];

  useEffect(() => {
    localStorage.clear(); // Clear any leftover user data on mount to prevent conflicts
  }, []);

  const validateEmail = (email) => email.includes('@');

  // Handle standard email/password login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    if (!validateEmail(email)) {
      setError('Invalid email address');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'Users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Store user data in localStorage
        localStorage.setItem('authType', 'Login');
        localStorage.setItem('username', userData.username);
        localStorage.setItem('logo', userData.logo);
        localStorage.setItem('virtualCurrency', userData.virtualCurrency);
        localStorage.setItem('gamesPlayed', userData.gamesPlayed);
        localStorage.setItem('gamesWon', userData.gamesWon);
        localStorage.setItem('unlockedIcons', JSON.stringify(userData.unlockedIcons || []));

        navigate('/home');
      } else {
        setError('User does not exist');
      }
    } catch  {
      setError('Invalid login credentials');
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'Users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Store user data in localStorage
        localStorage.setItem('authType', 'Login');
        localStorage.setItem('username', userData.username);
        localStorage.setItem('logo', userData.logo);
        localStorage.setItem('virtualCurrency', userData.virtualCurrency);
        localStorage.setItem('gamesPlayed', userData.gamesPlayed);
        localStorage.setItem('gamesWon', userData.gamesWon);
        localStorage.setItem('unlockedIcons', JSON.stringify(userData.unlockedIcons || []));

        navigate('/home');
      } else {
        // Prompt new Google user to select username and logo
        setIsGoogleUser(true);
        setStep(2);
      }
    } catch {
      setError('Failed to log in with Google');
    }
  };

  const handleGoogleUsernameLogoSubmit = async () => {
    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const user = auth.currentUser;

      // Store new Google user data in Firestore
      await setDoc(doc(db, 'Users', user.uid), {
        username: username,
        logo: selectedLogo,
        emailAccount: false,
        googleAccount: true,
        virtualCurrency: 500,
        friends: [],
        gamesPlayed: 0,
        gamesWon: 0,
        unlockedIcons: [selectedLogo],
      });

      localStorage.setItem('authType', 'Login');
      localStorage.setItem('username', username);
      localStorage.setItem('logo', selectedLogo);
      localStorage.setItem('virtualCurrency', 500);
      localStorage.setItem('gamesPlayed', 0);
      localStorage.setItem('gamesWon', 0);
      localStorage.setItem('unlockedIcons', JSON.stringify([selectedLogo]));

      navigate('/home');
    } catch (error) {
      setError('Error saving user data: ' + error.message);
    }
  };

  const handleLogoClick = (logo) => {
    setSelectedLogo(logo);
  };

  return (
    <div className="login-container">
      {step === 1 ? (
        <>
          <h1 className="login-title">Login</h1>
          {error && <p className="error-message">{error}</p>}
          <div className="login-form">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="login-input"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="login-input"
            />
          </div>
          <button className="login-button" onClick={handleLogin}>Login</button>
          <button className="google-login-button" onClick={handleGoogleLogin}>Login with Google</button>
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
            className="login-input"
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
          <button className="login-button" onClick={handleGoogleUsernameLogoSubmit}>Complete Profile</button>
          <button className="back-button" onClick={() => setStep(1)}>Back</button>
        </>
      )}
    </div>
  );
};

export default Login;
