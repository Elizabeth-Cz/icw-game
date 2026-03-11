"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame, Character } from "../../context/GameContext";
import CharacterCard from "../../components/CharacterCard";
import BackButton from "@/components/BackButton";
import { clearStoredGameSession, getStoredGameSession } from "@/lib/gameSessionStorage";
import { emitCloseRoom, emitRequestGameData } from "@/lib/gameSocket";

export default function GameBoard() {
  return (
    <Suspense fallback={null}>
      <GameBoardInner />
    </Suspense>
  );
}

function GameBoardInner() {
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
    setRoomCode,
    setPlayerId
  } = useGame();
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRoomClosedModal, setShowRoomClosedModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Characters are now loaded from the backend

  // Redirect if no room code
  useEffect(() => {
    if (!roomCode) {
      router.push("/");
    }
  }, [roomCode, router]);

  // Ensure we have room code and player ID from localStorage if not in game state
  useEffect(() => {
    const { roomCode: storedRoomCode, playerId: storedPlayerId } = getStoredGameSession();

    if (!roomCode && storedRoomCode) {
      console.log('Retrieved room code from localStorage:', storedRoomCode);
      setRoomCode(storedRoomCode);
    }
    
    if (!gameState.playerId && storedPlayerId) {
      console.log('Retrieved player ID from localStorage:', storedPlayerId);
      setPlayerId(storedPlayerId);
    }
  }, [roomCode, gameState.playerId, setRoomCode, setPlayerId]);
  
  // Retry mechanism for loading characters
  useEffect(() => {
    if (!socket || !roomCode || !gameState.playerId) return;

    const activeRoomCode = roomCode;
    const activePlayerId = gameState.playerId;
    
    // Log current state for debugging
    console.log('Retry mechanism active with state:', {
      roomCode: activeRoomCode,
      playerId: activePlayerId,
      isLoading,
      retryCount,
      hasCharacters: gameState.allCharacters.length > 0,
      hasSecretCharacter: !!gameState.secretCharacter
    });
    
    // Set up retry timer if we don't have characters yet
    const retryTimer = setTimeout(() => {
      if (isLoading && retryCount < 5) {
        console.log(`Retry attempt ${retryCount + 1} for loading characters`);
        setRetryCount(retryCount + 1);

        emitRequestGameData(socket, {
          roomCode: activeRoomCode,
          playerId: activePlayerId,
        });
      }
    }, 2000); // Retry every 2 seconds
    
    return () => clearTimeout(retryTimer);
  }, [socket, roomCode, gameState.playerId, isLoading, retryCount, gameState.allCharacters.length, gameState.secretCharacter]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handle secret character assignment
    const handleSecretCharacterAssigned = ({ character }: { character: Character }) => {
      console.log('Secret character received:', character);
      setSecretCharacter(character);
      
      // If we now have both secret character and all characters, we're done loading
      if (gameState.allCharacters.length > 0) {
        console.log('Both secret character and all characters loaded');
        setIsLoading(false);
      }
    };

    // Handle all characters received
    const handleAllCharactersReceived = ({ characters }: { characters: Character[] }) => {
      console.log('All characters received:', characters.length);
      setAllCharacters(characters);
      
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

    // Handle room closed by one of the players
    const handleRoomClosed = ({ closedByPlayerId }: { roomCode: string; closedByPlayerId: string; closedByName: string | null }) => {
      if (closedByPlayerId === gameState.playerId) {
        return;
      }

      setRedirectCountdown(5);
      setShowRoomClosedModal(true);
    };

    // Register event listeners
    socket.on("secret_character_assigned", handleSecretCharacterAssigned);
    socket.on("all_characters", handleAllCharactersReceived);
    socket.on("player_disconnected", handlePlayerDisconnected);
    socket.on("player_reconnected", handlePlayerReconnected);
    socket.on("room_error", handleError);
    socket.on("room_closed", handleRoomClosed);

    // Always request both secret character and all characters on mount
    if (roomCode && gameState.playerId) {
      console.log('Requesting game data with:', { roomCode, playerId: gameState.playerId });

      emitRequestGameData(socket, {
        roomCode,
        playerId: gameState.playerId,
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
      socket.off("room_closed", handleRoomClosed);
    };
  }, [socket, roomCode, gameState.playerId, gameState.secretCharacter, gameState.allCharacters.length, setSecretCharacter, setAllCharacters, setOpponentConnected, setGameStatus]);

  useEffect(() => {
    if (!showRoomClosedModal) return;

    if (redirectCountdown <= 0) {
      clearStoredGameSession();
      router.push("/");
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showRoomClosedModal, redirectCountdown, router]);

  // Handle character click (toggle elimination)
  const handleCharacterClick = (characterId: string) => {
    // Allow eliminating any character, including your own secret character
    toggleCharacterElimination(characterId);
  };

  // Handle back to main menu
  const handleBackToMainMenu = () => {
    setShowExitConfirm(true);
  };

  const redirectHome = () => {
    clearStoredGameSession();
    router.push("/");
  };

  const confirmExitAndCloseRoom = () => {
    if (socket && roomCode && gameState.playerId) {
      emitCloseRoom(socket, {
        roomCode,
        playerId: gameState.playerId,
      });
    }
    setShowExitConfirm(false);
    redirectHome();
  };

  const closeRoomClosedModalAndRedirect = () => {
    setShowRoomClosedModal(false);
    redirectHome();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4">
      <div className="mx-auto max-w-6xl">
        {/* Top Bar */}
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2 align-center">
          <BackButton
            onClick={handleBackToMainMenu}
            className="flex items-center text-cream-100 px-2 py-1 text-sm sm:text-base"
            iconClassName="mr-1 h-4 w-4 sm:h-5 sm:w-5"
            labelClassName="text-cream-100"
          />

          <div className="bg-gray-800 rounded-lg py-1 px-3 inline-block my-4" style={{ fontFamily: 'var(--font-jersey-25)', letterSpacing: '2px' }}>
            <span className="sm:text-base font-bold text-yellow-400">Room: </span>
            <span className="sm:text-base font-bold text-yellow-400">{roomCode}</span>
          </div>

          <button
            onClick={handleBackToMainMenu}
            className="btn btn-sm border-yellow-400 shadow-[2px_2px_#F7D54D] text-yellow-400"
          >
            Home
          </button>
        </div>

        {/* Secret Character Section */}
        <div className="mb-6 sm:mb-8">
          {gameState.secretCharacter ? (
            <div className="flex justify-center">
              <div className="w-32 sm:w-40 rounded-lg overflow-hidden">
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
          {isLoading || gameState.allCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-2"></div>
              <p className="text-gray-400">Loading characters...</p>
              {retryCount > 0 && (
                <p className="mt-2 text-xs text-gray-500">Retry attempt {retryCount}/5</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 xs:gap-3 sm:grid-cols-4 md:grid-cols-5">
              {gameState.allCharacters.map((character) => (
                <div 
                  key={character.id} 
                  className={`relative rounded-lg overflow-hidden`}
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

        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border-2 border-[#D34F34] bg-[#1C1817] p-6 text-center">
              <p className="mb-6 text-lg text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>
                Exiting this page will end the game for both players.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="rounded-xl border-2 border-[#0390A1] bg-[#1C1817] px-5 py-2 text-[#D8C8AE]"
                  style={{ boxShadow: '3px 4px #0390A1', fontFamily: 'var(--font-jersey-25)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExitAndCloseRoom}
                  className="rounded-xl border-2 border-[#D34F34] bg-[#1C1817] px-5 py-2 text-[#D8C8AE]"
                  style={{ boxShadow: '3px 4px #D34F34', fontFamily: 'var(--font-jersey-25)' }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {showRoomClosedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border-2 border-[#D34F34] bg-[#1C1817] p-6 text-center">
              <p className="mb-2 text-lg text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>
                The other player closed the room.
              </p>
              <p className="mb-6 text-sm text-[#D8C8AE]/80" style={{ fontFamily: 'var(--font-jersey-25)' }}>
                You are being redirected to the home page.
              </p>
              <button
                onClick={closeRoomClosedModalAndRedirect}
                className="rounded-xl border-2 border-[#D34F34] bg-[#1C1817] px-5 py-2 text-[#D8C8AE]"
                style={{ boxShadow: '3px 4px #D34F34', fontFamily: 'var(--font-jersey-25)' }}
              >
                OK ({redirectCountdown}s)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
