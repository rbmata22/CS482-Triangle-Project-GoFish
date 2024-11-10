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
  const [ setIsGoogleUser] = useState(false); // Track if Google login is used
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const initialIcons = ['Cat', 'Ghost', 'Dog', 'Bot', 'Bird'];

  useEffect(() => {
    localStorage.clear(); // Clear leftover user data on mount
  }, []);

  // Validate email format
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Handle email and password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
        setIsGoogleUser(true); // New Google user
        setStep(2);
      }
    } catch  {
      setError('Failed to log in with Google');
    }
  };

  // Submit for new Google user with selected logo and username
  const handleGoogleUsernameLogoSubmit = async () => {
    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const user = auth.currentUser;

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

      // Store in localStorage
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

  // Handle icon selection for new Google user
  const handleLogoClick = (logo) => setSelectedLogo(logo);

  return (
    <div className="login-container" data-testid="login-container">
      {step === 1 ? (
        <>
          <h1 className="login-title">Login</h1>
          {error && <p className="error-message" data-testid="error-message">{error}</p>}
          <div className="login-form">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="login-input"
              data-testid="email-input"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="login-input"
              data-testid="password-input"
            />
          </div>
          <button className="login-button" onClick={handleLogin} data-testid="login-button">Login</button>
          <button className="google-login-button" onClick={handleGoogleLogin} data-testid="google-login-button">Login with Google</button>
          <button className="back-button" onClick={() => navigate(-1)} data-testid="back-button">Back</button>
        </>
      ) : (
        <>
          <h2 className="team-selection-title">Enter Username and Select Your Icon</h2>
          {error && <p className="error-message" data-testid="error-message">{error}</p>}
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="login-input"
            data-testid="username-input"
          />
          <div className="icon-container" data-testid="icon-container">
            {initialIcons.map((icon) => (
              <div
                key={icon}
                className={`team-logo ${selectedLogo === icon ? 'selected' : ''}`}
                onClick={() => handleLogoClick(icon)}
                data-testid={`${icon.toLowerCase()}-icon`}
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
          <button className="login-button" onClick={handleGoogleUsernameLogoSubmit} data-testid="complete-profile-button">Complete Profile</button>
          <button className="back-button" onClick={() => setStep(1)} data-testid="back-to-login-button">Back</button>
        </>
      )}
    </div>
  );
};

export default Login;
