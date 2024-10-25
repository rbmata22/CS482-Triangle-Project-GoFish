import { useNavigate } from 'react-router-dom';
import './App.css';
import { Dices, Diamond, Heart, Club, Spade, LogIn, Plus, VenetianMask } from 'lucide-react';

function App() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      {/* Animated Background Aura */}
      <div className="aura-background"></div>

      {/* Main Logo Icon on Top */}
      <div className="icon-on-top">
        <Dices className="glowing-dice" size={160} /> {/* Adjusted size directly */}
      </div>

      {/* Main Title with Aura Glow */}
      <h1 className="main-title">Bui&apos;s Bayside Inn</h1>

      {/* Login Buttons with Icons */}
      <div className="login-buttons">
        <button className="login-btn" onClick={() => navigate('/login')}>
          <LogIn size={30} /> Login
        </button>
        <button className="create-btn" onClick={() => navigate('/signup')}>
          <Plus size={30} /> Create
        </button>
        <button className="guest-btn" onClick={() => navigate('/guest')}>
          <VenetianMask size={30} /> Guest
        </button>
      </div>

      {/* Glowing and Rotating Card Suit Icons Under Buttons */}
      <div className="dice-container">
        <Diamond className="icon glowing-diamond rotating" size={80} />
        <Heart className="icon glowing-heart rotating" size={80} />
        <Club className="icon glowing-club rotating" size={80} />
        <Spade className="icon glowing-spade rotating" size={80} />
      </div>
    </div>
  );
}

export default App;