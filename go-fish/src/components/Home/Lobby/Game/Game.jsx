import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Eye } from 'lucide-react';
import './Game.css';
import PlayerCard, { cardComponents } from './PlayerCard';
import EditableText from './EditableText';

const Game = () => {
  // URL and navigation
  const { lobbyId } = useParams();
  const navigate = useNavigate();

  // Core state
  const [gameState, setGameState] = useState(null);
  const [lobbyData, setLobbyData] = useState(null);
  const [username] = useState(localStorage.getItem("username") || "Guest");

  // UI state
  const [setIsEditing] = useState(false);
  const [showSetsModal, setShowSetsModal] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showGameEndAnimation, setShowGameEndAnimation] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  // Fetch and initialize game data
  useEffect(() => {
    if (!lobbyId) return;

    const lobbyRef = doc(db, "Lobbies", lobbyId);
    const unsubscribe = onSnapshot(lobbyRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLobbyData(data);
        
        if (!data.gameState) {
          initializeGame(data.players, data.playerLimit);
        } else {
          setGameState(data.gameState);
        }
      } else {
        navigate('/home');
      }
    });

    return () => unsubscribe();
  }, [lobbyId, navigate]);

  useEffect(() => {
    if (gameState?.status === 'completed' && !gameCompleted) {
      setGameCompleted(true);
      
      // Determine if current user is the winner
      const winner = gameState.winner || (gameState.winners?.[0]?.[0]);
      const didWin = winner === username;
      setIsWinner(didWin);
      setShowGameEndAnimation(true);

      // Delay navigation to results page to show animation
      setTimeout(() => {
        setShowGameEndAnimation(false);
        setTimeout(() => {
          navigate(`/home`);
        }, 500);
      }, 3000);
    }
  }, [gameState?.status, gameCompleted, lobbyId, navigate, username, gameState?.winner, gameState?.winners]);

  // Card deck creation and shuffling
  const createInitialSets = () => {
    const guaranteedSets = ['Ace', 'King', 'Queen'].map(rank => (
      ['Hearts', 'Diamonds', 'Clubs', 'Spades'].map(suit => ({
        rank,
        suit,
        display: `${rank} of ${suit}`
      }))
    )).flat();

    const remainingRanks = ["Jack", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const remainingCards = remainingRanks.flatMap(rank =>
      ["Hearts", "Diamonds", "Clubs", "Spades"].map(suit => ({
        rank,
        suit,
        display: `${rank} of ${suit}`
      }))
    );

    return shuffle([...guaranteedSets, ...remainingCards]);
  };

  const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Game initialization
  const initializeGame = async (players, playerLimit) => {
    const deck = createInitialSets();
    const playerHands = {};
    const sets = {};
    
    players.forEach(player => {
      const initialCards = deck.splice(0, 5);
      playerHands[player.username] = initialCards;
      sets[player.username] = [];
    });

    const initialGameState = {
      deck,
      deckSize: deck.length,
      playerHands,
      sets,
      currentPlayerIndex: 0,
      players,
      currentTurn: players[0].username,
      selectedCard: null,
      selectedPlayer: null,
      message: `Game started! ${players[0].username}'s turn.`,
      lastAction: null,
      history: [],
      totalSets: 0,
      status: 'in-progress'
    };

    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      gameState: initialGameState
    });
  };

  // Message handling
  const handleMessageEdit = async (newMessage) => {
    if (newMessage.trim() !== gameState.message) {
      const lobbyRef = doc(db, "Lobbies", lobbyId);
      await updateDoc(lobbyRef, {
        'gameState.message': newMessage
      });
    }
    setIsEditing(false);
  };

  // Card selection handling
  const handleCardSelect = async (card) => {
    if (!isCurrentPlayersTurn) return;
    
    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      'gameState.selectedCard': card,
      'gameState.message': `${username} selected ${card.rank} of ${card.suit}`
    });
  };

  // Game End Handling
  const handleGameEnd = async (winner = null) => {
    const lobbyRef = doc(db, "Lobbies", lobbyId);
    const totalPlayers = gameState.players.length;
    const totalPot = lobbyData.betAmount * totalPlayers; // Calculate total pot from all players

    // Function to update winner's currency
    const updateWinnerCurrency = async (winnerUsername) => {
      try {
        // First determine if winner is a guest or registered user
        const authType = localStorage.getItem('authType');
        
        if (authType === 'Guest') {
          // For guest winners
          const guestId = localStorage.getItem('guestId');
          if (guestId) {
            const guestRef = doc(db, 'Guests', guestId);
            const guestDoc = await getDoc(guestRef);
            
            if (guestDoc.exists()) {
              const currentCurrency = guestDoc.data().virtualCurrency || 0;
              await updateDoc(guestRef, {
                virtualCurrency: currentCurrency + totalPot
              });
              // Update local storage for guest
              localStorage.setItem('guestCurrency', (currentCurrency + totalPot).toString());
            }
          }
        } else {
          // For registered users
          const usersRef = collection(db, 'Users');
          const q = query(usersRef, where('username', '==', winnerUsername));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const winnerDoc = querySnapshot.docs[0];
            const currentCurrency = winnerDoc.data().virtualCurrency || 0;
            await updateDoc(doc(db, 'Users', winnerDoc.id), {
              virtualCurrency: currentCurrency + totalPot,
              lastWin: {
                amount: totalPot,
                timestamp: new Date().toISOString(),
                gameId: lobbyId
              }
            });
          }
        }
      } catch (error) {
        console.error("Error updating winner's currency:", error);
      }
    };

    if (lobbyData.gameMode === 'firstToSet') {
      await updateWinnerCurrency(winner);
      await updateDoc(lobbyRef, {
        'gameState.status': 'completed',
        'gameState.winner': winner,
        'gameState.message': `Game Over! ${winner} wins by completing the first set and receives ${totalPot} coins!`,
        'gameState.finalPot': totalPot
      });
    } else {
      const winners = Object.entries(gameState.sets)
        .sort(([,a], [,b]) => b.length - a.length);
      
      await updateWinnerCurrency(winners[0][0]);
      await updateDoc(lobbyRef, {
        'gameState.status': 'completed',
        'gameState.winners': winners,
        'gameState.message': `Game Over! ${winners[0][0]} wins with ${winners[0][1].length} sets and receives ${totalPot} coins!`,
        'gameState.finalPot': totalPot
      });
    }
  };

  // Core game logic
  const askForCard = async () => {
    if (!gameState.selectedCard || !gameState.selectedPlayer) return;

    const lobbyRef = doc(db, "Lobbies", lobbyId);
    const currentPlayer = gameState.currentTurn;
    const targetPlayer = gameState.selectedPlayer;
    const targetHand = gameState.playerHands[targetPlayer];
    const matchingCards = targetHand.filter(card => 
      card.rank === gameState.selectedCard.rank
    );

    if (matchingCards.length > 0) {
      const newTargetHand = targetHand.filter(card => 
        card.rank !== gameState.selectedCard.rank
      );
      const newCurrentHand = [
        ...gameState.playerHands[currentPlayer],
        ...matchingCards
      ];

      await updateDoc(lobbyRef, {
        'gameState.playerHands': {
          ...gameState.playerHands,
          [targetPlayer]: newTargetHand,
          [currentPlayer]: newCurrentHand
        },
        'gameState.message': `${currentPlayer} got ${matchingCards.length} ${gameState.selectedCard.rank}(s)!`,
        'gameState.selectedCard': null,
        'gameState.selectedPlayer': null,
        'gameState.lastAction': 'success'
      });

      await checkForSets(newCurrentHand, currentPlayer);
    } else {
      if (gameState.deck.length > 0) {
        const drawnCard = gameState.deck[0];
        const newDeck = gameState.deck.slice(1);
        const newHand = [...gameState.playerHands[currentPlayer], drawnCard];
        const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

        await updateDoc(lobbyRef, {
          'gameState.deck': newDeck,
          'gameState.deckSize': newDeck.length,
          'gameState.playerHands': {
            ...gameState.playerHands,
            [currentPlayer]: newHand
          },
          'gameState.currentTurn': gameState.players[nextPlayerIndex].username,
          'gameState.currentPlayerIndex': nextPlayerIndex,
          'gameState.message': `Go Fish! ${currentPlayer} drew a card.`,
          'gameState.selectedCard': null,
          'gameState.selectedPlayer': null,
          'gameState.lastDrawn': drawnCard,
          'gameState.lastAction': 'fish'
        });

        await checkForSets(newHand, currentPlayer);
      } else {
        const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        await updateDoc(lobbyRef, {
          'gameState.currentTurn': gameState.players[nextPlayerIndex].username,
          'gameState.currentPlayerIndex': nextPlayerIndex,
          'gameState.message': 'No cards left in deck! Moving to next player.',
          'gameState.selectedCard': null,
          'gameState.selectedPlayer': null,
          'gameState.lastAction': 'empty'
        });
      }
    }
  };

  const checkForSets = async (hand, player) => {
    const rankCounts = {};
    hand.forEach(card => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });
  
    let setsFound = false;
    const newHand = [...hand];
    const newSets = [...(gameState.sets[player] || [])];
  
    Object.entries(rankCounts).forEach(([rank, count]) => {
      if (count === 4) {
        const setCards = newHand.filter(card => card.rank === rank);
        newHand.splice(0, newHand.length, ...newHand.filter(card => card.rank !== rank));
        newSets.push(setCards);
        setsFound = true;
        
        // Instead of using local state, store the animation state in the game state
        const setCompletionData = {
          player,
          cards: setCards,
          rank: rank,
          timestamp: Date.now() // Add timestamp to ensure animation triggers for each new set
        };
  
        // Update the game state with the animation data
        const lobbyRef = doc(db, "Lobbies", lobbyId);
        updateDoc(lobbyRef, {
          'gameState.lastCompletedSet': setCompletionData,
          'gameState.showSetAnimation': true
        });
  
        // Clear the animation after a delay
        setTimeout(async () => {
          const lobbyRef = doc(db, "Lobbies", lobbyId);
          await updateDoc(lobbyRef, {
            'gameState.showSetAnimation': false
          });
        }, 3000);
  
        if (lobbyData.gameMode === 'firstToSet') {
          handleGameEnd(player);
          return;
        }
      }
    });
  
    if (setsFound) {
      const lobbyRef = doc(db, "Lobbies", lobbyId);
      await updateDoc(lobbyRef, {
        'gameState.playerHands': {
          ...gameState.playerHands,
          [player]: newHand
        },
        'gameState.sets': {
          ...gameState.sets,
          [player]: newSets
        },
        'gameState.totalSets': gameState.totalSets + 1,
        'gameState.message': `${player} completed a set of ${gameState.lastCompletedSet?.rank}s!`
      });
  
      if (gameState.totalSets + 1 === 13 && lobbyData.gameMode !== 'firstToSet') {
        handleGameEnd();
      }
    }
  };

  // UI Components
  const SetsModal = () => (
    <motion.div
      className="sets-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowSetsModal(false)}
    >
      <motion.div
        className="sets-modal"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="close-modal" onClick={() => setShowSetsModal(false)}>×</button>
        <h2>Your Sets</h2>
        <div className="sets-grid">
          {gameState.sets[username]?.map((set, index) => {
            const CardIcon = cardComponents[`${set[0].rank} of Hearts`];
            return (
              <motion.div
                key={index}
                className="set-card"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {CardIcon && <CardIcon size={100} />}
                <p>Set of {set[0].rank}s</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );

  // Utility checks
  const isCurrentPlayersTurn = gameState?.currentTurn === username;
  const nextPlayer = gameState?.players[
    (gameState.currentPlayerIndex + 1) % gameState.players.length
  ]?.username;

  // Loading state
  if (!gameState || !lobbyData) {
    return (
      <div className="loading-container">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="loading-spinner"
        />
        Loading game...
      </div>
    );
  }

  // Main render
return (
  <div className="game-container">
    {/* Main game board with entrance animation */}
    <motion.div 
      className="game-board"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Header section containing turn info and game mode */}
      <div className="game-header">
        {/* Turn status display */}
        <div className="turn-status">
          <div className="current-turn">
            Current Turn: {gameState.currentTurn}
          </div>
          <div className="next-turn">
            Next Turn: {nextPlayer}
          </div>
        </div>
        
        {/* Game mode indicator with trophy icon */}
        <div className="game-mode-indicator">
          <Trophy className="mode-icon" />
          <span>{lobbyData.gameMode === 'firstToSet' ? 'First to Set Wins!' : 'Classic Mode'}</span>
        </div>

        {/* Editable game message component */}
        <EditableText
          text={gameState.message}
          isEditing={isCurrentPlayersTurn}
          onSave={handleMessageEdit}
          className="game-message"
        />
      </div>

      {/* Container for all player cards */}
      <div className="players-container">
        {gameState.players.map((player) => (
          <PlayerCard
            key={player.username}
            player={player}
            isCurrentPlayer={player.username === username}
            isCurrentTurn={player.username === gameState.currentTurn}
            onCardSelect={handleCardSelect}
            gameState={gameState}
            username={username}
          />
        ))}
      </div>

      {/* Center area displaying deck information */}
      <div className="center-area">
        <div className="deck-counter">
          <span className="count">Cards in Deck: {gameState.deckSize}</span>
        </div>
      </div>

      {/* Game controls visible only during player's turn */}
      {isCurrentPlayersTurn && (
        <div className="game-controls">
          {/* Player selection dropdown */}
          <select
            className="player-select"
            value={gameState.selectedPlayer || ''}
            onChange={(e) => {
              const lobbyRef = doc(db, "Lobbies", lobbyId);
              updateDoc(lobbyRef, {
                'gameState.selectedPlayer': e.target.value
              });
            }}
          >
            <option value="">Select Player</option>
            {gameState.players
              .filter(player => player.username !== username)
              .map(player => (
                <option key={player.username} value={player.username}>
                  {player.username}
                </option>
              ))}
          </select>

          {/* Ask for card button with animations */}
          <motion.button
            className="ask-button"
            onClick={askForCard}
            disabled={!gameState.selectedCard || !gameState.selectedPlayer}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Ask for Card
          </motion.button>
        </div>
      )}

      {/* Sets display button - only visible if player has sets */}
      {username && gameState.sets[username]?.length > 0 && (
        <motion.button
          className="check-sets-button"
          onClick={() => setShowSetsModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Eye className="eye-icon" />
          Check Sets ({gameState.sets[username].length})
        </motion.button>
      )}

      {/* Sets modal with animation */}
      <AnimatePresence>
        {showSetsModal && <SetsModal />}
      </AnimatePresence>

      {/* Set completion animation overlay */}
      <AnimatePresence>
        {gameState.showSetAnimation && gameState.lastCompletedSet && (
          <motion.div
            className="set-completion"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            key={gameState.lastCompletedSet.timestamp}
            style={{ 
              position: 'fixed',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Set completion announcement and card display */}
            <div className="set-text">
              {gameState.lastCompletedSet.player} completed a set!
            </div>
            <div className="set-cards">
              {gameState.lastCompletedSet.cards.map((card, index) => {
                const CardIcon = cardComponents[card.display];
                return CardIcon && (
                  <motion.div
                    key={index}
                    initial={{ rotate: 0, scale: 0 }}
                    animate={{ rotate: 360, scale: 1 }}
                    transition={{ 
                      duration: 1,
                      delay: index * 0.2,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <CardIcon size={80} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game end animation overlay */}
      <AnimatePresence>
        {showGameEndAnimation && (
          <motion.div
            className="game-end-overlay" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isWinner ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(4px)'
            }}
          >
            {/* Win/Lose animation content */}
            <motion.div

            // THIS IS HIP TOO!!! AFTER A LONG BATTLE, THE
            // GAME FINALLY RUNS! Can't wait to present!!!
              className="game-end-content"
              initial={{ scale: 0, y: -100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 100 }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '2rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                border: `4px solid ${isWinner ? '#2ecc71' : '#e74c3c'}`
              }}
            >
              {/* Conditional render for win/lose animations */}
              {isWinner ? (
                <>
                  {/* Winner celebration animations */}
                  <motion.div 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{ fontSize: '4rem', marginBottom: '1rem' }}
                  >
                    🎉
                  </motion.div>
                  <motion.h2
                    initial={{ y: 20 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{ 
                      color: '#2ecc71',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      marginBottom: '1rem'
                    }}
                  >
                    You Win!
                  </motion.h2>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{ fontSize: '4rem' }}
                  >
                    🏆
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Loser animation sequence */}
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ fontSize: '4rem', marginBottom: '1rem' }}
                  >
                    😢
                  </motion.div>
                  <motion.h2
                    style={{ 
                      color: '#e74c3c',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      marginBottom: '1rem'
                    }}
                  >
                    You Lose...
                  </motion.h2>
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [-5, 5, -5, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ fontSize: '4rem' }}
                  >
                    💔
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </div>
);
};
export default Game;