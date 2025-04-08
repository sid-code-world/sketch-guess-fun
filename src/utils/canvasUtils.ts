
import { sendWebSocketMessage } from './websocketUtils';

/**
 * Send canvas drawing data through WebSocket
 * @param ws WebSocket connection
 * @param roomId Room ID
 * @param data Drawing data
 */
export const sendDrawingData = (
  ws: WebSocket | null,
  roomId: string | null,
  data: any
): void => {
  if (!ws || !roomId) return;
  
  sendWebSocketMessage(ws, 'draw', roomId, data);
};

/**
 * Send canvas clear command through WebSocket
 * @param ws WebSocket connection
 * @param roomId Room ID
 */
export const sendClearCanvas = (
  ws: WebSocket | null,
  roomId: string | null
): void => {
  if (!ws || !roomId) return;
  
  sendWebSocketMessage(ws, 'clear_canvas', roomId, {});
};
