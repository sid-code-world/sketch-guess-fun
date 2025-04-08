
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { GameState, GameContextType, defaultGameState, Player } from './game/types';
import { useWebSocketService } from './game/websocketService';
import { useGameService } from './game/gameService';
import { useRoomService } from './game/roomService';
import { useTimerService } from './game/timerService';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [playerId] = useState<string>(`player-${Math.floor(Math.random() * 10000)}`);
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
  
  // Initialize WebSocket service
  const { isConnected, socket, sendMessage } = useWebSocketService(playerId, setGameState);
  
  // Initialize game services
  const { 
    isDrawer, 
    handleRoundEnd,
    startGame, 
    selectWord, 
    submitGuess,
    resetGame 
  } = useGameService(gameState, setGameState, playerId, sendMessage);
  
  const {
    createRoom,
    joinRoom,
    copyRoomLink,
    updatePlayerName
  } = useRoomService(gameState, setGameState, playerId, sendMessage, urlRoomId);
  
  // Initialize timer
  useTimerService(gameState, setGameState, handleRoundEnd);
  
  // Handle initial room setup from URL parameters
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
