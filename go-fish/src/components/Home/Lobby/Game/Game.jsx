import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import './Game.css';

const Game = () => {
  const { lobbyId } = useParams();
  const [userData, setUserData] = useState({});
  const [gameData, setGameData] = useState(null);

  // Fetch and listen to game data
  useEffect(() => {
    if (!lobbyId) return;

    const gameRef = doc(db, 'Lobbies', lobbyId);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        setGameData(doc.data());
      }
    });

    return () => unsubscribe();
  }, [lobbyId]);

  // Player actions and game logic
  const handleDrawCard = async () => {
    // Game logic for drawing a card
  };

  const handlePlayTurn = async () => {
    // Game logic for a turn in Go Fish
  };

  return (
    <div className="game-container">
      <h2>Go Fish Game</h2>
      {gameData ? (
        <>
          <div className="game-board">
            {/* Game board and player cards */}
          </div>

          <div className="player-info">
            <p>Player: {userData.username}</p>
            {/* Display user-specific game status */}
          </div>

          <div className="game-actions">
            <button onClick={handleDrawCard}>Draw Card</button>
            <button onClick={handlePlayTurn}>Play Turn</button>
          </div>
        </>
      ) : (
        <p>Loading game...</p>
      )}
    </div>
  );
};

export default Game;
