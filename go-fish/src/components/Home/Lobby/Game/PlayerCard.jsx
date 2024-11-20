import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'react-icons/gi';
import { Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem, Dices } from 'lucide-react';

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
          {isCurrentTurn && <div className="current-turn-indicator" />}
        </motion.div>
        <div className="player-name">
          {player.username}
        </div>
        <div className="player-stats">
          <span>Cards: {gameState.playerHands[player.username]?.length || 0}</span>
          <br />
          <span>Sets: {gameState.sets[player.username]?.length || 0}</span>
          </div>

        <div className="sets-display">
          <AnimatePresence mode="popLayout">
            {gameState.sets[player.username]?.map((set, setIndex) => (
              <motion.div
                key={`${set[0].rank}-${setIndex}`}
                className="set-container"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <div className="set-header">Set of {set[0].rank}s</div>
                <div className="set-cards">
                  {set.map((card, cardIndex) => {
                    const CardIcon = cardComponents[card.display];
                    return (
                      <motion.div
                        key={`${card.rank}-${card.suit}-${cardIndex}`}
                        className="set-card"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ delay: cardIndex * 0.1 }}
                      >
                        {CardIcon && <CardIcon size={40} />}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {isCurrentPlayer && (
        <div className="player-hand">
          <AnimatePresence>
            {gameState.playerHands[player.username]?.map((card, index) => {
              const CardIcon = cardComponents[card.display];
              const total = gameState.playerHands[player.username].length;
              const offset = (index - (total / 2)) * 30;
              
              return (
                <motion.div
                  key={`${card.rank}-${card.suit}`}
                  className={`card ${gameState.selectedCard === card ? 'selected' : ''}`}
                  onClick={() => isCurrentTurn && onCardSelect(card)}
                  initial={{ scale: 0, y: 50 }}
                  animate={{ 
                    scale: 1,
                    y: 0,
                    x: offset,
                    rotateZ: offset * 0.5,
                    zIndex: gameState.selectedCard === card ? 10 : index
                  }}
                  whileHover={{ 
                    y: -20,
                    scale: 1.1,
                    zIndex: 20,
                    transition: { duration: 0.2 }
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  {CardIcon && <CardIcon size={80} />}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export { cardComponents };
export default PlayerCard;