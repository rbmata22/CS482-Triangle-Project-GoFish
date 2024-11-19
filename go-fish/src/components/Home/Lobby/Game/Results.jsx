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

  useEffect(() => {
    // Trigger confetti animation on component mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const confettiAnimation = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(confettiAnimation);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff']
      });
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff']
      });
    }, 50);

    return () => clearInterval(confettiAnimation);
  }, []);

  useEffect(() => {
    if (!lobbyId) return;

    const fetchResults = async () => {
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

        // Award betting pool to winner
        if (totalBetPool > 0) {
          const winnerRef = doc(db, 'Users', playerResults[0].username);
          const winnerSnap = await getDoc(winnerRef);
          if (winnerSnap.exists()) {
            await updateDoc(winnerRef, {
              virtualCurrency: winnerSnap.data().virtualCurrency + totalBetPool
            });
          }
        }

        setResults({
          players: playerResults,
          totalBetPool,
          gameMode: lobbyData.gameMode
        });
        setShowReward(true);
      }
    };

    fetchResults();
  }, [lobbyId]);

  if (!results) {
    return (
      <div className="results-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="loading-spinner"
        />
        Loading results...
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
              </div>
              {index === 0 && <Trophy className="trophy-icon" />}
              {index === 1 && <Medal className="silver-medal" />}
              {index === 2 && <Medal className="bronze-medal" />}
              <div className={`podium-block rank-${index + 1}`} />
            </motion.div>
          ))}
        </div>

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