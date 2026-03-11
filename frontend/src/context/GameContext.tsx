"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getStoredGameSession, setStoredGameSession } from '@/lib/gameSessionStorage';

const getEliminatedCardsStorageKey = (roomCode: string, playerId: string, secretCharacterId: string) =>
  `eliminatedCharacterIds:${roomCode}:${playerId}:${secretCharacterId}`;

// Character interface
export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
  imageUrl?: string;
}

// Game state interface
interface GameState {
  roomCode: string | null;
  playerId: string | null;
  playerName: string | null;
  secretCharacter: Character | null;
  allCharacters: Character[];
  eliminatedCharacterIds: string[];
  gameStatus: 'waiting' | 'active' | 'disconnected';
  opponentConnected: boolean;
  reconnectToken: string | null;
}

// Game context interface
interface GameContextType {
  gameState: GameState;
  setRoomCode: (code: string) => void;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setSecretCharacter: (character: Character) => void;
  setAllCharacters: (characters: Character[]) => void;
  toggleCharacterElimination: (characterId: string) => void;
  setGameStatus: (status: 'waiting' | 'active' | 'disconnected') => void;
  setOpponentConnected: (connected: boolean) => void;
  setReconnectToken: (token: string) => void;
  resetGame: () => void;
  resetEliminations: () => void;
}

// Initial game state
const initialGameState: GameState = {
  roomCode: null,
  playerId: null,
  playerName: null,
  secretCharacter: null,
  allCharacters: [],
  eliminatedCharacterIds: [],
  gameStatus: 'waiting',
  opponentConnected: false,
  reconnectToken: null,
};

// Create context
const GameContext = createContext<GameContextType>({
  gameState: initialGameState,
  setRoomCode: () => {},
  setPlayerId: () => {},
  setPlayerName: () => {},
  setSecretCharacter: () => {},
  setAllCharacters: () => {},
  toggleCharacterElimination: () => {},
  setGameStatus: () => {},
  setOpponentConnected: () => {},
  setReconnectToken: () => {},
  resetGame: () => {},
  resetEliminations: () => {},
});

// Custom hook to use game context
export const useGame = () => useContext(GameContext);

// Game provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const hydratedEliminationsKeyRef = useRef<string | null>(null);

  // Load game state from localStorage on mount
  useEffect(() => {
    const { reconnectToken, roomCode, playerId } = getStoredGameSession();
    
    if (reconnectToken || roomCode || playerId) {
      setGameState(prev => ({
        ...prev,
        reconnectToken: reconnectToken || prev.reconnectToken,
        roomCode: roomCode || prev.roomCode,
        playerId: playerId || prev.playerId
      }));
    }
  }, []);

  // Save game session state to localStorage when it changes
  useEffect(() => {
    setStoredGameSession({
      reconnectToken: gameState.reconnectToken,
      roomCode: gameState.roomCode,
      playerId: gameState.playerId,
    });
  }, [gameState.reconnectToken, gameState.roomCode, gameState.playerId]);

  // Rehydrate eliminated cards for the active player/room/secret character
  useEffect(() => {
    const { roomCode, playerId, secretCharacter } = gameState;

    if (!roomCode || !playerId || !secretCharacter?.id) {
      hydratedEliminationsKeyRef.current = null;
      setGameState(prev => ({ ...prev, eliminatedCharacterIds: [] }));
      return;
    }

    const storageKey = getEliminatedCardsStorageKey(roomCode, playerId, secretCharacter.id);
    const storedEliminations = localStorage.getItem(storageKey);

    if (!storedEliminations) {
      setGameState(prev => ({ ...prev, eliminatedCharacterIds: [] }));
      hydratedEliminationsKeyRef.current = storageKey;
      return;
    }

    try {
      const parsed = JSON.parse(storedEliminations);
      const eliminatedIds = Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [];

      setGameState(prev => ({ ...prev, eliminatedCharacterIds: eliminatedIds }));
    } catch (error) {
      console.error('Failed to parse persisted eliminated cards:', error);
      setGameState(prev => ({ ...prev, eliminatedCharacterIds: [] }));
    }

    hydratedEliminationsKeyRef.current = storageKey;
  }, [gameState.roomCode, gameState.playerId, gameState.secretCharacter?.id]);

  // Persist eliminated cards for the active player/room/secret character
  useEffect(() => {
    const { roomCode, playerId, secretCharacter, eliminatedCharacterIds } = gameState;

    if (!roomCode || !playerId || !secretCharacter?.id) {
      return;
    }

    const storageKey = getEliminatedCardsStorageKey(roomCode, playerId, secretCharacter.id);

    // Avoid writing before initial hydration for the active key completes
    if (hydratedEliminationsKeyRef.current !== storageKey) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(eliminatedCharacterIds));
  }, [
    gameState.roomCode,
    gameState.playerId,
    gameState.secretCharacter?.id,
    gameState.eliminatedCharacterIds,
  ]);

  // Set room code
  const setRoomCode = (code: string) => {
    setGameState(prev => ({ ...prev, roomCode: code }));
  };

  // Set player ID
  const setPlayerId = (id: string) => {
    setGameState(prev => ({ ...prev, playerId: id }));
  };

  // Set player name
  const setPlayerName = (name: string) => {
    setGameState(prev => ({ ...prev, playerName: name }));
  };

  // Set secret character
  const setSecretCharacter = (character: Character) => {
    setGameState(prev => ({ ...prev, secretCharacter: character }));
  };

  // Set all characters
  const setAllCharacters = (characters: Character[]) => {
    setGameState(prev => ({ ...prev, allCharacters: characters }));
  };

  // Toggle character elimination
  const toggleCharacterElimination = (characterId: string) => {
    setGameState(prev => {
      const isEliminated = prev.eliminatedCharacterIds.includes(characterId);
      
      if (isEliminated) {
        // Remove from eliminated list
        return {
          ...prev,
          eliminatedCharacterIds: prev.eliminatedCharacterIds.filter(id => id !== characterId),
        };
      } else {
        // Add to eliminated list
        return {
          ...prev,
          eliminatedCharacterIds: [...prev.eliminatedCharacterIds, characterId],
        };
      }
    });
  };

  // Set game status
  const setGameStatus = (status: 'waiting' | 'active' | 'disconnected') => {
    setGameState(prev => ({ ...prev, gameStatus: status }));
  };

  // Set opponent connected status
  const setOpponentConnected = (connected: boolean) => {
    setGameState(prev => ({ ...prev, opponentConnected: connected }));
  };

  // Set reconnect token
  const setReconnectToken = (token: string) => {
    setGameState(prev => ({ ...prev, reconnectToken: token }));
  };

  // Reset game state (but keep reconnect token)
  const resetGame = () => {
    const { reconnectToken } = gameState;
    setGameState({ ...initialGameState, reconnectToken });
  };

  // Reset eliminations only
  const resetEliminations = () => {
    setGameState(prev => ({ ...prev, eliminatedCharacterIds: [] }));
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setRoomCode,
        setPlayerId,
        setPlayerName,
        setSecretCharacter,
        setAllCharacters,
        toggleCharacterElimination,
        setGameStatus,
        setOpponentConnected,
        setReconnectToken,
        resetGame,
        resetEliminations,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
