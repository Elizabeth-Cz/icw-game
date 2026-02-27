"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";
import BackButton from "@/components/BackButton";

export default function EnterName() {
  return (
    <Suspense fallback={null}>
      <EnterNameInner />
    </Suspense>
  );
}

function EnterNameInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("roomCode");
  const { socket } = useSocket();
  const { gameState, setPlayerName } = useGame();
  
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    const handleSecretCharacterAssigned = () => {
      router.push(`/game?roomCode=${roomCode}`);
    };

    // Handle errors
    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    // Register event listeners
    socket.on("secret_character_assigned", handleSecretCharacterAssigned);
    socket.on("room_error", handleError);

    // Clean up event listeners
    return () => {
      socket.off("secret_character_assigned", handleSecretCharacterAssigned);
      socket.off("room_error", handleError);
    };
  }, [socket, roomCode, router]);

  // Handle name submission
  const handleSubmitName = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socket || !roomCode || !gameState.playerId) {
      setError("Connection error. Please try again.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setPlayerName(name);
    socket.emit("submit_name", {
      roomCode,
      playerId: gameState.playerId,
      name,
    });
  };

  // Handle back button
  const handleBack = () => {
    if (socket && roomCode && gameState.playerId) {
      socket.emit("leave_room", {
        roomCode,
        playerId: gameState.playerId,
      });
    }
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <main className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <BackButton
          onClick={handleBack}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          iconClassName="mr-1 h-5 w-5"
          labelClassName=""
        />

        <div className="mb-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-blue-800">Enter Your Name</h1>
          <p className="text-sm text-gray-600">
            You've successfully joined room <span className="font-medium">{roomCode}</span>
          </p>
        </div>

        <form onSubmit={handleSubmitName} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              maxLength={20}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
          >
            Continue
          </button>

          {error && (
            <div className="mt-2 rounded-md bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
