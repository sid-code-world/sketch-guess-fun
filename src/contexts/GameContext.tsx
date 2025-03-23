import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Define types
export type GamePhase = 'lobby' | 'word-selection' | 'drawing' | 'round-end' | 'game-end';

export type Player = {
  id: string;
  name: string;
  score: number;
  isDrawing: boolean;
  isComputer?: boolean;
};

export type GameState = {
  phase: GamePhase;
  players: Player[];
  currentDrawer: Player | null;
  currentWord: string;
  displayWord: string;
  timeRemaining: number;
  roundTime: number;
  roundNumber: number;
  totalRounds: number;
};

type GameContextType = {
  gameState: GameState;
  isDrawer: boolean;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectWord: (word: string) => void;
  submitGuess: (guess: string) => boolean;
  startGame: () => void;
  updatePlayerName: (name: string) => void;
  resetGame: () => void;
};

const defaultGameState: GameState = {
  phase: 'lobby',
  players: [],
  currentDrawer: null,
  currentWord: '',
  displayWord: '',
  timeRemaining: 0,
  roundTime: 60,
  roundNumber: 0,
  totalRounds: 3,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [playerId] = useState<string>(`player-${Math.floor(Math.random() * 10000)}`);
  
  // Check if current user is the drawer
  const isDrawer = gameState.currentDrawer?.id === playerId;

  // Initialize the game with the player and bots
  useEffect(() => {
    if (gameState.players.length === 0) {
      const initialPlayers: Player[] = [
        { id: playerId, name: 'You', score: 0, isDrawing: false },
        { id: 'bot-1', name: 'Bot 1', score: 0, isDrawing: false, isComputer: true },
        { id: 'bot-2', name: 'Bot 2', score: 0, isDrawing: false, isComputer: true },
      ];
      
      setGameState(prev => ({
        ...prev,
        players: initialPlayers
      }));
    }
  }, [playerId]);

  // Timer logic
  useEffect(() => {
    if (gameState.phase === 'drawing' && gameState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          // Reveal more letters as time passes
          const revealLetterThresholds = [
            prev.roundTime * 0.7, // reveal first letter at 70% time remaining
            prev.roundTime * 0.5, // reveal another at 50%
            prev.roundTime * 0.3, // reveal another at 30%
          ];
          
          let newDisplayWord = prev.displayWord;
          
          // Check if we need to reveal a letter
          if (revealLetterThresholds.includes(prev.timeRemaining - 1)) {
            // Find a masked letter to reveal
            const maskedIndices = [];
            for (let i = 0; i < prev.currentWord.length; i++) {
              if (prev.displayWord[i] === '_' && prev.currentWord[i] !== ' ') {
                maskedIndices.push(i);
              }
            }
            
            if (maskedIndices.length > 0) {
              const randomIndex = maskedIndices[Math.floor(Math.random() * maskedIndices.length)];
              const wordChars = newDisplayWord.split('');
              wordChars[randomIndex] = prev.currentWord[randomIndex];
              newDisplayWord = wordChars.join('');
            }
          }
          
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
            displayWord: newDisplayWord,
          };
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (gameState.phase === 'drawing' && gameState.timeRemaining === 0) {
      // Round ended due to time
      handleRoundEnd();
    }
  }, [gameState.phase, gameState.timeRemaining]);

  // Handle round end
  const handleRoundEnd = useCallback(() => {
    setGameState(prev => {
      // Reveal the word
      toast.info(`The word was: ${prev.currentWord}`);
      
      if (prev.roundNumber >= prev.totalRounds) {
        // Game ended
        const winner = [...prev.players].sort((a, b) => b.score - a.score)[0];
        toast.success(`Game Over! ${winner.name} wins with ${winner.score} points!`);
        
        return {
          ...prev,
          phase: 'game-end',
          displayWord: prev.currentWord,
        };
      } else {
        // Prepare for next round
        return {
          ...prev,
          phase: 'round-end',
          displayWord: prev.currentWord,
        };
      }
    });
    
    // Automatically move to next round after delay
    setTimeout(() => {
      setGameState(prev => {
        if (prev.phase === 'round-end') {
          const nextRound = prev.roundNumber + 1;
          
          // Select next drawer
          const nextDrawerIndex = nextRound % prev.players.length;
          const players = prev.players.map((player, index) => ({
            ...player,
            isDrawing: index === nextDrawerIndex
          }));
          
          return {
            ...prev,
            phase: 'word-selection',
            roundNumber: nextRound,
            currentDrawer: players[nextDrawerIndex],
            players,
            currentWord: '',
            displayWord: '',
          };
        }
        return prev;
      });
    }, 5000);
  }, []);

  // Simulate bot guesses
  useEffect(() => {
    if (gameState.phase === 'drawing' && !isDrawer) {
      const botGuessTime = Math.random() * 20000 + 15000; // Between 15-35 seconds
      
      const botTimer = setTimeout(() => {
        const randomBot = gameState.players.find(p => p.isComputer && !p.isDrawing);
        
        if (randomBot) {
          // Bot guesses correctly
          const correctGuess = Math.random() > 0.5; // 50% chance for correct guess
          
          if (correctGuess) {
            // Simulate a correct bot guess
            handleCorrectGuess(randomBot.id);
            toast.success(`${randomBot.name} guessed the word!`);
          }
        }
      }, botGuessTime);
      
      return () => clearTimeout(botTimer);
    }
  }, [gameState.phase, isDrawer]);

  // Handle correct guess
  const handleCorrectGuess = (guesserId: string) => {
    setGameState(prev => {
      // Award points to both guesser and drawer
      const updatedPlayers = prev.players.map(player => {
        if (player.id === guesserId) {
          return { ...player, score: player.score + 100 }; // Guesser gets 100 points
        } else if (player.isDrawing) {
          return { ...player, score: player.score + 50 }; // Drawer gets 50 points
        }
        return player;
      });
      
      return {
        ...prev,
        players: updatedPlayers
      };
    });
  };

  // Start the game
  const startGame = useCallback(() => {
    // Randomly select the first drawer
    const randomIndex = Math.floor(Math.random() * gameState.players.length);
    const updatedPlayers = gameState.players.map((player, index) => ({
      ...player, 
      isDrawing: index === randomIndex
    }));
    
    setGameState(prev => ({
      ...prev,
      phase: 'word-selection',
      players: updatedPlayers,
      currentDrawer: updatedPlayers[randomIndex],
      roundNumber: 1,
    }));
    
    toast.info("Game started! Select a word to draw.");
  }, [gameState.players]);

  // Handle word selection
  const selectWord = useCallback((word: string) => {
    if (gameState.phase !== 'word-selection') return;
    
    // Create masked display word (show only spaces)
    const displayWord = word
      .split('')
      .map(char => char === ' ' ? ' ' : '_')
      .join('');
    
    setGameState(prev => ({
      ...prev,
      phase: 'drawing',
      currentWord: word,
      displayWord,
      timeRemaining: prev.roundTime,
    }));
    
    toast.info("Start drawing! Others will try to guess your word.");
  }, [gameState.phase]);

  // Handle guess submission
  const submitGuess = useCallback((guess: string) => {
    if (gameState.phase !== 'drawing' || isDrawer) return false;
    
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = gameState.currentWord.toLowerCase();
    
    if (normalizedGuess === normalizedWord) {
      // Correct guess
      handleCorrectGuess(playerId);
      toast.success("Correct! You guessed the word!");
      return true;
    } else {
      // Incorrect guess
      toast.error("Incorrect guess, try again!");
      return false;
    }
  }, [gameState.phase, gameState.currentWord, isDrawer, playerId]);

  // Update player name
  const updatePlayerName = useCallback((name: string) => {
    if (!name.trim()) return;
    
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player => 
        player.id === playerId ? { ...player, name } : player
      )
    }));
    
    toast.success(`Name updated to ${name}!`);
  }, [playerId]);

  // Reset game
  const resetGame = useCallback(() => {
    const players = gameState.players.map(player => ({
      ...player,
      score: 0,
      isDrawing: false
    }));
    
    setGameState({
      ...defaultGameState,
      players
    });
    
    toast.info("Game reset! Ready to start a new game.");
  }, [gameState.players]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        isDrawer,
        selectedColor,
        setSelectedColor,
        selectWord,
        submitGuess,
        startGame,
        updatePlayerName,
        resetGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
