import React, { useState } from 'react';
import { BadgeDollarSign, X } from 'lucide-react';

const BetPopUp = ({ onClose, userData, onPlaceBet }) => {
  const [betAmount, setBetAmount] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (betAmount <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }
    if (betAmount > userData.virtualCurrency) {
      alert('Insufficient funds!');
      return;
    }
    onPlaceBet(betAmount);
    onClose();
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Place Your Bet</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-white mb-4">
            <BadgeDollarSign className="text-green-500" />
            <span>Your Balance: {userData.virtualCurrency}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bet Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <BadgeDollarSign size={16} className="text-gray-400" />
              </span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="0"
                max={userData.virtualCurrency}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              Place Bet
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
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