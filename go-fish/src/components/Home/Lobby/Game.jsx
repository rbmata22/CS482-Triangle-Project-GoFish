import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import * as Icons from 'react-icons/gi';
import { Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Game.css';


const iconComponents = {
  Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem,
  default: Dices,
};


// Card components generation
const generateCardComponents = () => {
  const cardNames = [
    "10", "Ace", "King", "Queen", "Jack",
    "9", "8", "7", "6", "5", "4", "3", "2",
  ];
  const suits = ["Clubs", "Spades", "Diamonds", "Hearts"];
  const components = {};
  cardNames.forEach((rank) => {
    suits.forEach((suit) => {
      const iconName = `GiCard${rank}${suit}`;
      if (Icons[iconName]) {
        components[`${rank} of ${suit}`] = Icons[iconName];
      }
    });
  });
  return components;
};

const cardComponents = generateCardComponents();

// Editable Text Component
const EditableText = ({ text, isEditing: canEdit, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  const handleSave = () => {
    if (editValue.trim() !== text) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div 
        className={`${className} editable-text`}
        onClick={() => canEdit && setIsEditing(true)}
      >
        {text}
        {canEdit && <span className="edit-icon">✎</span>}
      </div>
    );
  }

  return (
    <input
      type="text"
      className={`${className} editable-input`}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyPress={(e) => e.key === 'Enter' && handleSave()}
      autoFocus
    />
  );
};

// PlayerCard Component
const PlayerCard = ({ player, isCurrentPlayer, isCurrentTurn, onCardSelect, gameState, username }) => {
  const CardIcon = cardComponents[player.display];
  const PlayerIcon = iconComponents[player.logo] || iconComponents.default;
  
  return (
    <motion.div
      className={`player-card ${isCurrentTurn ? 'current-turn' : ''}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <div className="player-info">
        <motion.div 
          className="player-avatar"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlayerIcon 
            size={32} 
            className="player-icon"
            strokeWidth={1.5}
          />
        </motion.div>
        <div className="player-name">
          {player.username}
        </div>
        <div className="player-stats">
          <span>Cards: {gameState.playerHands[player.username]?.length || 0}</span>
          <span>Sets: {gameState.sets[player.username]?.length || 0}</span>
        </div>
      </div>
      
      {isCurrentPlayer && (
        <div className="player-hand">
          <AnimatePresence>
            {gameState.playerHands[player.username]?.map((card, index) => {
              const CardIcon = cardComponents[card.display];
              return (
                <motion.div
                  key={`${card.rank}-${card.suit}`}
                  className={`card ${gameState.selectedCard === card ? 'selected' : ''}`}
                  onClick={() => isCurrentTurn && onCardSelect(card)}
                  initial={{ scale: 0, y: 50 }}
                  animate={{ 
                    scale: 1,
                    y: 0,
                    rotate: (index - (gameState.playerHands[player.username].length / 2)) * 5,
                    x: index * 30 
                  }}
                  exit={{ scale: 0, y: 50 }}
                  whileHover={{ y: -20, zIndex: 10 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  {CardIcon && <CardIcon size={60} />}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

// Main Game Component
const GoFishGame = () => {
  const { lobbyId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [lobbyData, setLobbyData] = useState(null);
  const [username] = useState(localStorage.getItem("username") || "Guest");
  const [editingMessage, setEditingMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [showSetAnimation, setShowSetAnimation] = useState(false);
  const [lastCompletedSet, setLastCompletedSet] = useState(null);

  // Create initial sets in the deck
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

  // Shuffle array function
  const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Sync with Firestore
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
      }
    });

    return () => unsubscribe();
  }, [lobbyId]);

  // Initialize game
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
      playerHands,
      sets,
      currentPlayerIndex: 0,
      players: players.map(p => p.username),
      currentTurn: players[0].username,
      selectedCard: null,
      selectedPlayer: null,
      message: `Game started! ${players[0].username}'s turn.`,
      lastAction: null,
      history: [],
      totalSets: 0,
    };

    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      gameState: initialGameState
    });

    setGameState(initialGameState);
  };

  // Check for completed sets
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
        setLastCompletedSet({ player, cards: setCards });
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
        'gameState.message': `${player} completed a set!`
      });

      if (gameState.totalSets + 1 === 13) {
        handleGameEnd();
      }
    }
  };

  // Ask for card
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
        'gameState.message': `${currentPlayer} got ${matchingCards.length} ${gameState.selectedCard.rank}(s) from ${targetPlayer}!`,
        'gameState.selectedCard': null,
        'gameState.selectedPlayer': null
      });

      await checkForSets(newCurrentHand, currentPlayer);
    } else {
      if (gameState.deck.length > 0) {
        const drawnCard = gameState.deck[0];
        const newDeck = gameState.deck.slice(1);
        const newHand = [...gameState.playerHands[currentPlayer], drawnCard];
        const nextPlayerIndex = (gameState.players.indexOf(currentPlayer) + 1) % gameState.players.length;

        await updateDoc(lobbyRef, {
          'gameState.deck': newDeck,
          'gameState.playerHands': {
            ...gameState.playerHands,
            [currentPlayer]: newHand
          },
          'gameState.currentTurn': gameState.players[nextPlayerIndex],
          'gameState.message': `Go Fish! ${currentPlayer} drew a card. ${gameState.players[nextPlayerIndex]}'s turn.`,
          'gameState.selectedCard': null,
          'gameState.selectedPlayer': null
        });

        await checkForSets(newHand, currentPlayer);
      }
    }
  };

  const handleCardSelect = async (card) => {
    if (!isCurrentPlayersTurn) return;
    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      'gameState.selectedCard': card
    });
  };

  const isCurrentPlayersTurn = gameState?.currentTurn === username;

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
          <motion.h1 
            className="game-title"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
          >
            Go Fish
          </motion.h1>
          
          <div className="current-turn">
            {isEditing ? (
              <input
                type="text"
                className="editable-input"
                value={editingMessage}
                onChange={(e) => setEditingMessage(e.target.value)}
                onBlur={() => handleMessageEdit(editingMessage)}
                onKeyPress={(e) => e.key === 'Enter' && handleMessageEdit(editingMessage)}
                autoFocus
              />
            ) : (
              <motion.span
                onClick={() => {
                  if (isCurrentPlayersTurn) {
                    setEditingMessage(gameState.message);
                    setIsEditing(true);
                  }
                }}
                animate={{ 
                  scale: isCurrentPlayersTurn ? [1, 1.1, 1] : 1 
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                {gameState.currentTurn}'s Turn
                {isCurrentPlayersTurn && <span className="edit-icon">✎</span>}
              </motion.span>
            )}
          </div>
        </div>

        <div className="players-container">
          {gameState.players.map((player, index) => (
            <PlayerCard
              key={player}
              player={{ username: player }}
              isCurrentPlayer={player === username}
              isCurrentTurn={player === gameState.currentTurn}
              onCardSelect={handleCardSelect}
              gameState={gameState}
              username={username}
            />
          ))}
        </div>

        {isCurrentPlayersTurn && (
          <motion.div 
            className="game-controls"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
          >
            <select
              className="player-select"
              value={gameState.selectedPlayer || ''}
              onChange={async (e) => {
                const lobbyRef = doc(db, "Lobbies", lobbyId);
                await updateDoc(lobbyRef, {
                  'gameState.selectedPlayer': e.target.value
                });
              }}
            >
              <option value="">Select Player</option>
              {gameState.players
                .filter(player => player !== username)
                .map(player => (
                  <option key={player} value={player}>{player}</option>
                ))}
            </select>

            <motion.button
              className="ask-button"
              onClick={askForCard}
              disabled={!gameState.selectedCard || !gameState.selectedPlayer}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Ask for Card
            </motion.button>
          </motion.div>
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

export default GoFishGame;