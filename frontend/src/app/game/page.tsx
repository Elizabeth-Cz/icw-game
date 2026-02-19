"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame, Character } from "../../context/GameContext";
import CharacterCard from "../../components/CharacterCard";
import PlayAgainModal from "../../components/PlayAgainModal";

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
  const [isPlayAgainModalOpen, setIsPlayAgainModalOpen] = useState<boolean>(false);

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

  // Handle play again button click - opens the modal
  const handlePlayAgain = () => {
    if (!socket || !roomCode || !gameState.playerId) {
      setError("Connection error. Please try again.");
      return;
    }
    
    // Open the modal instead of immediately restarting
    setIsPlayAgainModalOpen(true);
  };
  
  // Handle rematch option (same room, new characters)
  const handleRematch = () => {
    if (!socket || !roomCode || !gameState.playerId) {
      setError("Connection error. Please try again.");
      return;
    }

    socket.emit("play_again", {
      roomCode,
      playerId: gameState.playerId,
    });
    
    resetEliminations();
    setIsPlayAgainModalOpen(false);
  };
  
  // Handle new game option
  const handleNewGame = () => {
    // Clear all game state from localStorage
    localStorage.removeItem("reconnectToken");
    localStorage.removeItem("roomCode");
    localStorage.removeItem("playerId");
    
    // Redirect to home page
    router.push("/");
  };
  
  // Handle join game option
  const handleJoinGame = () => {
    // Clear all game state from localStorage
    localStorage.removeItem("reconnectToken");
    localStorage.removeItem("roomCode");
    localStorage.removeItem("playerId");
    
    // Redirect to join game page
    router.push("/join-game");
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
      {/* Play Again Modal */}
      <PlayAgainModal
        isOpen={isPlayAgainModalOpen}
        onClose={() => setIsPlayAgainModalOpen(false)}
        onRematch={handleRematch}
        onNewGame={handleNewGame}
        onJoinGame={handleJoinGame}
      />
      
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
            onClick={handlePlayAgain}
            className="rounded-lg border-2 border-red-500 bg-black px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base font-bold text-red-500 hover:bg-red-900 transition"
          >
            Play Again
          </button>
        </div>

        {/* Secret Character Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="mb-4 text-center text-base sm:text-lg font-bold text-cream-100">
            You are:
          </h2>
          {gameState.secretCharacter ? (
            <div className="flex justify-center">
              <div className="w-32 sm:w-40 border-4 border-blue-600 rounded-lg overflow-hidden">
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
          <div className="grid grid-cols-4 gap-2 xs:gap-3 sm:grid-cols-4 md:grid-cols-5">
            {characters.map((character) => (
              <div 
                key={character.id} 
                className={`relative rounded-lg overflow-hidden border-2 ${gameState.eliminatedCharacterIds.includes(character.id) ? 'border-gray-700 opacity-60' : 'border-blue-500'}`}
              >
                <CharacterCard
                  character={character}
                  isEliminated={gameState.eliminatedCharacterIds.includes(character.id)}
                  onClick={() => handleCharacterClick(character.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
