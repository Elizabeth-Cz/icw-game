"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";

export default function CreateGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("roomCode");
  const { socket } = useSocket();
  const { gameState, setPlayerName } = useGame();
  
  const [name, setName] = useState("");
  const [isWaiting, setIsWaiting] = useState(true);
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

    // Handle when both players have joined
    const handleBothPlayersJoined = () => {
      setIsWaiting(false);
    };

    // Handle errors
    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    // Register event listeners
    socket.on("both_players_joined", handleBothPlayersJoined);
    socket.on("room_error", handleError);

    // Clean up event listeners
    return () => {
      socket.off("both_players_joined", handleBothPlayersJoined);
      socket.off("room_error", handleError);
    };
  }, [socket]);

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

    // If opponent has already joined, go to game
    if (!isWaiting) {
      router.push(`/game?roomCode=${roomCode}`);
    }
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
        <button
          onClick={handleBack}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        <div className="mb-8 text-center">
          <h1 className="mb-6 text-2xl font-bold text-blue-800">Create Game</h1>
          
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <p className="mb-2 text-sm text-blue-600">Share this code with your opponent</p>
            <p className="text-3xl font-bold text-blue-800">{roomCode}</p>
          </div>

          {isWaiting ? (
            <p className="text-sm text-gray-600">Waiting for opponent to join...</p>
          ) : (
            <p className="text-sm font-medium text-green-600">Opponent joined! Enter your name to continue.</p>
          )}
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
            disabled={!name.trim() || (isWaiting && !gameState.playerName)}
            className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isWaiting && !gameState.playerName
              ? "Waiting for opponent..."
              : "Continue"}
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
