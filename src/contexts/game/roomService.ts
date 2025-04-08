
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateRoomId, getRoomUrl } from '@/utils/roomUtils';
import { GameState } from './types';

export function useRoomService(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  playerId: string,
  sendMessage: (type: string, roomId: string | null, payload: any) => void,
  urlRoomId?: string
) {
  const navigate = useNavigate();

  const createRoom = useCallback(() => {
    const roomId = generateRoomId();
    
    setGameState(prev => ({
      ...prev,
      roomId,
      isHost: true,
    }));
    
    sendMessage('create_room', roomId, {
      playerId,
      playerName: 'You',
    });
    
    navigate(`/game/${roomId}`);
    
    return roomId;
  }, [navigate, playerId, sendMessage, setGameState]);

  const joinRoom = useCallback((roomId: string) => {
    setGameState(prev => ({
      ...prev,
      roomId,
      isHost: false,
    }));
    
    sendMessage('join_room', roomId, {
      playerId,
      playerName: 'You',
    });
    
    if (!urlRoomId) {
      navigate(`/game/${roomId}`);
    }
  }, [navigate, playerId, urlRoomId, sendMessage, setGameState]);

  const copyRoomLink = useCallback(() => {
    if (gameState.roomId) {
      const url = getRoomUrl(gameState.roomId);
      navigator.clipboard.writeText(url);
      toast.success("Room link copied to clipboard!");
    }
  }, [gameState.roomId]);

  const updatePlayerName = useCallback((name: string) => {
    if (!name.trim()) return;
    
    sendMessage('update_player_name', gameState.roomId, {
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
  }, [playerId, gameState.roomId, sendMessage, setGameState]);

  return {
    createRoom,
    joinRoom,
    copyRoomLink,
    updatePlayerName
  };
}
