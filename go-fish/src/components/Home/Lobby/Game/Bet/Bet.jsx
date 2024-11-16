import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, X } from 'lucide-react';
import './Bet.css';

const BetPopUp = ({ onClose, userData, onPlaceBet, currentBet }) => {
  const [betAmount, setBetAmount] = useState(currentBet || 0);

  useEffect(() => {
    setBetAmount(currentBet || 0);
  }, [currentBet]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (betAmount <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }
    
    // Calculate the additional amount needed
    const additionalBet = betAmount - currentBet;
    
    if (additionalBet > userData.virtualCurrency) {
      alert('Insufficient funds!');
      return;
    }
    
    onPlaceBet(betAmount);
    onClose();
  };

  return (
    <div className="bet-popup">
      <div className="bet-popup-header">
        <div className="bet-popup-header-content">
          <h2 className="bet-popup-title">Place Your Bet</h2>
        </div>

        <div className="balance-display">
          <BadgeDollarSign className="currency-icon" />
          <span>Your Balance: {userData.virtualCurrency}</span>
          {currentBet > 0 && (
            <span className="current-bet">
              Current Bet: {currentBet}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bet-form">
          <div>
            <label className="input-label">
              Bet Amount
            </label>
            <div className="input-container">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="0"
                max={userData.virtualCurrency + currentBet}
                className="bet-input"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="place-bet-button"
            >
              {currentBet > 0 ? 'Update Bet' : 'Place Bet'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BetPopUp;