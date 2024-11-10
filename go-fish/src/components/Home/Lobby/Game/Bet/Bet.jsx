import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../config/firebase';
import { BadgeDollarSign, User, Clock } from 'lucide-react';
import './Bet.css';

const Bet = () => {
  const { lobbyId } = useParams();
  const [userData, setUserData] = useState({});
  const [betAmount, setBetAmount] = useState(0);
  const [totalBettingPool, setTotalBettingPool] = useState(0);
  const [allBetsPlaced, setAllBetsPlaced] = useState(false);
  const [players, setPlayers] = useState([]);
  const [betStatus, setBetStatus] = useState("pending"); // "pending", "placed", "skipped"
  const navigate = useNavigate();

  // Fetch user data from Firestore on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          const userDoc = await getDoc(doc(db, 'Users', userId));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      }
    };
    fetchUserData();
  }, []);

  // Real-time listener for lobby data to track bets and total pool
  useEffect(() => {
    if (!lobbyId) return;

    const lobbyRef = doc(db, 'Lobbies', lobbyId);
    const unsubscribe = onSnapshot(lobbyRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTotalBettingPool(data.bettingTotal || 0);
        
        // Update player data
        const updatedPlayers = data.players.map(player => {
          if (player.logo === "Bot" && !player.betPlaced) {
            // Set default bet for AI if not placed
            return { ...player, betAmount: 100, betPlaced: true };
          }
          return player;
        });

        setPlayers(updatedPlayers);

        // Update Firestore with AI bet defaults if they haven't been placed yet
        if (updatedPlayers.some(player => player.logo === "Bot" && player.betAmount === 100 && !player.betPlaced)) {
          updateDoc(lobbyRef, { 
            players: updatedPlayers,
            bettingTotal: (data.bettingTotal || 0) + 100 * updatedPlayers.filter(p => p.logo === "Bot" && p.betAmount === 100).length
          });
        }

        // Check if all players have either placed or skipped their bets
        const allBets = updatedPlayers.every(player => player.betPlaced || player.betSkipped);
        setAllBetsPlaced(allBets);
      }
    });

    return () => unsubscribe();
  }, [lobbyId]);

  // Handle placing a bet
  const handleBet = async () => {
    if (betAmount > userData.virtualCurrency) {
      alert('Insufficient virtual currency!');
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      const lobbyRef = doc(db, 'Lobbies', lobbyId);

      // Update the betting pool and this player's bet in Firestore
      const updatedPlayers = players.map(player => 
        player.userId === userId
          ? { ...player, betAmount, betPlaced: true }
          : player
      );

      await updateDoc(lobbyRef, {
        bettingTotal: totalBettingPool + betAmount,
        players: updatedPlayers,
      });

      setBetStatus("placed");

      // Deduct bet amount from user's virtual currency
      await updateDoc(doc(db, 'Users', userId), {
        virtualCurrency: userData.virtualCurrency - betAmount,
      });
    } catch (error) {
      console.error("Error placing bet:", error);
    }
  };

  // Handle skipping a bet
  const handleSkipBet = async () => {
    try {
      const userId = auth.currentUser?.uid;
      const lobbyRef = doc(db, 'Lobbies', lobbyId);

      // Update Firestore to mark this player's bet as skipped
      const updatedPlayers = players.map(player => 
        player.userId === userId
          ? { ...player, betAmount: 0, betPlaced: false, betSkipped: true }
          : player
      );

      await updateDoc(lobbyRef, {
        players: updatedPlayers
      });

      setBetStatus("skipped");
    } catch (error) {
      console.error("Error skipping bet:", error);
    }
  };

  // Redirect to Game.jsx when all bets are placed
  useEffect(() => {
    if (allBetsPlaced) {
      navigate(`/lobby/${lobbyId}/game`);
    }
  }, [allBetsPlaced, navigate, lobbyId]);

  return (
    <div className="bet-container">
      <h2>Place Your Bet</h2>
      
      <div className="user-info">
        <BadgeDollarSign className="currency-icon" />
        <span>Balance: {userData.virtualCurrency}</span>
      </div>

      {betStatus === "pending" ? (
        <>
          <div className="bet-input">
            <input
              type="number"
              placeholder="Enter bet amount"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
            />
            <button onClick={handleBet} disabled={betAmount <= 0}>Place Bet</button>
            <button onClick={handleSkipBet} className="skip-button">Skip Bet</button>
          </div>
        </>
      ) : (
        <p className="waiting-message">
          <Clock className="waiting-icon" />
          Waiting for other players to finish betting...
        </p>
      )}

      <div className="bet-summary">
        <h3>Total Betting Pool: {totalBettingPool}</h3>
        <h4>Players' Bets:</h4>
        <ul>
          {players.map((player, index) => (
            <li key={index} className="player-bet">
              <User className="player-icon" />
              <span>{player.username} - </span>
              <span>
                {player.betPlaced ? `$${player.betAmount}` : player.betSkipped ? "Skipped" : "Not Yet Bet"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {allBetsPlaced && <p className="all-bets-placed-message">All players have placed their bets!</p>}
    </div>
  );
};

export default Bet;
