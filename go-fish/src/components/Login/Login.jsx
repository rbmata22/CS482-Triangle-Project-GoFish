import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { Cat, Ghost, Dog, Bot, Bird } from 'lucide-react';
import { db } from '../config/firebase';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [setIsGoogleUser] = useState(false); // Track Google login
  const [step, setStep] = useState(1); // Control login flow (if username selection is needed)
  const [username, setUsername] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('');
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    const authType = localStorage.getItem('authType');
    if (authType === 'Login') {
      setStep(1);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'Users', user.uid));

      if (!userDoc.exists()) {
        setError('User does not exist');
        return;
      }

      localStorage.setItem('authType', 'Login');
      localStorage.setItem('username', userDoc.data().username);
      localStorage.setItem('logo', userDoc.data().logo);

      // Redirect to the home page after successful login
      navigate('/home');
    } catch {
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
        // If user exists, skip username/logo selection and go to Home
        localStorage.setItem('authType', 'Login');
        localStorage.setItem('username', userDoc.data().username);
        localStorage.setItem('logo', userDoc.data().logo);
        navigate('/home');
      } else {
        // If the user does not exist, show username/logo selection screen
        setIsGoogleUser(true);
        setStep(2); // Move to username/logo selection step
      }
    } catch (error) {
      setError('Failed to log in with Google: ' + error.message);
    }
  };

  // Handle username and logo selection for new Google users
  const handleGoogleUsernameLogoSubmit = async () => {
    if (!selectedLogo || !username) {
      setError('Please choose a logo and enter a username');
      return;
    }

    try {
      const user = auth.currentUser;

      // Save Google user data in Firestore
      await getDoc(doc(db, 'Users', user.uid), {
        username: username,
        logo: selectedLogo,
        emailAccount: false,
        googleAccount: true,
        virtualCurrency: 500,
        friends: [],
        gamesPlayed: 0,
        gamesWon: 0,
      });

      localStorage.setItem('authType', 'Login');
      localStorage.setItem('username', username);
      localStorage.setItem('logo', selectedLogo);
      navigate('/home');
    } catch (error) {
      setError('Error saving user data: ' + error.message);
    }
  };

  // Handle logo selection
  const handleLogoClick = (logoCode) => {
    setSelectedLogo(logoCode);
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
          <button className="login-button" onClick={handleGoogleUsernameLogoSubmit}>Complete Profile</button>
          <button className="back-button" onClick={() => setStep(1)}>Back</button>
        </>
      )}
    </div>
  );
};

export default Login;
