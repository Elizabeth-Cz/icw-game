"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame, Character } from "../../context/GameContext";
import CharacterCard from "../../components/CharacterCard";

export default function GameBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("roomCode");
  const { socket } = useSocket();
  const { 
    gameState, 
    setSecretCharacter, 
    setAllCharacters,
    toggleCharacterElimination,
    setGameStatus,
    setOpponentConnected,
    resetEliminations,
    setRoomCode,
    setPlayerId
  } = useGame();
  
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Characters are now loaded from the backend

  // Redirect if no room code
  useEffect(() => {
    if (!roomCode) {
      router.push("/");
    }
  }, [roomCode, router]);

  // Ensure we have room code and player ID from localStorage if not in game state
  useEffect(() => {
    if (!roomCode && localStorage.getItem("roomCode")) {
      const storedRoomCode = localStorage.getItem("roomCode");
      console.log('Retrieved room code from localStorage:', storedRoomCode);
      setRoomCode(storedRoomCode!);
    }
    
    if (!gameState.playerId && localStorage.getItem("playerId")) {
      const storedPlayerId = localStorage.getItem("playerId");
      console.log('Retrieved player ID from localStorage:', storedPlayerId);
      setPlayerId(storedPlayerId!);
    }
  }, [roomCode, gameState.playerId, setRoomCode, setPlayerId]);
  
  // Retry mechanism for loading characters
  useEffect(() => {
    if (!socket || !roomCode || !gameState.playerId) return;
    
    // Log current state for debugging
    console.log('Retry mechanism active with state:', {
      roomCode,
      playerId: gameState.playerId,
      isLoading,
      retryCount,
      hasCharacters: characters.length > 0,
      hasSecretCharacter: !!gameState.secretCharacter
    });
    
    // Set up retry timer if we don't have characters yet
    const retryTimer = setTimeout(() => {
      if (isLoading && retryCount < 5) {
        console.log(`Retry attempt ${retryCount + 1} for loading characters`);
        setRetryCount(retryCount + 1);
        
        // Request both secret character and all characters again
        socket.emit("request_secret_character", {
          roomCode,
          playerId: gameState.playerId,
        });
        
        socket.emit("get_all_characters", {
          roomCode,
          playerId: gameState.playerId
        });
      }
    }, 2000); // Retry every 2 seconds
    
    return () => clearTimeout(retryTimer);
  }, [socket, roomCode, gameState.playerId, isLoading, retryCount, characters.length, gameState.secretCharacter]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handle secret character assignment
    const handleSecretCharacterAssigned = ({ character }: { character: Character }) => {
      console.log('Secret character received:', character);
      setSecretCharacter(character);
      
      // If we now have both secret character and all characters, we're done loading
      if (characters.length > 0) {
        console.log('Both secret character and all characters loaded');
        setIsLoading(false);
      }
    };

    // Handle all characters received
    const handleAllCharactersReceived = ({ characters }: { characters: Character[] }) => {
      console.log('All characters received:', characters.length);
      setAllCharacters(characters);
      setCharacters(characters);
      
      // If we now have both secret character and all characters, we're done loading
      if (gameState.secretCharacter) {
        console.log('Both secret character and all characters loaded');
        setIsLoading(false);
      }
    };

    // Handle player disconnection
    const handlePlayerDisconnected = () => {
      setOpponentConnected(false);
      setGameStatus("disconnected");
    };

    // Handle player reconnection
    const handlePlayerReconnected = () => {
      setOpponentConnected(true);
      setGameStatus("active");
    };

    // Handle errors
    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    // Register event listeners
    socket.on("secret_character_assigned", handleSecretCharacterAssigned);
    socket.on("all_characters", handleAllCharactersReceived);
    socket.on("player_disconnected", handlePlayerDisconnected);
    socket.on("player_reconnected", handlePlayerReconnected);
    socket.on("room_error", handleError);

    // Always request both secret character and all characters on mount
    if (roomCode && gameState.playerId) {
      console.log('Requesting game data with:', { roomCode, playerId: gameState.playerId });
      
      // Request secret character
      socket.emit("request_secret_character", {
        roomCode,
        playerId: gameState.playerId,
      });
      
      // Also request all characters immediately, don't wait for secret character
      socket.emit("get_all_characters", {
        roomCode,
        playerId: gameState.playerId
      });
      
      console.log('Both requests sent');
    } else {
      console.log('Missing required data:', { 
        roomCode,
        playerId: gameState.playerId
      });
    }

    // Clean up event listeners
    return () => {
      socket.off("secret_character_assigned", handleSecretCharacterAssigned);
      socket.off("all_characters", handleAllCharactersReceived);
      socket.off("player_disconnected", handlePlayerDisconnected);
      socket.off("player_reconnected", handlePlayerReconnected);
      socket.off("room_error", handleError);
    };
  }, [socket, roomCode, gameState.playerId, gameState.secretCharacter, gameState.allCharacters.length, setSecretCharacter, setAllCharacters, setOpponentConnected, setGameStatus]);

  // Handle character click (toggle elimination)
  const handleCharacterClick = (characterId: string) => {
    // Allow eliminating any character, including your own secret character
    toggleCharacterElimination(characterId);
  };

  // Handle back to main menu
  const handleBackToMainMenu = () => {
    if (socket && roomCode && gameState.playerId) {
      socket.emit("leave_room", {
        roomCode,
        playerId: gameState.playerId,
      });
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4">
      <div className="mx-auto max-w-6xl">
        {/* Top Bar */}
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleBackToMainMenu}
            className="flex items-center text-cream-100 px-2 py-1 text-sm sm:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-4 w-4 sm:h-5 sm:w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-cream-100">Back</span>
          </button>

          <div className="bg-gray-800 rounded-lg py-1 px-3 inline-block">
            <span className="text-sm sm:text-base font-bold text-yellow-400">Room: </span>
            <span className="text-sm sm:text-base font-bold text-yellow-400">{roomCode}</span>
          </div>

          <button
            onClick={handleBackToMainMenu}
            className="rounded-lg border-2 border-red-500 bg-[#1C1817] px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base font-bold text-red-500 hover:bg-red-900 transition"
          >
            Home
          </button>
        </div>

        {/* Secret Character Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="mb-4 text-center text-base sm:text-lg font-bold text-cream-100">
            You are:
          </h2>
          {gameState.secretCharacter ? (
            <div className="flex justify-center">
              <div className="w-32 sm:w-40 border-4 rounded-lg overflow-hidden">
                <CharacterCard
                  character={gameState.secretCharacter}
                  isEliminated={false}
                  isSecret={true}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-32 sm:h-40 items-center justify-center bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm sm:text-base text-gray-400">Loading your character...</p>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {gameState.gameStatus === "disconnected" && (
          <div className="mb-4 sm:mb-6 rounded-lg bg-yellow-900 border border-yellow-500 p-2 sm:p-3 text-center text-xs sm:text-sm text-yellow-300">
            Opponent disconnected. Waiting for them to reconnect...
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 rounded-lg bg-red-900 border border-red-500 p-2 sm:p-3 text-center text-xs sm:text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Character Grid */}
        <div className="rounded-lg bg-gray-900 p-4 sm:p-6 border border-gray-800">
          {isLoading || characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-2"></div>
              <p className="text-gray-400">Loading characters...</p>
              {retryCount > 0 && (
                <p className="mt-2 text-xs text-gray-500">Retry attempt {retryCount}/5</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 xs:gap-3 sm:grid-cols-4 md:grid-cols-5">
              {characters.map((character) => (
                <div 
                  key={character.id} 
                  className={`relative rounded-lg overflow-hidden border-2`}
                >
                  <CharacterCard
                    character={character}
                    isEliminated={gameState.eliminatedCharacterIds.includes(character.id)}
                    onClick={() => handleCharacterClick(character.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
