export const GAME_STORAGE_KEYS = {
  reconnectToken: 'reconnectToken',
  roomCode: 'roomCode',
  playerId: 'playerId',
} as const;

type StoredGameSessionInput = {
  reconnectToken?: string | null;
  roomCode?: string | null;
  playerId?: string | null;
};

const setIfPresent = (key: string, value?: string | null) => {
  if (!value) return;
  localStorage.setItem(key, value);
};

export const getStoredGameSession = () => ({
  reconnectToken: localStorage.getItem(GAME_STORAGE_KEYS.reconnectToken),
  roomCode: localStorage.getItem(GAME_STORAGE_KEYS.roomCode),
  playerId: localStorage.getItem(GAME_STORAGE_KEYS.playerId),
});

export const setStoredGameSession = ({ reconnectToken, roomCode, playerId }: StoredGameSessionInput) => {
  setIfPresent(GAME_STORAGE_KEYS.reconnectToken, reconnectToken);
  setIfPresent(GAME_STORAGE_KEYS.roomCode, roomCode);
  setIfPresent(GAME_STORAGE_KEYS.playerId, playerId);
};

export const clearStoredGameSession = () => {
  localStorage.removeItem(GAME_STORAGE_KEYS.reconnectToken);
  localStorage.removeItem(GAME_STORAGE_KEYS.roomCode);
  localStorage.removeItem(GAME_STORAGE_KEYS.playerId);
};
