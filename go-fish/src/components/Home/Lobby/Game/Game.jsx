import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import './Game.css';
import PlayerCard, { cardComponents } from './PlayerCard';
import EditableText from './EditableText';

const Game = () => {
  // Get the lobby ID from the URL parameters
  const { lobbyId } = useParams();

  // State to hold the current game state
  const [gameState, setGameState] = useState(null);

  // State to hold the lobby data
  const [lobbyData, setLobbyData] = useState(null);

  // Get the player's username from localStorage, or use "Guest" if not set
  const [username] = useState(localStorage.getItem("username") || "Guest");

  // State to manage editing the game message
  const [editingMessage, setEditingMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // State to manage the set completion animation
  const [showSetAnimation, setShowSetAnimation] = useState(false);
  const [lastCompletedSet, setLastCompletedSet] = useState(null);

  // Fetch the lobby data and initialize the game if needed
  useEffect(() => {
    if (!lobbyId) return;

    const lobbyRef = doc(db, "Lobbies", lobbyId);
    const unsubscribe = onSnapshot(lobbyRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLobbyData(data);
        
        // If there's no game state, initialize the game
        if (!data.gameState) {
          initializeGame(data.players, data.playerLimit);
        } else {
          setGameState(data.gameState);
        }
      }
    });

    // Unsubscribe from the real-time updates when the component unmounts
    return () => unsubscribe();
  }, [lobbyId]);

  // Create the initial set of cards for the game
  const createInitialSets = () => {
    // Generate the guaranteed sets (Ace, King, Queen of each suit)
    const guaranteedSets = ['Ace', 'King', 'Queen'].map(rank => (
      ['Hearts', 'Diamonds', 'Clubs', 'Spades'].map(suit => ({
        rank,
        suit,
        display: `${rank} of ${suit}`
      }))
    )).flat();

    // Generate the remaining cards
    const remainingRanks = ["Jack", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const remainingCards = remainingRanks.flatMap(rank =>
      ["Hearts", "Diamonds", "Clubs", "Spades"].map(suit => ({
        rank,
        suit,
        display: `${rank} of ${suit}`
      }))
    );

    // Shuffle the deck
    return shuffle([...guaranteedSets, ...remainingCards]);
  };

  // Shuffle the cards in an array
  const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Initialize the game state
  const initializeGame = async (players, playerLimit) => {
    // Create the initial deck of cards
    const deck = createInitialSets();

    // Initialize the player hands and sets
    const playerHands = {};
    const sets = {};
    players.forEach(player => {
      const initialCards = deck.splice(0, 7);
      playerHands[player.username] = initialCards;
      sets[player.username] = [];
    });

    // Create the initial game state
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

    // Save the initial game state to Firestore
    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      gameState: initialGameState
    });
  };

  // Handle editing the game message
  const handleMessageEdit = async (newMessage) => {
    if (newMessage.trim() !== gameState.message) {
      const lobbyRef = doc(db, "Lobbies", lobbyId);
      await updateDoc(lobbyRef, {
        'gameState.message': newMessage
      });
    }
    setIsEditing(false);
  };

  // Handle a player selecting a card
  const handleCardSelect = async (card) => {
    if (!isCurrentPlayersTurn) return;
    
    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      'gameState.selectedCard': card,
      'gameState.message': `${username} selected ${card.rank} of ${card.suit}`
    });
  };

  // Implement the "Go Fish" game logic
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
      // The target player has the requested card(s)
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
      // The target player doesn't have the requested card
      if (gameState.deck.length > 0) {
        // Draw a card from the deck
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
        // No cards left in the deck, move to the next player
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

  // Check for and complete sets in the player's hand
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
        
        setShowSetAnimation(true);
        setLastCompletedSet({ 
          player, 
          cards: setCards,
          rank: rank
        });
        setTimeout(() => setShowSetAnimation(false), 2000);
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
        'gameState.message': `${player} completed a set of ${lastCompletedSet.rank}s!`
      });

      if (gameState.totalSets + 1 === 13) {
        handleGameEnd();
      }
    }
  };

  // Handle the game ending
  const handleGameEnd = async () => {
    const winners = Object.entries(gameState.sets)
      .sort(([,a], [,b]) => b.length - a.length);
    
    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      'gameState.status': 'completed',
      'gameState.winners': winners,
      'gameState.message': `Game Over! ${winners[0][0]} wins with ${winners[0][1].length} sets!`
    });
  };

  // Determine if it's the current player's turn
  const isCurrentPlayersTurn = gameState?.currentTurn === username;

  // Get the username of the next player
  const nextPlayer = gameState?.players[
    (gameState.currentPlayerIndex + 1) % gameState.players.length
  ]?.username;

  // If the game state or lobby data is not ready, show a loading spinner
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

  return (
    <div className="game-container">
      <motion.div 
        className="game-board"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="game-header">
          <div className="turn-status">
            <div className="current-turn">
              Current Turn: {gameState.currentTurn}
            </div>
            <div className="next-turn">
              Next Turn: {nextPlayer}
            </div>
          </div>
          
          <EditableText
            text={gameState.message}
            isEditing={isCurrentPlayersTurn}
            onSave={handleMessageEdit}
            className="game-message"
          />
        </div>

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

        <div className="center-area">
          <div className="deck-counter">
            <span className="count">Cards in Deck: {gameState.deckSize}</span>
          </div>
        </div>

        {isCurrentPlayersTurn && (
          <div className="game-controls">
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

        <AnimatePresence>
          {showSetAnimation && lastCompletedSet && (
            <motion.div
              className="set-completion"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
            >
              <div className="set-text">
                {lastCompletedSet.player} completed a set!
              </div>
              <div className="set-cards">
                {lastCompletedSet.cards.map((card, index) => {
                  const CardIcon = cardComponents[card.display];
                  return CardIcon && (
                    <motion.div
                      key={index}
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    >
                      <CardIcon size={60} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Game;