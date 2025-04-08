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
  
  const isDrawer = gameState.currentDrawer?.id === playerId;

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
              phase: message.payload.gameState.phase as GamePhase,
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
              phase: 'drawing' as GamePhase,
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
              phase: message.payload.gameState.phase as GamePhase,
              displayWord: message.payload.gameState.currentWord,
            }));
            toast.info(`Round ended! The word was: ${message.payload.gameState.currentWord}`);
          }
          break;
          
        case 'game_end':
          if (message.payload?.gameState) {
            setGameState(prev => ({
              ...prev,
              phase: 'game-end' as GamePhase,
              displayWord: message.payload.gameState.currentWord,
              players: message.payload.gameState.players,
            }));
            
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

  useEffect(() => {
    if (urlRoomId && !gameState.roomId) {
      console.log(`Trying to join room from URL: ${urlRoomId}`);
      joinRoom(urlRoomId);
    } else if (!gameState.players.length) {
      const initialPlayers: Player[] = [
        { id: playerId, name: 'You', score: 0, isDrawing: false },
      ];
      
      setGameState(prev => ({
        ...prev,
        players: initialPlayers
      }));
    }
  }, [urlRoomId]);

  const setupWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    console.log("Setting up WebSocket connection");
    const ws = createWebSocketConnection();
    socketRef.current = ws;
    
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
    
    return () => {
      console.log("Cleaning up WebSocket connection");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [handleWebSocketMessage]);

  useEffect(() => {
    const cleanup = setupWebSocket();
    
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000);
    
    return () => {
      cleanup();
      clearInterval(heartbeatInterval);
    };
  }, [setupWebSocket]);

  const createRoom = useCallback(() => {
    const roomId = generateRoomId();
    
    setGameState(prev => ({
      ...prev,
      roomId,
      isHost: true,
    }));
    
    sendWebSocketMessage(socketRef.current, 'create_room', roomId, {
      playerId,
      playerName: 'You',
    });
    
    navigate(`/game/${roomId}`);
    
    return roomId;
  }, [navigate, playerId]);

  const joinRoom = useCallback((roomId: string) => {
    setGameState(prev => ({
      ...prev,
      roomId,
      isHost: false,
    }));
    
    sendWebSocketMessage(socketRef.current, 'join_room', roomId, {
      playerId,
      playerName: 'You',
    });
    
    if (!urlRoomId) {
      navigate(`/game/${roomId}`);
    }
  }, [navigate, playerId, urlRoomId]);

  const copyRoomLink = useCallback(() => {
    if (gameState.roomId) {
      const url = getRoomUrl(gameState.roomId);
      navigator.clipboard.writeText(url);
      toast.success("Room link copied to clipboard!");
    }
  }, [gameState.roomId]);

  useEffect(() => {
    if (gameState.phase === 'drawing' && gameState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          const revealLetterThresholds = [
            prev.roundTime * 0.7,
            prev.roundTime * 0.5,
            prev.roundTime * 0.3,
          ];
          
          let newDisplayWord = prev.displayWord;
          
          if (revealLetterThresholds.includes(prev.timeRemaining - 1)) {
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
      handleRoundEnd();
    }
  }, [gameState.phase, gameState.timeRemaining]);

  const handleRoundEnd = useCallback(() => {
    sendWebSocketMessage(socketRef.current, 'round_end', gameState.roomId, {
      gameState
    });
    
    setGameState(prev => {
      toast.info(`The word was: ${prev.currentWord}`);
      
      if (prev.roundNumber >= prev.totalRounds) {
        const winner = [...prev.players].sort((a, b) => b.score - a.score)[0];
        toast.success(`Game Over! ${winner.name} wins with ${winner.score} points!`);
        
        sendWebSocketMessage(socketRef.current, 'game_end', prev.roomId, {
          gameState: prev
        });
        
        return {
          ...prev,
          phase: 'game-end' as GamePhase,
          displayWord: prev.currentWord,
        };
      } else {
        return {
          ...prev,
          phase: 'round-end' as GamePhase,
          displayWord: prev.currentWord,
        };
      }
    });
    
    setTimeout(() => {
      setGameState(prev => {
        if (prev.phase === 'round-end') {
          const nextRound = prev.roundNumber + 1;
          
          const nextDrawerIndex = nextRound % prev.players.length;
          const players = prev.players.map((player, index) => ({
            ...player,
            isDrawing: index === nextDrawerIndex
          }));
          
          return {
            ...prev,
            phase: 'word-selection' as GamePhase,
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

  const startGame = useCallback(() => {
    if (gameState.roomId && !gameState.isHost) {
      toast.error("Only the host can start the game");
      return;
    }
    
    if (gameState.players.length < 2) {
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
    
    setGameState(prev => {
      const randomIndex = Math.floor(Math.random() * prev.players.length);
      const updatedPlayers = prev.players.map((player, index) => ({
        ...player, 
        isDrawing: index === randomIndex
      }));
      
      const updatedState = {
        ...prev,
        phase: 'word-selection' as GamePhase,
        players: updatedPlayers,
        currentDrawer: updatedPlayers[randomIndex],
        roundNumber: 1,
      };
      
      sendWebSocketMessage(socketRef.current, 'start_game', prev.roomId, {
        gameState: updatedState
      });
      
      return updatedState;
    });
    
    toast.info("Game started! Select a word to draw.");
  }, [gameState.players.length, gameState.roomId, gameState.isHost]);

  const selectWord = useCallback((word: string) => {
    if (gameState.phase !== 'word-selection') return;
    
    const displayWord = word
      .split('')
      .map(char => char === ' ' ? ' ' : '_')
      .join('');
    
    sendWebSocketMessage(socketRef.current, 'select_word', gameState.roomId, {
      word,
      playerId
    });
    
    setGameState(prev => ({
      ...prev,
      phase: 'drawing' as GamePhase,
      currentWord: word,
      displayWord,
      timeRemaining: prev.roundTime,
    }));
    
    toast.info("Start drawing! Others will try to guess your word.");
  }, [gameState.phase, gameState.roomId, playerId]);

  const submitGuess = useCallback((guess: string) => {
    if (gameState.phase !== 'drawing' || isDrawer) return false;
    
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = gameState.currentWord.toLowerCase();
    
    sendWebSocketMessage(socketRef.current, 'guess', gameState.roomId, {
      guess: normalizedGuess,
      playerId
    });
    
    if (normalizedGuess === normalizedWord) {
      toast.success("Correct! You guessed the word!");
      return true;
    } else {
      toast.error("Incorrect guess, try again!");
      return false;
    }
  }, [gameState.phase, gameState.currentWord, isDrawer, gameState.roomId, playerId]);

  const updatePlayerName = useCallback((name: string) => {
    if (!name.trim()) return;
    
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

  const resetGame = useCallback(() => {
    const players = gameState.players.map(player => ({
      ...player,
      score: 0,
      isDrawing: false
    }));
    
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
