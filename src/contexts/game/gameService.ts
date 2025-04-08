
import { useCallback } from 'react';
import { toast } from 'sonner';
import { generateRoomId, getRoomUrl } from '@/utils/roomUtils';
import { GameState, GamePhase, Player } from './types';

export function useGameService(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  playerId: string,
  sendMessage: (type: string, roomId: string | null, payload: any) => void
) {
  const isDrawer = gameState.currentDrawer?.id === playerId;

  const handleRoundEnd = useCallback(() => {
    sendMessage('round_end', gameState.roomId, {
      gameState
    });
    
    setGameState(prev => {
      toast.info(`The word was: ${prev.currentWord}`);
      
      if (prev.roundNumber >= prev.totalRounds) {
        const winner = [...prev.players].sort((a, b) => b.score - a.score)[0];
        toast.success(`Game Over! ${winner.name} wins with ${winner.score} points!`);
        
        sendMessage('game_end', prev.roomId, {
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
  }, [gameState, sendMessage, setGameState]);

  // Game control functions
  const startGame = useCallback(() => {
    if (gameState.roomId && !gameState.isHost) {
      toast.error("Only the host can start the game");
      return;
    }
    
    // Add bots if needed
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
      
      sendMessage('start_game', prev.roomId, {
        gameState: updatedState
      });
      
      return updatedState;
    });
    
    toast.info("Game started! Select a word to draw.");
  }, [gameState.players.length, gameState.roomId, gameState.isHost, sendMessage, setGameState]);

  const selectWord = useCallback((word: string) => {
    if (gameState.phase !== 'word-selection') return;
    
    const displayWord = word
      .split('')
      .map(char => char === ' ' ? ' ' : '_')
      .join('');
    
    sendMessage('select_word', gameState.roomId, {
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
  }, [gameState.phase, gameState.roomId, playerId, sendMessage, setGameState]);

  const submitGuess = useCallback((guess: string) => {
    if (gameState.phase !== 'drawing' || isDrawer) return false;
    
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = gameState.currentWord.toLowerCase();
    
    sendMessage('guess', gameState.roomId, {
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
  }, [gameState.phase, gameState.currentWord, isDrawer, gameState.roomId, playerId, sendMessage]);

  const resetGame = useCallback(() => {
    const players = gameState.players.map(player => ({
      ...player,
      score: 0,
      isDrawing: false
    }));
    
    sendMessage('reset_game', gameState.roomId, {
      playerId
    });
    
    setGameState(prev => ({
      ...prev,
      phase: 'lobby' as GamePhase,
      players,
      currentDrawer: null,
      currentWord: '',
      displayWord: '',
      timeRemaining: 0,
      roundNumber: 0,
      roomId: prev.roomId,
      isHost: prev.isHost
    }));
    
    toast.info("Game reset! Ready to start a new game.");
  }, [gameState.players, gameState.roomId, playerId, sendMessage, setGameState]);

  return {
    isDrawer,
    handleRoundEnd,
    startGame,
    selectWord,
    submitGuess,
    resetGame
  };
}
