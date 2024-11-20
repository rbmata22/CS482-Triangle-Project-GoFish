// Essential imports for animations and icons - keeping our UI smooth
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'react-icons/gi';
import { Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem, Dices } from 'lucide-react';

// Available player avatars - keeping it clean with a default fallback
const iconComponents = {
  Cat, Ghost, Dog, Bot, Bird, Apple, Banana, Cherry, Grape, Candy, Pizza, Croissant, Gem,
  default: Dices,
};

// Dynamically generates our card components
// Maps each card name to its corresponding icon for clean rendering
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

// Main component handling player display and interactions
// Shows player info, current hand, and completed sets
const PlayerCard = ({ player, isCurrentPlayer, isCurrentTurn, onCardSelect, gameState, username }) => {
  // Get the right icons for this player's display
  const CardIcon = cardComponents[player.display];
  const PlayerIcon = iconComponents[player.logo] || iconComponents.default;
  
  return (
    <motion.div
      className={`player-card ${isCurrentTurn ? 'current-turn' : ''}`}
      // Clean entry animation
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <div className="player-info">
        {/* Player avatar with interactive animations */}
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
          {/* Visual indicator for active turn */}
          {isCurrentTurn && <div className="current-turn-indicator" />}
        </motion.div>
        
        {/* Player stats display */}
        <div className="player-name">
          {player.username}
        </div>
        <div className="player-stats">
          <span>Cards: {gameState.playerHands[player.username]?.length || 0}</span>
          <br />
          <span>Sets: {gameState.sets[player.username]?.length || 0}</span>
        </div>

        {/* Display area for completed sets with transitions */}
        <div className="sets-display">
          <AnimatePresence mode="popLayout">
            {gameState.sets[player.username]?.map((set, setIndex) => (
              <motion.div
                key={`${set[0].rank}-${setIndex}`}
                className="set-container"
                // Smooth set reveal animation
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <div className="set-header">Set of {set[0].rank}s</div>
                <div className="set-cards">
                  {/* Individual cards within the set */}
                  {set.map((card, cardIndex) => {
                    const CardIcon = cardComponents[card.display];
                    return (
                      <motion.div
                        key={`${card.rank}-${card.suit}-${cardIndex}`}
                        className="set-card"
                        // Clean flip animation for each card
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

      {/* Active player's hand with fan layout and interactions */}
      {isCurrentPlayer && (
        <div className="player-hand">
          <AnimatePresence>
            {gameState.playerHands[player.username]?.map((card, index) => {
              const CardIcon = cardComponents[card.display];
              // Calculate fan spread positioning
              const total = gameState.playerHands[player.username].length;
              const offset = (index - (total / 2)) * 30;
              
              return (
                <motion.div
                  key={`${card.rank}-${card.suit}`}
                  className={`card ${gameState.selectedCard === card ? 'selected' : ''}`}
                  onClick={() => isCurrentTurn && onCardSelect(card)}
                  // Smooth card animations and positioning
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