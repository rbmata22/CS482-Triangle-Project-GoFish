/**
 * Enhanced and optimized Game component with improved readability and performance
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { animated, useSpring } from 'react-spring';
import * as Icons from 'react-icons/gi';
import './Game.css';

// Dynamically generate card components mapping
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

const Game = () => {
  const { lobbyId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [username] = useState(localStorage.getItem("username") || "Guest");
  const [notifications, setNotifications] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [targetPlayer, setTargetPlayer] = useState("");

  // Sync game state from Firestore
  useEffect(() => {
    if (!lobbyId || !username) return;

    const lobbyRef = doc(db, "Lobbies", lobbyId);
    const unsubscribe = onSnapshot(
      lobbyRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setGameState(data);
          setPlayerHand(data.playerHands?.[username] || []);
        }
      },
      (error) => console.error("Error syncing with Firestore:", error)
    );

    return () => unsubscribe();
  }, [lobbyId, username]);

  // Handle notifications
  useEffect(() => {
    if (gameState?.logs) {
      const newNotification = gameState.logs.at(-1);
      if (newNotification) {
        setNotifications((prev) => [...prev, newNotification]);
        const timer = setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.logs]);

  // Check for completed sets of four cards
  const checkForCompletedSets = useCallback((hand) => {
    const rankCount = hand.reduce((acc, card) => {
      acc[card.rank] = (acc[card.rank] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(rankCount).filter((rank) => rankCount[rank] === 4);
  }, []);

  // Determine the next player's turn
  const getNextPlayerTurn = useCallback((state) => {
    const players = Object.keys(state.playerHands || {});
    const currentIndex = players.indexOf(state.currentTurn);
    return players[(currentIndex + 1) % players.length];
  }, []);

  // Ask another player for a card
  const handleAskCard = async () => {
    if (!gameState || gameState.currentTurn !== username) {
      alert("It's not your turn!");
      return;
    }
    if (!selectedCard || !targetPlayer) {
      alert("Please select a card and a player to ask.");
      return;
    }

    try {
      const targetHand = gameState.playerHands[targetPlayer] || [];
      const matchedCards = targetHand.filter((card) => card.rank === selectedCard.rank);

      const lobbyRef = doc(db, "Lobbies", lobbyId);

      if (matchedCards.length > 0) {
        // Transfer cards from target player to current player
        const updatedPlayerHands = {
          ...gameState.playerHands,
          [targetPlayer]: targetHand.filter((card) => card.rank !== selectedCard.rank),
          [username]: [...playerHand, ...matchedCards],
        };

        const completedSets = checkForCompletedSets(updatedPlayerHands[username]);

        await updateDoc(lobbyRef, {
          playerHands: updatedPlayerHands,
          logs: arrayUnion(`${username} asked ${targetPlayer} for ${selectedCard.rank}s and got ${matchedCards.length}!`),
          tableSets: {
            ...gameState.tableSets,
            [username]: [...(gameState.tableSets[username] || []), ...completedSets],
          },
        });
      } else {
        // Go Fish logic
        const deck = [...(gameState.deck || [])];
        const drawnCard = deck.pop();
        const updatedPlayerHands = {
          ...gameState.playerHands,
          [username]: [...playerHand, drawnCard],
        };

        await updateDoc(lobbyRef, {
          playerHands: updatedPlayerHands,
          deck,
          logs: arrayUnion(`${username} asked ${targetPlayer} for ${selectedCard.rank}s but went fishing!`),
          currentTurn: getNextPlayerTurn(gameState),
        });
      }

      setSelectedCard(null);
      setTargetPlayer("");
    } catch (error) {
      console.error("Error updating game state:", error);
    }
  };

  // Render player hand
  const renderHand = () => {
    return playerHand.map((card, index) => {
      const CardIcon = cardComponents[`${card.rank} of ${card.suit}`];
      return (
        <animated.div
          key={index}
          className={`card-icon ${selectedCard === card ? "selected" : ""}`}
          style={useSpring({ transform: selectedCard === card ? "scale(1.2)" : "scale(1)" })}
          onClick={() => setSelectedCard(card)}
        >
          {CardIcon && <CardIcon />}
        </animated.div>
      );
    });
  };

  // Render player list for target selection
  const renderPlayers = () => {
    return Object.keys(gameState?.playerHands || {}).map((player) => (
      player !== username && (
        <button
          key={player}
          className={`player-button ${targetPlayer === player ? "selected" : ""}`}
          onClick={() => setTargetPlayer(player)}
        >
          {player}
        </button>
      )
    ));
  };

  return (
    <div className="game-container">
      <h2>Welcome to Go Fish, {username}!</h2>
      <div className="game-center-logo">Go Fish</div>
      <div className="hand-container">{renderHand()}</div>
      <div className="player-list">{renderPlayers()}</div>
      <div className="game-actions">
        <button onClick={handleAskCard}>Ask for Card</button>
      </div>
      <div className="game-status">
        {gameState && (
          <>
            <p>Current Turn: {gameState.currentTurn}</p>
            <p>Deck Size: {gameState.deck?.length || 0}</p>
            <p>Your Sets: {gameState.tableSets?.[username]?.length || 0}</p>
          </>
        )}
      </div>
      <div className="notifications-container">
        {notifications.map((notification, index) => (
          <animated.div key={index} className="notification">
            {notification}
          </animated.div>
        ))}
      </div>
    </div>
  );
};

export default Game;
