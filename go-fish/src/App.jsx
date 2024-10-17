import './App.css';
import {  Dices, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, VenetianMask, LogIn, Plus } from 'lucide-react';

function App() {
  return (
    <div className="app-container">
      {/* Animated Background Aura */}
      <div className="aura-background"></div>

      {/* Main Logo Icon on Top */}
      <div className="icon-on-top">
        <Dices className="glowing-dice" size={160} /> {/* Adjusted size directly */}
      </div>

      {/* Main Title with Aura Glow */}
      <h1 className="main-title">Bui's Bayside Inn</h1>

      {/* Login Buttons with Icons */}
      <div className="login-buttons">
        <button className="login-btn"><LogIn size={30} /> Login</button>
        <button className="create-btn"><Plus size={30} /> Create</button>
        <button className="guest-btn"><VenetianMask size={30} /> Guest</button>
      </div>

      {/* Rotating and Glowing Dice Icons Under Buttons */}
      <div className="dice-container">
        <Dice1 className="icon glowing-dice rotating" size={80} />
        <Dice2 className="icon glowing-dice rotating" size={80} />
        <Dice3 className="icon glowing-dice rotating" size={80} />
        <Dice4 className="icon glowing-dice rotating" size={80} />
        <Dice5 className="icon glowing-dice rotating" size={80} />
        <Dice6 className="icon glowing-dice rotating" size={80} />
      </div>
    </div>
  );
}

export default App;
