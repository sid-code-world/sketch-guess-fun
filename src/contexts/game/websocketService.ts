
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { 
  createWebSocketConnection, 
  sendWebSocketMessage, 
  WebSocketMessage 
} from '@/utils/websocketUtils';
import { GameState, GamePhase } from './types';

export function useWebSocketService(
  playerId: string,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  
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
          }
          break;
          
        case 'correct_guess':
          if (message.payload?.playerId && message.payload?.players) {
            setGameState(prev => ({
              ...prev,
              players: message.payload.players
            }));
            
            const playerName = message.payload.players.find((p: any) => p.id === message.payload.playerId)?.name;
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
  }, [setGameState]);

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

  const sendMessage = useCallback((
    type: string, 
    roomId: string | null, 
    payload: any
  ) => {
    sendWebSocketMessage(socketRef.current, type as any, roomId || undefined, payload);
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    sendMessage
  };
}
