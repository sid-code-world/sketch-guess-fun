import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { generateRoomId, getRoomUrl } from '@/utils/roomUtils';
import { createWebSocketConnection, sendWebSocketMessage, WebSocketEventType, WebSocketMessage } from '@/utils/websocketUtils';

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

  // WebSocket event handler
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log("Received WebSocket message:", message);

      switch(message.type) {
        case 'player_joined':
          if (message.payload?.players) {
            setGameState(prev => ({
              ...prev,
              players: message.payload.players
            }));
            toast.info(`${message.payload.newPlayer.name} joined the game!`);
          }
          break;
          
        case 'start_game':
          if (message.payload?.gameState) {
            setGameState(prev => ({
              ...prev,
              phase: message.payload.gameState.phase,
              players: message.payload.gameState.players,
              currentDrawer: message.payload.gameState.currentDrawer,
              roundNumber: message.payload.gameState.roundNumber,
            }));
            toast.info("Game started! Select a word to draw.");
          }
          break;
          
        case 'select_word':
          if (message.payload?.word) {
            const word = message.payload.word;
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
            
            if (!isDrawer) {
              toast.info(`${gameState.currentDrawer?.name} is drawing now! Try to guess the word.`);
            }
          }
          break;
          
        case 'correct_guess':
          if (message.payload?.playerId && message.payload?.players) {
            setGameState(prev => ({
              ...prev,
              players: message.payload.players
            }));
            
            const playerName = message.payload.players.find((p: Player) => p.id === message.payload.playerId)?.name;
            if (playerName) {
              toast.success(`${playerName} guessed the word!`);
            }
          }
          break;
          
        case 'round_end':
          if (message.payload?.gameState) {
            setGameState(prev => ({
              ...prev,
              phase: message.payload.gameState.phase,
              displayWord: message.payload.gameState.currentWord,
            }));
            toast.info(`Round ended! The word was: ${message.payload.gameState.currentWord}`);
          }
          break;
          
        case 'game_end':
          if (message.payload?.gameState) {
            setGameState(prev => ({
              ...prev,
              phase: 'game-end',
              displayWord: message.payload.gameState.currentWord,
              players: message.payload.gameState.players,
            }));
            
            // Find winner
            const winner = [...message.payload.gameState.players].sort((a, b) => b.score - a.score)[0];
            toast.success(`Game Over! ${winner.name} wins with ${winner.score} points!`);
          }
          break;
          
        case 'error':
          toast.error(message.payload?.message || "An error occurred");
          break;
          
        default:
          console.log("Unhandled WebSocket message type:", message.type);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }, [isDrawer, gameState.currentDrawer?.name]);

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

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    console.log("Setting up WebSocket connection");
    const ws = createWebSocketConnection();
    socketRef.current = ws;
    
    // Setup event handlers
    ws.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };
    
    ws.onmessage = handleWebSocketMessage;
    
    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      toast.error("Disconnected from game server");
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
      toast.error("Error connecting to game server");
    };
    
    // Cleanup function
    return () => {
      console.log("Cleaning up WebSocket connection");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [handleWebSocketMessage]);

  // Setup WebSocket on component mount
  useEffect(() => {
    const cleanup = setupWebSocket();
    
    // Heartbeat to keep WebSocket connection alive
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      cleanup();
      clearInterval(heartbeatInterval);
    };
  }, [setupWebSocket]);

  // Create a new room
  const createRoom = useCallback(() => {
    const roomId = generateRoomId();
    
    setGameState(prev => ({
      ...prev,
      roomId,
      isHost: true,
    }));
    
    // Send create room message to WebSocket server
    sendWebSocketMessage(socketRef.current, 'create_room', roomId, {
      playerId,
      playerName: 'You',
    });
    
    // Navigate to the room URL
    navigate(`/game/${roomId}`);
    
    return roomId;
  }, [navigate, playerId]);

  // Join an existing room
  const joinRoom = useCallback((roomId: string) => {
    setGameState(prev => ({
      ...prev,
      roomId,
      isHost: false,
    }));
    
    // Send join room message to WebSocket server
    sendWebSocketMessage(socketRef.current, 'join_room', roomId, {
      playerId,
      playerName: 'You',
    });
    
    // Navigate to the room URL if we're not already there
    if (!urlRoomId) {
      navigate(`/game/${roomId}`);
    }
  }, [navigate, playerId, urlRoomId]);

  // Copy room link to clipboard
  const copyRoomLink = useCallback(() => {
    if (gameState.roomId) {
      const url = getRoomUrl(gameState.roomId);
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
    // Send round end message to WebSocket server
    sendWebSocketMessage(socketRef.current, 'round_end', gameState.roomId, {
      gameState
    });
    
    setGameState(prev => {
      // Reveal the word
      toast.info(`The word was: ${prev.currentWord}`);
      
      if (prev.roundNumber >= prev.totalRounds) {
        // Game ended
        const winner = [...prev.players].sort((a, b) => b.score - a.score)[0];
        toast.success(`Game Over! ${winner.name} wins with ${winner.score} points!`);
        
        // Send game end message to WebSocket server
        sendWebSocketMessage(socketRef.current, 'game_end', prev.roomId, {
          gameState: prev
        });
        
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
  }, [gameState]);

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
      
      const updatedState = {
        ...prev,
        phase: 'word-selection',
        players: updatedPlayers,
        currentDrawer: updatedPlayers[randomIndex],
        roundNumber: 1,
      };
      
      // Send start game message to WebSocket server
      sendWebSocketMessage(socketRef.current, 'start_game', prev.roomId, {
        gameState: updatedState
      });
      
      return updatedState;
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
    
    // Send select word message to WebSocket server
    sendWebSocketMessage(socketRef.current, 'select_word', gameState.roomId, {
      word,
      playerId
    });
    
    setGameState(prev => ({
      ...prev,
      phase: 'drawing',
      currentWord: word,
      displayWord,
      timeRemaining: prev.roundTime,
    }));
    
    toast.info("Start drawing! Others will try to guess your word.");
  }, [gameState.phase, gameState.roomId, playerId]);

  // Handle guess submission
  const submitGuess = useCallback((guess: string) => {
    if (gameState.phase !== 'drawing' || isDrawer) return false;
    
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = gameState.currentWord.toLowerCase();
    
    // Send guess message to WebSocket server
    sendWebSocketMessage(socketRef.current, 'guess', gameState.roomId, {
      guess: normalizedGuess,
      playerId
    });
    
    if (normalizedGuess === normalizedWord) {
      // Correct guess - update will come from server
      toast.success("Correct! You guessed the word!");
      return true;
    } else {
      // Incorrect guess
      toast.error("Incorrect guess, try again!");
      return false;
    }
  }, [gameState.phase, gameState.currentWord, isDrawer, gameState.roomId, playerId]);

  // Update player name
  const updatePlayerName = useCallback((name: string) => {
    if (!name.trim()) return;
    
    // Send update player name message to WebSocket server
    sendWebSocketMessage(socketRef.current, 'update_player_name', gameState.roomId, {
      playerId,
      name
    });
    
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player => 
        player.id === playerId ? { ...player, name } : player
      )
    }));
    
    toast.success(`Name updated to ${name}!`);
  }, [playerId, gameState.roomId]);

  // Reset game
  const resetGame = useCallback(() => {
    const players = gameState.players.map(player => ({
      ...player,
      score: 0,
      isDrawing: false
    }));
    
    // Send reset game message to WebSocket server
    sendWebSocketMessage(socketRef.current, 'reset_game', gameState.roomId, {
      playerId
    });
    
    setGameState({
      ...defaultGameState,
      players,
      roomId: gameState.roomId,
      isHost: gameState.isHost
    });
    
    toast.info("Game reset! Ready to start a new game.");
  }, [gameState.players, gameState.roomId, gameState.isHost, playerId]);

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
