import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import './Game.css';
import PlayerCard, { cardComponents } from './PlayerCard';
import EditableText from './EditableText';

const Game = () => {
  const { lobbyId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [lobbyData, setLobbyData] = useState(null);
  const [username] = useState(localStorage.getItem("username") || "Guest");
  const [editingMessage, setEditingMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showSetAnimation, setShowSetAnimation] = useState(false);
  const [lastCompletedSet, setLastCompletedSet] = useState(null);

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

  const initializeGame = async (players, playerLimit) => {
    const deck = createInitialSets();
    const playerHands = {};
    const sets = {};
    
    players.forEach(player => {
      const initialCards = deck.splice(0, 7);
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
    };

    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      gameState: initialGameState
    });
  };

  const handleMessageEdit = async (newMessage) => {
    if (newMessage.trim() !== gameState.message) {
      const lobbyRef = doc(db, "Lobbies", lobbyId);
      await updateDoc(lobbyRef, {
        'gameState.message': newMessage
      });
    }
    setIsEditing(false);
  };

  const handleCardSelect = async (card) => {
    if (!isCurrentPlayersTurn) return;
    
    const lobbyRef = doc(db, "Lobbies", lobbyId);
    await updateDoc(lobbyRef, {
      'gameState.selectedCard': card,
      'gameState.message': `${username} selected ${card.rank} of ${card.suit}`
    });
  };

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

  const isCurrentPlayersTurn = gameState?.currentTurn === username;
  const nextPlayer = gameState?.players[
    (gameState.currentPlayerIndex + 1) % gameState.players.length
  ]?.username;

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