import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../config/firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import './Bet.css';

const Bet = () => {
  const { lobbyId } = useParams();
  const [userData, setUserData] = useState({});
  const [betAmount, setBetAmount] = useState(0);
  const [totalBetPool, setTotalBetPool] = useState(0);
  const [allBetsPlaced, setAllBetsPlaced] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Function to fetch user data from localStorage
  const fetchUserData = async () => {
    const guestUsername = localStorage.getItem('username');
    const guestLogo = localStorage.getItem('logo');
    const guestId = localStorage.getItem('guestId');
    setUserData({
      username: guestUsername,
      logo: guestLogo,
      guestId: guestId,
      virtualCurrency: 500,
      isReady: false,
    });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleBetChange = (value) => {
    if (value <= userData.virtualCurrency) {
      setBetAmount(value);
    }
  };

  const handlePlaceBet = async () => {
    if (betAmount > 0 && betAmount <= userData.virtualCurrency) {
      setIsLoading(true); // Show loading animation
      try {
        const betRef = doc(db, 'Bets', lobbyId);

        // Update the Bets document with the user's bet and adjust the total
        await updateDoc(betRef, {
          players: arrayUnion({ username: userData.username, bet: betAmount }),
          total: (totalBetPool || 0) + betAmount,
        });

        // Deduct the bet amount from user's currency
        setUserData((prevData) => ({
          ...prevData,
          virtualCurrency: prevData.virtualCurrency - betAmount,
        }));

        // Set loading state and show "Bet Placed" message
        setIsLoading(false);
        setBetPlaced(true);

        // Reset the "Bet Placed" message after 3 seconds
        setTimeout(() => setBetPlaced(false), 3000);
      } catch (error) {
        console.error("Error placing bet:", error);
        setIsLoading(false); // Reset loading if there's an error
      }
    }
  };

  // Watch the total bet pool in real-time and check if all players have placed their bets
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'Bets', lobbyId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTotalBetPool(data.total || 0);

        if (data.players && data.players.length >= 2) { // Adjust '2' based on actual player limit
          setAllBetsPlaced(true);
        }
      }
    });

    return () => unsubscribe();
  }, [lobbyId]);

  // Redirect all players to results page when all bets are placed
  useEffect(() => {
    if (allBetsPlaced) {
      navigate(`/results/${lobbyId}`);
    }
  }, [allBetsPlaced, lobbyId, navigate]);

  return (
    <div className="bet-container">
      <h2 className="bet-header">Place Your Bet</h2>
      <div className="user-currency">Current Currency: ${userData.virtualCurrency}</div>

      <Slider
        min={0}
        max={userData.virtualCurrency || 0}
        value={betAmount}
        onChange={handleBetChange}
        trackStyle={{ backgroundColor: '#1E90FF', height: 8 }}
        handleStyle={{
          borderColor: '#00FFFF',
          height: 24,
          width: 24,
          backgroundColor: '#111',
        }}
        railStyle={{ backgroundColor: '#333', height: 8 }}
        className="bet-slider"
      />
      <div className="bet-amount">Bet Amount: ${betAmount}</div>
      
      <button
        className="place-bet-button"
        onClick={handlePlaceBet}
        disabled={betAmount === 0 || betPlaced || allBetsPlaced || isLoading}
      >
        {isLoading ? <span className="loading-spinner"></span> : "Place Bet"}
      </button>

      {betPlaced && <div className="bet-placed-message">Bet Placed!</div>}

      {allBetsPlaced && (
        <div className="total-bet-pool">
          Total Bet Pool: ${totalBetPool}
        </div>
      )}
    </div>
  );
};

export default Bet;
