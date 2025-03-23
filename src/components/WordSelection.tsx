
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { getRandomWordSelection } from "@/utils/wordList";

export const WordSelection = () => {
  const { gameState, isDrawer, selectWord } = useGame();
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  
  // Generate word options when the component mounts and we're in word selection phase
  useEffect(() => {
    if (gameState.phase === 'word-selection' && isDrawer) {
      const options = getRandomWordSelection(3);
      setWordOptions(options);
      console.log("Word options generated:", options);
    }
  }, [gameState.phase, isDrawer]);
  
  // Don't show anything if we're not in word selection phase or the user isn't the drawer
  if (gameState.phase !== 'word-selection' || !isDrawer) {
    return null;
  }
  
  const handleWordSelection = (word: string) => {
    console.log("Word selected:", word);
    selectWord(word);
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-10 bg-black/50 backdrop-blur-sm">
      <div className="glass-panel p-6 max-w-md w-full animate-scale-in">
        <h2 className="text-xl font-semibold text-center mb-6">
          Choose a word to draw
        </h2>
        
        <div className="grid gap-3">
          {wordOptions.map((word) => (
            <button
              key={word}
              className="py-4 px-6 bg-white/20 hover:bg-white/40 font-medium rounded-lg text-lg button-transition"
              onClick={() => handleWordSelection(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WordSelection;
