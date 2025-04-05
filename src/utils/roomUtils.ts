
/**
 * Generates a random room ID of specified length
 * @param length Length of the room ID
 * @returns A random room ID string
 */
export const generateRoomId = (length: number = 6): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Gets the full room URL for sharing
 * @param roomId The room ID
 * @returns The full URL for sharing
 */
export const getRoomUrl = (roomId: string): string => {
  return `${window.location.origin}/game/${roomId}`;
};
