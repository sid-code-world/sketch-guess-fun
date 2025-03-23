
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import Canvas from "@/components/Canvas";
import WordSelection from "@/components/WordSelection";
import GameControls from "@/components/GameControls";
import ColorPalette from "@/components/ColorPalette";
import WordDisplay from "@/components/WordDisplay";
import PlayerList from "@/components/PlayerList";
import { toast } from "sonner";

const GameRoom = () => {
  const { gameState, startGame, resetGame } = useGame();
  const navigate = useNavigate();
  
  // Handle navigation back to home
  const handleBackToHome = () => {
    resetGame();
    navigate("/");
  };
  
  // Display round end or game end message
  useEffect(() => {
    if (gameState.phase === 'round-end') {
      toast.info(`Round ${gameState.roundNumber} completed! Next round starting soon...`);
    } else if (gameState.phase === 'game-end') {
      toast.success("Game completed! Check the final scores!");
    }
  }, [gameState.phase, gameState.roundNumber]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-6 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Sketch Guess</h1>
          
          <div className="flex gap-3">
            {/* Start game button (only in lobby) */}
            {gameState.phase === 'lobby' && (
              <button
                onClick={startGame}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 button-transition"
              >
                Start Game
              </button>
            )}
            
            {/* Reset game button (only after game has started) */}
            {gameState.phase !== 'lobby' && (
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 button-transition"
              >
                Reset Game
              </button>
            )}
            
            {/* Back to home button */}
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 border border-primary/20 text-primary rounded-lg font-medium hover:bg-secondary/50 button-transition"
            >
              Back to Home
            </button>
          </div>
        </div>
        
        {/* Game status display */}
        <div className="mb-6 text-center">
          {gameState.phase === 'lobby' && (
            <div className="text-lg animate-pulse-subtle">
              Waiting to start the game...
            </div>
          )}
          {gameState.phase === 'word-selection' && !gameState.currentDrawer?.isComputer && (
            <div className="text-lg">
              {gameState.currentDrawer?.name} is choosing a word...
            </div>
          )}
          {gameState.phase === 'round-end' && (
            <div className="text-lg font-medium">
              Round {gameState.roundNumber} completed! The word was: <span className="text-primary">{gameState.currentWord}</span>
            </div>
          )}
          {gameState.phase === 'game-end' && (
            <div className="text-lg font-medium">
              Game over! The final word was: <span className="text-primary">{gameState.currentWord}</span>
            </div>
          )}
          
          {/* Round indicator */}
          {gameState.phase !== 'lobby' && (
            <div className="text-sm text-muted-foreground mt-1">
              Round {gameState.roundNumber} of {gameState.totalRounds}
            </div>
          )}
        </div>
        
        {/* Main game content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - player list */}
          <div className="lg:col-span-1">
            <PlayerList />
          </div>
          
          {/* Main content - canvas and controls */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Word to guess display */}
            <WordDisplay />
            
            {/* Drawing canvas */}
            <Canvas />
            
            {/* Game controls */}
            <div className="mt-3">
              <GameControls />
            </div>
            
            {/* Color palette */}
            <div className="mt-2">
              <ColorPalette />
            </div>
          </div>
        </div>
        
        {/* Word selection modal */}
        <WordSelection />
      </div>
    </div>
  );
};

export default GameRoom;
