import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Home, PartyPopper, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import './Results.css';

const Results = () => {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [statsUpdated, setStatsUpdated] = useState(false);
  const [error, setError] = useState(null);

  // Confetti animation effect
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const confettiAnimation = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(confettiAnimation);
        return;
      }

      // Left side confetti
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#4fd1c5', '#00FF00'] // Gold, teal, green
      });
      
      // Right side confetti
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#4fd1c5', '#00FF00']
      });
    }, 50);

    return () => clearInterval(confettiAnimation);
  }, []);

  // Fetch and update game results
  useEffect(() => {
    if (!lobbyId || statsUpdated) return;

    const fetchResults = async () => {
      try {
        const lobbyRef = doc(db, 'Lobbies', lobbyId);
        const lobbySnap = await getDoc(lobbyRef);
        
        if (lobbySnap.exists()) {
          const lobbyData = lobbySnap.data();
          const gameState = lobbyData.gameState;
          
          // Calculate total betting pool
          const totalBetPool = lobbyData.players.reduce((sum, player) => 
            sum + (player.betAmount || 0), 0
          );

          // Sort players by number of sets
          const playerResults = lobbyData.players.map(player => ({
            username: player.username,
            logo: player.logo,
            sets: gameState.sets[player.username]?.length || 0,
            betAmount: player.betAmount || 0
          })).sort((a, b) => b.sets - a.sets);

          // Update stats for all players
          const updatePromises = playerResults.map(async (player) => {
            try {
              const userRef = doc(db, 'Users', player.username);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                const isWinner = player === playerResults[0];
                
                const updates = {
                  gamesPlayed: (userData.gamesPlayed || 0) + 1,
                  ...(isWinner && {
                    gamesWon: (userData.gamesWon || 0) + 1,
                    ...(totalBetPool > 0 && {
                      virtualCurrency: (userData.virtualCurrency || 0) + totalBetPool
                    })
                  })
                };

                await updateDoc(userRef, updates);
              }
            } catch (error) {
              console.error(`Error updating stats for ${player.username}:`, error);
              throw error;
            }
          });

          // Wait for all updates to complete
          await Promise.all(updatePromises);

          setResults({
            players: playerResults,
            totalBetPool,
            gameMode: lobbyData.gameMode
          });
          setShowReward(true);
          setStatsUpdated(true);
        }
      } catch (error) {
        console.error("Error in fetchResults:", error);
        setError("Error loading results. Please try again.");
      }
    };

    fetchResults();
  }, [lobbyId, statsUpdated]);

  if (error) {
    return (
      <div className="results-error">
        <p>{error}</p>
        <button onClick={() => navigate('/home')}>Return Home</button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="loading-spinner"
        />
        <p>Loading results...</p>
      </div>
    );
  }

  return (
    <div className="results-container">
      <motion.div 
        className="results-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="winner-banner">
          <Crown className="crown-icon" size={48} />
          <h1>{results.players[0].username} Wins!</h1>
          <PartyPopper className="party-icon" size={48} />
        </div>

        {showReward && results.totalBetPool > 0 && (
          <motion.div 
            className="reward-banner"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 }}
          >
            <h2>Won ${results.totalBetPool} from the betting pool!</h2>
          </motion.div>
        )}

        <div className="podium-container">
          {results.players.slice(0, 3).map((player, index) => (
            <motion.div
              key={player.username}
              className={`podium-place place-${index + 1}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.3 }}
            >
              <div className="player-info">
                <span className="username">{player.username}</span>
                <span className="sets-count">{player.sets} sets</span>
                {index === 0 && results.totalBetPool > 0 && (
                  <span className="winnings">+${results.totalBetPool}</span>
                )}
              </div>
              {index === 0 && <Trophy className="trophy-icon" />}
              {index === 1 && <Medal className="silver-medal" />}
              {index === 2 && <Medal className="bronze-medal" />}
              <div className={`podium-block rank-${index + 1}`} />
            </motion.div>
          ))}
        </div>

        <motion.div className="game-stats">
          <h3>Game Mode: {results.gameMode === 'firstToSet' ? 'First to Set' : 'Classic'}</h3>
          {results.totalBetPool > 0 && (
            <h3>Total Bet Pool: ${results.totalBetPool}</h3>
          )}
        </motion.div>

        <motion.button
          className="home-button"
          onClick={() => navigate('/home')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home className="home-icon" />
          Return to Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Results;