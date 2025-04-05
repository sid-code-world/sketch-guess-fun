
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { generateRoomId } from '@/utils/roomUtils';

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
  roomId: string | null;
  isHost: boolean;
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
  createRoom: () => string;
  joinRoom: (roomId: string) => void;
  copyRoomLink: () => void;
  isConnected: boolean;
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
  roomId: null,
  isHost: false,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [playerId] = useState<string>(`player-${Math.floor(Math.random() * 10000)}`);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
  const socketRef = useRef<WebSocket | null>(null);
  
  // Check if current user is the drawer
  const isDrawer = gameState.currentDrawer?.id === playerId;

  // Initialize the game with the player
  useEffect(() => {
    // If we have a roomId in the URL, try to join that room
    if (urlRoomId && !gameState.roomId) {
      console.log(`Trying to join room from URL: ${urlRoomId}`);
      joinRoom(urlRoomId);
    } else if (!gameState.players.length) {
      // Just initialize with the current player if no room to join
      const initialPlayers: Player[] = [
        { id: playerId, name: 'You', score: 0, isDrawing: false },
      ];
      
      setGameState(prev => ({
        ...prev,
        players: initialPlayers
      }));
    }
  }, [urlRoomId]);

  // Mock websocket connection for multiplayer
  const setupWebSocket = useCallback((roomId: string) => {
    // In a real app, we'd connect to a real WebSocket server
    console.log(`Setting up mock WebSocket for room: ${roomId}`);
    
    // Simulate connection establishment
    setTimeout(() => {
      console.log("Connected to game server!");
      setIsConnected(true);
      
      // If we're joining an existing room, simulate getting current players
      if (urlRoomId && urlRoomId === roomId) {
        // Simulate existing players in the room
        const mockPlayers: Player[] = [
          { id: playerId, name: 'You', score: 0, isDrawing: false },
          { id: 'player-5678', name: 'Guest 1', score: 0, isDrawing: false },
          { id: 'player-9012', name: 'Guest 2', score: 0, isDrawing: false },
        ];
        
        setGameState(prev => ({
          ...prev,
          players: mockPlayers,
          isHost: false,
        }));
        
        toast.success("Joined the game room!");
      } else {
        // We created the room, so we're the host
        setGameState(prev => ({
          ...prev,
          isHost: true,
        }));
        toast.success("Game room created! Share the link with friends to play together.");
      }
    }, 1000);
    
    // Cleanup function
    return () => {
      console.log("Disconnecting WebSocket");
      setIsConnected(false);
    };
  }, [playerId, urlRoomId]);

  // Create a new room
  const createRoom = useCallback(() => {
    const roomId = generateRoomId();
    
    setGameState(prev => ({
      ...prev,
      roomId,
      isHost: true,
    }));
    
    // Setup WebSocket connection
    const cleanupWs = setupWebSocket(roomId);
    
    // Navigate to the room URL
    navigate(`/game/${roomId}`);
    
    return roomId;
  }, [navigate, setupWebSocket]);

  // Join an existing room
  const joinRoom = useCallback((roomId: string) => {
    setGameState(prev => ({
      ...prev,
      roomId,
      isHost: false,
    }));
    
    // Setup WebSocket connection
    const cleanupWs = setupWebSocket(roomId);
    
    // Navigate to the room URL if we're not already there
    if (!urlRoomId) {
      navigate(`/game/${roomId}`);
    }
  }, [navigate, setupWebSocket, urlRoomId]);

  // Copy room link to clipboard
  const copyRoomLink = useCallback(() => {
    if (gameState.roomId) {
      const url = `${window.location.origin}/game/${gameState.roomId}`;
      navigator.clipboard.writeText(url);
      toast.success("Room link copied to clipboard!");
    }
  }, [gameState.roomId]);

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
    // Only the host can start the game
    if (gameState.roomId && !gameState.isHost) {
      toast.error("Only the host can start the game");
      return;
    }

    // Need at least 2 players to start
    if (gameState.players.length < 2) {
      // Add bots if needed
      const botsNeeded = 2 - gameState.players.length;
      if (botsNeeded > 0) {
        const bots: Player[] = [];
        for (let i = 1; i <= botsNeeded; i++) {
          bots.push({
            id: `bot-${i}`,
            name: `Bot ${i}`,
            score: 0,
            isDrawing: false,
            isComputer: true
          });
        }
        setGameState(prev => ({
          ...prev,
          players: [...prev.players, ...bots]
        }));
        toast.info("Added bots to fill the game");
      }
    }
    
    // Randomly select the first drawer
    setGameState(prev => {
      const randomIndex = Math.floor(Math.random() * prev.players.length);
      const updatedPlayers = prev.players.map((player, index) => ({
        ...player, 
        isDrawing: index === randomIndex
      }));
      
      return {
        ...prev,
        phase: 'word-selection',
        players: updatedPlayers,
        currentDrawer: updatedPlayers[randomIndex],
        roundNumber: 1,
      };
    });
    
    toast.info("Game started! Select a word to draw.");
  }, [gameState.players.length, gameState.roomId, gameState.isHost]);

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
      players,
      roomId: gameState.roomId,
      isHost: gameState.isHost
    });
    
    toast.info("Game reset! Ready to start a new game.");
  }, [gameState.players, gameState.roomId, gameState.isHost]);

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
        resetGame,
        createRoom,
        joinRoom,
        copyRoomLink,
        isConnected
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
