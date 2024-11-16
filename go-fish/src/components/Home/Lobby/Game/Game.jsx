import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { animated, useSpring } from 'react-spring';
import {
  GiCard10Clubs, GiCard10Spades, GiCard10Diamonds, GiCard10Hearts,
  GiCardAceClubs, GiCardAceSpades, GiCardAceDiamonds, GiCardAceHearts,
  GiCardKingClubs, GiCardKingSpades, GiCardKingDiamonds, GiCardKingHearts,
  GiCardQueenClubs, GiCardQueenSpades, GiCardQueenDiamonds, GiCardQueenHearts,
  GiCardJackClubs, GiCardJackSpades, GiCardJackDiamonds, GiCardJackHearts,
  GiCard9Clubs, GiCard9Spades, GiCard9Diamonds, GiCard9Hearts,
  GiCard8Clubs, GiCard8Spades, GiCard8Diamonds, GiCard8Hearts,
  GiCard7Clubs, GiCard7Spades, GiCard7Diamonds, GiCard7Hearts,
  GiCard6Clubs, GiCard6Spades, GiCard6Diamonds, GiCard6Hearts,
  GiCard5Clubs, GiCard5Spades, GiCard5Diamonds, GiCard5Hearts,
  GiCard4Clubs, GiCard4Spades, GiCard4Diamonds, GiCard4Hearts,
  GiCard3Clubs, GiCard3Spades, GiCard3Diamonds, GiCard3Hearts,
  GiCard2Clubs, GiCard2Spades, GiCard2Diamonds, GiCard2Hearts,
} from 'react-icons/gi';
import './Game.css';

const cardComponents = {
  "10 of Clubs": GiCard10Clubs,
  "10 of Spades": GiCard10Spades,
  "10 of Diamonds": GiCard10Diamonds,
  "10 of Hearts": GiCard10Hearts,
  "Ace of Clubs": GiCardAceClubs,
  "Ace of Spades": GiCardAceSpades,
  "Ace of Diamonds": GiCardAceDiamonds,
  "Ace of Hearts": GiCardAceHearts,
  "King of Clubs": GiCardKingClubs,
  "King of Spades": GiCardKingSpades,
  "King of Diamonds": GiCardKingDiamonds,
  "King of Hearts": GiCardKingHearts,
  "Queen of Clubs": GiCardQueenClubs,
  "Queen of Spades": GiCardQueenSpades,
  "Queen of Diamonds": GiCardQueenDiamonds,
  "Queen of Hearts": GiCardQueenHearts,
  "Jack of Clubs": GiCardJackClubs,
  "Jack of Spades": GiCardJackSpades,
  "Jack of Diamonds": GiCardJackDiamonds,
  "Jack of Hearts": GiCardJackHearts,
  "9 of Clubs": GiCard9Clubs,
  "9 of Spades": GiCard9Spades,
  "9 of Diamonds": GiCard9Diamonds,
  "9 of Hearts": GiCard9Hearts,
  "8 of Clubs": GiCard8Clubs,
  "8 of Spades": GiCard8Spades,
  "8 of Diamonds": GiCard8Diamonds,
  "8 of Hearts": GiCard8Hearts,
  "7 of Clubs": GiCard7Clubs,
  "7 of Spades": GiCard7Spades,
  "7 of Diamonds": GiCard7Diamonds,
  "7 of Hearts": GiCard7Hearts,
  "6 of Clubs": GiCard6Clubs,
  "6 of Spades": GiCard6Spades,
  "6 of Diamonds": GiCard6Diamonds,
  "6 of Hearts": GiCard6Hearts,
  "5 of Clubs": GiCard5Clubs,
  "5 of Spades": GiCard5Spades,
  "5 of Diamonds": GiCard5Diamonds,
  "5 of Hearts": GiCard5Hearts,
  "4 of Clubs": GiCard4Clubs,
  "4 of Spades": GiCard4Spades,
  "4 of Diamonds": GiCard4Diamonds,
  "4 of Hearts": GiCard4Hearts,
  "3 of Clubs": GiCard3Clubs,
  "3 of Spades": GiCard3Spades,
  "3 of Diamonds": GiCard3Diamonds,
  "3 of Hearts": GiCard3Hearts,
  "2 of Clubs": GiCard2Clubs,
  "2 of Spades": GiCard2Spades,
  "2 of Diamonds": GiCard2Diamonds,
  "2 of Hearts": GiCard2Hearts,
};

const Game = () => {
  const { lobbyId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [username] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchGameData = async () => {
      const lobbyRef = doc(db, 'Lobbies', lobbyId);
      const unsubscribe = onSnapshot(lobbyRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setGameState(data);
          setPlayerHand(data.playerHands[username] || []);
        }
      });

      return () => unsubscribe();
    };

    fetchGameData();
  }, [lobbyId, username]);

  useEffect(() => {
    if (gameState?.logs) {
      const newNotification = gameState.logs[gameState.logs.length - 1];
      if (newNotification) {
        setNotifications((prev) => [...prev, newNotification]);
        setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 3000);
      }
    }
  }, [gameState?.logs]);

  const handleAskCard = async (targetPlayer, cardRank) => {
    const lobbyRef = doc(db, 'Lobbies', lobbyId);

    if (!gameState || gameState.currentTurn !== username) {
      alert("It's not your turn!");
      return;
    }

    const targetHand = gameState.playerHands[targetPlayer];
    const matchedCards = targetHand.filter((card) => card.rank === cardRank);

    if (matchedCards.length > 0) {
      // Update target and current player hands
      const updatedPlayerHands = {
        ...gameState.playerHands,
        [targetPlayer]: targetHand.filter((card) => card.rank !== cardRank),
        [username]: [...playerHand, ...matchedCards],
      };

      // Check for completed sets
      const completedSets = checkForCompletedSets(updatedPlayerHands[username]);
      await updateDoc(lobbyRef, {
        playerHands: updatedPlayerHands,
        logs: arrayUnion(`${username} asked ${targetPlayer} for ${cardRank}s and got ${matchedCards.length}!`),
        tableSets: {
          ...gameState.tableSets,
          [username]: [...(gameState.tableSets[username] || []), ...completedSets],
        },
      });
    } else {
      // Go Fish
      const deck = gameState.deck;
      const drawnCard = deck.pop();
      const updatedPlayerHands = {
        ...gameState.playerHands,
        [username]: [...playerHand, drawnCard],
      };

      await updateDoc(lobbyRef, {
        playerHands: updatedPlayerHands,
        deck,
        logs: arrayUnion(`${username} asked ${targetPlayer} for ${cardRank}s but went fishing!`),
        currentTurn: (gameState.currentTurn + 1) % Object.keys(gameState.playerHands).length,
      });
    }
  };

  const checkForCompletedSets = (hand) => {
    const rankCount = hand.reduce((acc, card) => {
      acc[card.rank] = (acc[card.rank] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(rankCount).filter((rank) => rankCount[rank] === 4);
  };

  const renderHand = () => {
    return playerHand.map((card, index) => {
      const CardIcon = cardComponents[`${card.rank} of ${card.suit}`];
      return (
        <animated.div key={index} className="card-icon" style={useSpring({ transform: 'scale(1.1)', delay: index * 100 })}>
          {CardIcon ? <CardIcon /> : null}
        </animated.div>
      );
    });
  };

  const renderNotifications = () => {
    return notifications.map((notification, index) => (
      <animated.div key={index} className="notification" style={useSpring({ opacity: 1, from: { opacity: 0 } })}>
        {notification}
      </animated.div>
    ));
  };

  return (
    <div className="game-container">
      <h2>Welcome to Go Fish, {username}!</h2>
      <div className="game-center-logo">Go Fish Logo Animation Here</div>
      <div className="hand-container">{renderHand()}</div>
      <div className="notifications-container">{renderNotifications()}</div>
      <div className="game-status">
        {gameState && (
          <>
            <p>Current Turn: {gameState.currentTurn}</p>
            <p>Deck Size: {gameState.deck.length}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Game;