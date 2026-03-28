"use client";

import { useEffect, useEffectEvent, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame, Character } from "../../context/GameContext";
import CharacterCard from "@/components/CharacterCard";
import BackButton from "@/components/BackButton";

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
  const requestedSecretRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      router.push("/");
    }
  }, [roomCode, router]);

  useEffect(() => {
    requestedSecretRef.current = null;
    setRetryCount(0);
    setIsLoading(!gameState.secretCharacter);
  }, [roomCode, gameState.playerId]);

  const handleSecretCharacterAssigned = useEffectEvent(({ character }: { character: Character }) => {
    setSecretCharacter(character);
    setIsLoading(false);
  });

  const handleError = useEffectEvent(({ message }: { message: string }) => {
    setError(message);
  });

  useEffect(() => {
    if (!socket) return;

    socket.on("secret_character_assigned", handleSecretCharacterAssigned);
    socket.on("room_error", handleError);

    return () => {
      socket.off("secret_character_assigned", handleSecretCharacterAssigned);
      socket.off("room_error", handleError);
    };
  }, [socket]);

  useEffect(() => {
    if (gameState.secretCharacter) {
      setIsLoading(false);
      return;
    }

    if (!socket || !roomCode || !gameState.playerId) return;

    const requestKey = `${roomCode}:${gameState.playerId}`;
    if (requestedSecretRef.current === requestKey) {
      return;
    }

    requestedSecretRef.current = requestKey;
    socket.emit("request_secret_character", {
      roomCode,
      playerId: gameState.playerId,
    });
  }, [socket, roomCode, gameState.playerId, gameState.secretCharacter]);

  useEffect(() => {
    if (!socket || !roomCode || !gameState.playerId || !isLoading) return;

    const retryTimer = setTimeout(() => {
      if (isLoading && retryCount < 5 && !gameState.secretCharacter) {
        setRetryCount(previous => previous + 1);
        socket.emit("request_secret_character", {
          roomCode,
          playerId: gameState.playerId,
        });
      }
    }, 2000);

    return () => clearTimeout(retryTimer);
  }, [socket, roomCode, gameState.playerId, gameState.secretCharacter, isLoading, retryCount]);

  const handleContinue = () => {
    router.push(`/game?roomCode=${roomCode}`);
  };

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
              <CharacterCard character={gameState.secretCharacter} isEliminated={false} />
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
