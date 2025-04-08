
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

export const defaultGameState: GameState = {
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

export type GameContextType = {
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
