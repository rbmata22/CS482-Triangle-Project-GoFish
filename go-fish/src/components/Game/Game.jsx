import React, { useState } from 'react';
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
  const [deck, setDeck] = useState(shuffleDeck(createDeck()));
  const [players, setPlayers] = useState([[], [], [], []]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [message, setMessage] = useState('');
  const dealCards = () => {
    let newDeck = [...deck];
    let newPlayers = [[], []];
    for (let i = 0; i < 5; i++) {
      newPlayers[0].push(newDeck.pop());
      newPlayers[1].push(newDeck.pop());
    }
    setPlayers(newPlayers);
    setDeck(newDeck);
  };
  const askForCard = (rank) => {
    const otherPlayer = currentPlayer === 0 ? 1 : 0;
    const matchingCards = players[otherPlayer].filter(card => card.value === rank);
    if (matchingCards.length > 0) {
      let newPlayers = [...players];
      newPlayers[currentPlayer] = [...newPlayers[currentPlayer], ...matchingCards];
      newPlayers[otherPlayer] = newPlayers[otherPlayer].filter(card => card.value !== rank);
      setPlayers(newPlayers);
      setMessage(`Player ${currentPlayer + 1} got ${matchingCards.length} card(s)! Go again.`);
    } else {
      let newDeck = [...deck];
      let newPlayers = [...players];
      if (newDeck.length > 0) {
        const drawnCard = newDeck.pop();
        newPlayers[currentPlayer].push(drawnCard);
        setMessage(`Go Fish! Player ${currentPlayer + 1} drew a card.`);
      } else {
        setMessage("No more cards left to draw!");
      }
      setDeck(newDeck);
      setCurrentPlayer(otherPlayer); 
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
};}
export default Game;
