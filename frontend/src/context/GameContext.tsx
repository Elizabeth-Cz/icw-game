"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

// Character interface
export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
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
  const { socket } = useSocket();

  // Load game state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('reconnectToken');
    const storedRoomCode = localStorage.getItem('roomCode');
    const storedPlayerId = localStorage.getItem('playerId');
    
    if (storedToken || storedRoomCode || storedPlayerId) {
      setGameState(prev => ({
        ...prev,
        reconnectToken: storedToken || prev.reconnectToken,
        roomCode: storedRoomCode || prev.roomCode,
        playerId: storedPlayerId || prev.playerId
      }));
    }
  }, []);

  // Save game state to localStorage when it changes
  useEffect(() => {
    if (gameState.reconnectToken) {
      localStorage.setItem('reconnectToken', gameState.reconnectToken);
    }
  }, [gameState.reconnectToken]);
  
  // Save roomCode to localStorage when it changes
  useEffect(() => {
    if (gameState.roomCode) {
      localStorage.setItem('roomCode', gameState.roomCode);
    }
  }, [gameState.roomCode]);
  
  // Save playerId to localStorage when it changes
  useEffect(() => {
    if (gameState.playerId) {
      localStorage.setItem('playerId', gameState.playerId);
    }
  }, [gameState.playerId]);

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
