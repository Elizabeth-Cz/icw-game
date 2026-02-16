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
    resetEliminations
  } = useGame();
  
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Generate dummy characters for initial render
  useEffect(() => {
    // Generate 24 dummy characters for the grid layout
    const dummyCharacters = Array.from({ length: 24 }, (_, i) => ({
      id: `dummy-${i}`,
      name: `Character ${i + 1}`,
      avatarUrl: `https://api.dicebear.com/9.x/toon-head/svg?seed=${i}`,
    }));
    setCharacters(dummyCharacters);
  }, []);

  // Redirect if no room code
  useEffect(() => {
    if (!roomCode) {
      router.push("/");
    }
  }, [roomCode, router]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handle secret character assignment
    const handleSecretCharacterAssigned = ({ character }: { character: Character }) => {
      console.log('Secret character received:', character);
      setSecretCharacter(character);
      
      // Fetch all characters if we don't have them yet
      if (gameState.allCharacters.length === 0 && roomCode && gameState.playerId) {
        console.log('Requesting all characters with room and player info');
        socket.emit("get_all_characters", {
          roomCode,
          playerId: gameState.playerId
        });
      }
    };

    // Handle all characters received
    const handleAllCharactersReceived = ({ characters }: { characters: Character[] }) => {
      setAllCharacters(characters);
      setCharacters(characters);
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

    // Request secret character if we don't have it
    if (!gameState.secretCharacter && roomCode && gameState.playerId) {
      console.log('Requesting secret character with:', { roomCode, playerId: gameState.playerId });
      socket.emit("request_secret_character", {
        roomCode,
        playerId: gameState.playerId,
      });
    } else {
      console.log('Current game state:', { 
        secretCharacter: gameState.secretCharacter,
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

  // Handle play again
  const handlePlayAgain = () => {
    if (!socket || !roomCode || !gameState.playerId) {
      setError("Connection error. Please try again.");
      return;
    }

    socket.emit("play_again", {
      roomCode,
      playerId: gameState.playerId,
    });
    
    resetEliminations();
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-2 sm:p-4">
      <div className="mx-auto max-w-6xl">
        {/* Top Bar */}
        <div className="mb-2 sm:mb-4 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleBackToMainMenu}
            className="flex items-center rounded-lg bg-white px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-blue-600 shadow hover:bg-blue-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-3 w-3 sm:h-4 sm:w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sm:inline">Back</span>
          </button>

          <div className="text-center">
            <span className="text-xs sm:text-sm font-medium text-gray-600">Room:</span>
            <span className="ml-1 text-xs sm:text-sm font-bold text-blue-800">{roomCode}</span>
          </div>

          <button
            onClick={handlePlayAgain}
            className="rounded-lg bg-blue-600 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700"
          >
            Play Again
          </button>
        </div>

        {/* Secret Character Section */}
        <div className="mb-3 sm:mb-6 rounded-lg bg-white p-2 sm:p-4 shadow-md">
          <h2 className="mb-2 sm:mb-3 text-center text-base sm:text-lg font-semibold text-blue-800">
            You are:
          </h2>
          {gameState.secretCharacter ? (
            <div className="flex justify-center">
              <div className="w-24 sm:w-32">
                <CharacterCard
                  character={gameState.secretCharacter}
                  isEliminated={false}
                  isSecret={true}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-24 sm:h-32 items-center justify-center">
              <p className="text-sm sm:text-base text-gray-500">Loading your character...</p>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {gameState.gameStatus === "disconnected" && (
          <div className="mb-2 sm:mb-4 rounded-lg bg-yellow-50 p-2 sm:p-3 text-center text-xs sm:text-sm text-yellow-700">
            Opponent disconnected. Waiting for them to reconnect...
          </div>
        )}

        {error && (
          <div className="mb-2 sm:mb-4 rounded-lg bg-red-50 p-2 sm:p-3 text-center text-xs sm:text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Character Grid */}
        <div className="rounded-lg bg-white p-2 sm:p-4 shadow-md">
          <h2 className="mb-2 sm:mb-4 text-center text-lg font-semibold text-blue-800">
            Characters
          </h2>
          <div className="grid grid-cols-3 gap-1 xs:gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isEliminated={gameState.eliminatedCharacterIds.includes(character.id)}
                onClick={() => handleCharacterClick(character.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
