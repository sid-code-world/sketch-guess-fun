
// WebSocket event types
export type WebSocketEventType = 
  | 'join_room'
  | 'create_room'
  | 'player_joined'
  | 'start_game'
  | 'select_word'
  | 'draw'
  | 'clear_canvas'
  | 'guess'
  | 'correct_guess'
  | 'round_end'
  | 'game_end'
  | 'reset_game'
  | 'update_player_name'
  | 'error';

// Base WebSocket message interface
export interface WebSocketMessage {
  type: WebSocketEventType;
  roomId?: string;
  payload?: any;
}

// WebSocket server URL
export const WS_SERVER_URL = "wss://sketch-guess-server.glitch.me";

/**
 * Creates a new WebSocket connection
 * @returns WebSocket connection
 */
export const createWebSocketConnection = (): WebSocket => {
  return new WebSocket(WS_SERVER_URL);
};

/**
 * Sends a message through WebSocket
 * @param ws WebSocket connection
 * @param type Message type
 * @param roomId Room ID
 * @param payload Message payload
 */
export const sendWebSocketMessage = (
  ws: WebSocket | null,
  type: WebSocketEventType,
  roomId?: string,
  payload?: any
): void => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket is not connected");
    return;
  }

  const message: WebSocketMessage = {
    type,
    roomId,
    payload
  };

  ws.send(JSON.stringify(message));
};

