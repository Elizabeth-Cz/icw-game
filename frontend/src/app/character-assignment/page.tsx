"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame, Character } from "../../context/GameContext";
import { characterData } from "../../data/characterData";
import CharacterCard from "@/components/CharacterCard";
import BackButton from "@/components/BackButton";
import { emitRequestSecretCharacter } from "@/lib/gameSocket";

export default function CharacterAssignment() {
  return (
    <Suspense fallback={null}>
      <CharacterAssignmentInner />
    </Suspense>
  );
}

function CharacterAssignmentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("roomCode");
  const { socket } = useSocket();
  const { gameState, setSecretCharacter } = useGame();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
      console.log('Secret character received in assignment page:', character);
      setSecretCharacter(character);
      setIsLoading(false);
    };

    // Handle errors
    const handleError = ({ message }: { message: string }) => {
      console.error('Error in character assignment:', message);
      setError(message);
    };

    // Register event listeners
    socket.on("secret_character_assigned", handleSecretCharacterAssigned);
    socket.on("room_error", handleError);

    // Always request secret character for the current room/player.
    // This avoids showing a stale character kept in client state from a previous game.
    if (roomCode && gameState.playerId) {
      console.log('Requesting secret character from assignment page:', { roomCode, playerId: gameState.playerId });
      emitRequestSecretCharacter(socket, {
        roomCode,
        playerId: gameState.playerId,
      });
    }

    // Clean up event listeners
    return () => {
      socket.off("secret_character_assigned", handleSecretCharacterAssigned);
      socket.off("room_error", handleError);
    };
  }, [socket, roomCode, gameState.playerId, setSecretCharacter]);

  // Retry mechanism for loading character
  useEffect(() => {
    if (!socket || !roomCode || !gameState.playerId || !isLoading) return;

    const activeRoomCode = roomCode;
    const activePlayerId = gameState.playerId;

    const retryTimer = setTimeout(() => {
      if (isLoading && retryCount < 5 && !gameState.secretCharacter) {
        console.log(`Retry attempt ${retryCount + 1} for loading character`);
        setRetryCount(retryCount + 1);

        emitRequestSecretCharacter(socket, {
          roomCode: activeRoomCode,
          playerId: activePlayerId,
        });
      }
    }, 2000); // Retry every 2 seconds

    return () => clearTimeout(retryTimer);
  }, [socket, roomCode, gameState.playerId, gameState.secretCharacter, isLoading, retryCount]);

  // Handle continue button click
  const handleContinue = () => {
    router.push(`/game?roomCode=${roomCode}`);
  };

  // Handle back button
  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="p-6 bg-[#1C1817] text-[#D8C8AE] h-screen text-center">
      <BackButton
        onClick={handleBack}
        
        iconClassName="mr-1 h-5 w-5"
      />
      <main className="h-full flex flex-col items-center p-8 justify-between">
        <div className="bg-gray-800 rounded-lg py-1 px-3 inline-block my-4" style={{ fontFamily: 'var(--font-jersey-25)', letterSpacing: '2px' }}>
          <span className="sm:text-base font-bold text-yellow-400">Room: </span>
          <span className="sm:text-base font-bold text-yellow-400">{roomCode}</span>
        </div>

        <div className="bg-gray-800 rounded-lg py-2 px-6 inline-block w-64">
          <h1 className="text-4xl font-bold text-[#EAC006]" style={{ fontFamily: 'var(--font-jersey-10)' }}>• Your Character •</h1>
        </div>

        <div className="flex flex-col items-center gap-6"> 
          <p className="text-lg text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>
            This is your secret character. Your opponent will try to guess who it is!
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0390A1]"></div>
              <p className="text-[#D8C8AE]">Waiting for your opponent to join...</p>
            </div>
          ) : gameState.secretCharacter ? (
            <div className="w-72 flex justify-center items-center">
              {gameState.secretCharacter.name && characterData[gameState.secretCharacter.name] && (
                <CharacterCard character={gameState.secretCharacter} isEliminated={false} />
              )}
            </div>
          ) : (
            <div className="text-red-500">
              Failed to load character. Please try again.
            </div>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={isLoading || !gameState.secretCharacter}
          className="rounded-xl w-48 border-2 border-[#D34F34] bg-[#1C1817] h-20 font-bold text-xl mt-auto"
          style={{ boxShadow: '5px 7px #D34F34', fontFamily: 'var(--font-jersey-25)' }}
        >
          {isLoading ? "Loading..." : "Continue to Game"}
        </button>

        {error && (
          <div className="text-[#D34F34] text-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
