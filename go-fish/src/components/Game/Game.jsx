import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Game.css';
const createDeck = () => {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const values = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'Jack', 'Queen', 'King', 'Ace'
  ];
  let deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  return deck;
};
const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
const getCardImage = (value, suit) => {
  const valueMap = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
    '7': '7', '8': '8', '9': '9', '10': '10',
    'Jack': 'jack', 'Queen': 'queen', 'King': 'king', 'Ace': 'ace'
  };
  const suitMap = {
    'Hearts': 'hearts', 'Diamonds': 'diamonds',
    'Clubs': 'clubs', 'Spades': 'spades'
  };
  return `/assets/cards/${valueMap[value]}_of_${suitMap[suit]}.png`;
};
const Game = () => {
  const { state } = useLocation();
  const numberOfPlayers = state?.numberOfPlayers || 2;
  const userPlayerIndex = 0;
  const [deck, setDeck] = useState(shuffleDeck(createDeck()));
  const [players, setPlayers] = useState(Array.from({ length: numberOfPlayers }, () => []));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (currentPlayer !== userPlayerIndex) {
      const timer = setTimeout(() => botTurn(), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer]);
  const dealCards = () => {
    let newDeck = [...deck];
    let newPlayers = Array.from({ length: numberOfPlayers }, () => []);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < numberOfPlayers; j++) {
        if (newDeck.length > 0) {
          newPlayers[j].push(newDeck.pop());
        }
      }
    }
    setPlayers(newPlayers);
    setDeck(newDeck);
    setMessage("Cards have been dealt. Let's play!");
  };
  const askForCard = (rank) => {
    let newPlayers = players.map(hand => [...hand]);
    let foundCards = [];
    let newDeck = [...deck];
    let successfulRequest = false;
    for (let i = 0; i < numberOfPlayers; i++) {
      if (i !== currentPlayer) {
        const matches = newPlayers[i].filter(card => card.value === rank);
        if (matches.length > 0) {
          foundCards = foundCards.concat(matches);
          newPlayers[i] = newPlayers[i].filter(card => card.value !== rank);
          successfulRequest = true;
        }
      }
    }
    if (successfulRequest) {
      newPlayers[currentPlayer] = newPlayers[currentPlayer].concat(foundCards);
      setPlayers(newPlayers);
      setMessage(`Player ${currentPlayer + 1} got ${foundCards.length} card(s)! Go again.`);
    } else {
      if (newDeck.length > 0) {
        const drawnCard = newDeck.pop();
        newPlayers[currentPlayer].push(drawnCard);
        setMessage(`Go Fish! Player ${currentPlayer + 1} drew a card.`);
      } else {
        setMessage("No more cards left to draw!");
      }
      setDeck(newDeck);
      setCurrentPlayer((currentPlayer + 1) % numberOfPlayers);
    }
  };
  const botTurn = () => {
    const botHand = players[currentPlayer];
    if (botHand.length === 0) {
      setCurrentPlayer((currentPlayer + 1) % numberOfPlayers);
      return;
    }
    const randomIndex = Math.floor(Math.random() * botHand.length);
    const randomRank = botHand[randomIndex].value;
    askForCard(randomRank);
  };
  return (
    <div className="game-container">
      <h1 className="neon-text">Go Fish</h1>
      <button onClick={dealCards} className="neon-button">Deal Cards</button>
      <div className="players">
        {players.map((hand, index) => (
          <div key={index} className="player-hand">
            <h2 className="neon-text">Player {index + 1}'s Hand</h2>
            <div className="cards">
              {index === userPlayerIndex ? (
                hand.map((card, i) => (
                  <img
                    key={i}
                    src={getCardImage(card.value, card.suit)}
                    alt={`${card.value} of ${card.suit}`}
                    className="card-image"
                  />
                ))
              ) : (
                <p className="neon-text">Cards are hidden</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="actions">
        {currentPlayer === userPlayerIndex ? (
          <>
            <h2 className="neon-text">Player {currentPlayer + 1}'s Turn</h2>
            <p className="neon-text">Ask for a rank:</p>
            {['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'].map(rank => (
              <button
                key={rank}
                onClick={() => askForCard(rank)}
                className="neon-button"
              >
                {rank}
              </button>
            ))}
          </>
        ) : (
          <h2 className="neon-text">Player {currentPlayer + 1} (Bot) is thinking...</h2>
        )}
      </div>
      <p className="message neon-text">{message}</p>
    </div>
  );
};
export default Game;
