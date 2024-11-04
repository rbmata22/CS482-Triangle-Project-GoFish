import React, { useState } from 'react';
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
const Game = () => {
  const { state } = useLocation();
  const numberOfPlayers = state?.numberOfPlayers || 2; 
  const [deck, setDeck] = useState(shuffleDeck(createDeck()));
  const [players, setPlayers] = useState(Array(numberOfPlayers).fill([]));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [message, setMessage] = useState('');
  const dealCards = () => {
    let newDeck = [...deck];
    let newPlayers = Array(numberOfPlayers).fill([]).map(() => []);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < numberOfPlayers; j++) {
        if (newDeck.length > 0) {
          newPlayers[j].push(newDeck.pop());
        }
      }
    }
    setPlayers(newPlayers);
    setDeck(newDeck);
  };
  const askForCard = (rank) => {
    const otherPlayers = players.filter((_, index) => index !== currentPlayer);
    let matchingCards = [];
    let newPlayers = [...players];
    otherPlayers.forEach((hand, index) => {
      const matches = hand.filter(card => card.value === rank);
      if (matches.length > 0) {
        matchingCards = matchingCards.concat(matches);
        newPlayers[index] = newPlayers[index].filter(card => card.value !== rank);
      }
    });
    if (matchingCards.length > 0) {
      newPlayers[currentPlayer] = [...newPlayers[currentPlayer], ...matchingCards];
      setPlayers(newPlayers);
      setMessage(`Player ${currentPlayer + 1} got ${matchingCards.length} card(s)! Go again.`);
    } else {
      let newDeck = [...deck];
      if (newDeck.length > 0) {
        const drawnCard = newDeck.pop();
        newPlayers[currentPlayer].push(drawnCard);
        setMessage(`Go Fish! Player ${currentPlayer + 1} drew a card.`);
      } else {
        setMessage("No more cards left to draw!");
      }
      setDeck(newDeck);
      setCurrentPlayer((currentPlayer + 1) % numberOfPlayers); // Move to the next player
    }
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
              {hand.map((card, i) => (
                <div key={i} className="card neon-text">
                  {card.value} of {card.suit}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="actions">
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
      </div>
      <p className="message neon-text">{message}</p>
    </div>
  );
};
export default Game;