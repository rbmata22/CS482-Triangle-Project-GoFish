import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import './Bet.css';

const Bet = () => {
  const { lobbyId, userId } = useParams();
  const [betAmount, setBetAmount] = useState('');
  const [virtualCurrency, setVirtualCurrency] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Fetch user's virtual currency from Firebase
  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        const userRef = doc(db, 'Users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setVirtualCurrency(userDoc.data().virtualCurrency);
        }
      } catch (error) {
        console.error("Error fetching user's virtual currency:", error);
      }
    };

    fetchUserCurrency();
  }, [userId]);

  // Handle placing a bet
  const handlePlaceBet = async () => {
    const bet = parseInt(betAmount, 10);

    if (isNaN(bet) || bet <= 0) {
      setErrorMessage('Please enter a valid betting amount.');
      return;
    }

    if (bet > virtualCurrency) {
      setErrorMessage('Insufficient currency for this bet.');
      return;
    }

    try {
      // Update user's currency in Users collection
      const userRef = doc(db, 'Users', userId);
      await updateDoc(userRef, {
        virtualCurrency: increment(-bet)
      });

      // Update the total betting pool in the Lobby document
      const lobbyRef = doc(db, 'Lobbies', lobbyId);
      await updateDoc(lobbyRef, {
        totalBetPool: increment(bet)
      });

      // Redirect to the game screen after placing the bet
      navigate(`/lobby/${lobbyId}/game`);
    } catch (error) {
      console.error('Error placing bet:', error);
      setErrorMessage('An error occurred while placing the bet.');
    }
  };

  return (
    <div className="bet-container">
      <h2 className="bet-title">Place Your Bet</h2>
      <p className="currency-info">Available Currency: {virtualCurrency}</p>

      <input
        type="number"
        className="bet-input"
        placeholder="Enter bet amount"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
      />

      <button className="bet-button" onClick={handlePlaceBet}>Place Bet</button>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default Bet;
