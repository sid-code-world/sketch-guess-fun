
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";

export const GameControls = () => {
  const { gameState, submitGuess, isDrawer } = useGame();
  const [guessInput, setGuessInput] = useState("");
  
  // Handle guess submission
  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guessInput.trim()) {
      toast.error("Please enter a guess");
      return;
    }
    
    submitGuess(guessInput);
    setGuessInput("");
  };
  
  // Format time remaining to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col w-full max-w-xl mx-auto">
      {/* Timer display */}
      {gameState.phase === 'drawing' && (
        <div className="flex items-center justify-center mb-3">
          <div className={`px-4 py-1.5 rounded-full font-medium
            ${gameState.timeRemaining <= 10 
              ? 'bg-red-100 text-red-700 animate-pulse-subtle' 
              : 'bg-secondary text-secondary-foreground'}`}>
            Time: {formatTime(gameState.timeRemaining)}
          </div>
        </div>
      )}
      
      {/* Guess input - only show for non-drawers during drawing phase */}
      {gameState.phase === 'drawing' && !isDrawer && (
        <form 
          onSubmit={handleSubmitGuess}
          className="flex items-center gap-2 animate-slide-in-bottom"
        >
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Type your guess here..."
            className="flex-1 px-4 py-2 rounded-lg border bg-white/60 backdrop-blur-sm text-primary focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 button-transition"
          >
            Guess
          </button>
        </form>
      )}
      
      {/* Drawer info */}
      {gameState.phase === 'drawing' && isDrawer && (
        <div className="py-2 text-center font-medium text-primary/80 animate-fade-in">
          You are drawing: <span className="font-semibold text-primary">{gameState.currentWord}</span>
        </div>
      )}
    </div>
  );
};

export default GameControls;
