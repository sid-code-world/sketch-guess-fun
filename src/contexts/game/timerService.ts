
import { useCallback, useEffect } from 'react';
import { GameState, GamePhase } from './types';

export function useTimerService(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  handleRoundEnd: () => void
) {
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
  }, [gameState.phase, gameState.timeRemaining, handleRoundEnd, setGameState]);

  return {};
}
