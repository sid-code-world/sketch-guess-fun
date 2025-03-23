
import { useGame } from "@/contexts/GameContext";

export const WordDisplay = () => {
  const { gameState, isDrawer } = useGame();
  
  // Don't show if we're not in drawing phase or if the game hasn't started
  if (gameState.phase !== 'drawing' || !gameState.displayWord) {
    return null;
  }
  
  // For the drawer, we show the actual word they're drawing
  if (isDrawer) {
    return null; // The word is already shown in GameControls for the drawer
  }
  
  return (
    <div className="mb-4 text-center">
      <div className="text-sm font-medium text-secondary-foreground/70 mb-2">
        Guess the word
      </div>
      <div className="flex justify-center flex-wrap gap-x-1 gap-y-3">
        {gameState.displayWord.split('').map((char, index) => (
          <div 
            key={index} 
            className={`letter-space ${char !== '_' && char !== ' ' ? 'letter-revealed' : ''}`}
          >
            {char === ' ' ? '\u00A0' : char}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WordDisplay;
