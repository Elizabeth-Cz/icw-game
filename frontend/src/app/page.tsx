"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../context/SocketContext";
import { useGame } from "../context/GameContext";

// Main menu component
export default function Home() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { gameState, setRoomCode, setPlayerId, setReconnectToken } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for reconnect token on mount
  useEffect(() => {
    const reconnectToken = localStorage.getItem("reconnectToken");
    if (reconnectToken && socket && connected) {
      setIsLoading(true);
      socket.emit("request_reconnect", { reconnectToken });
    }
  }, [socket, connected]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handle room creation response
    const handleRoomCreated = ({ roomCode, playerId, reconnectToken }: any) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setReconnectToken(reconnectToken);
      setIsLoading(false);
      router.push(`/create-game?roomCode=${roomCode}`);
    };

    // Handle reconnection success
    const handleReconnectSuccess = ({ roomCode, playerId }: any) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setIsLoading(false);
      router.push(`/game?roomCode=${roomCode}`);
    };

    // Handle errors
    const handleError = ({ message }: { message: string }) => {
      setError(message);
      setIsLoading(false);
    };

    // Register event listeners
    socket.on("room_created", handleRoomCreated);
    socket.on("reconnect_success", handleReconnectSuccess);
    socket.on("room_error", handleError);

    // Clean up event listeners
    return () => {
      socket.off("room_created", handleRoomCreated);
      socket.off("reconnect_success", handleReconnectSuccess);
      socket.off("room_error", handleError);
    };
  }, [socket, router, setRoomCode, setPlayerId, setReconnectToken]);

  // Handle create game button click
  const handleCreateGame = () => {
    if (!socket || !connected) {
      setError("Socket connection not established. Please try again.");
      return;
    }

    // Clear all game state from localStorage when creating a new game
    localStorage.removeItem("reconnectToken");
    localStorage.removeItem("roomCode");
    localStorage.removeItem("playerId");
    
    setIsLoading(true);
    setError(null);
    socket.emit("create_room");
  };

  // Handle join game button click
  const handleJoinGame = () => {
    // Clear all game state from localStorage when joining a new game
    localStorage.removeItem("reconnectToken");
    localStorage.removeItem("roomCode");
    localStorage.removeItem("playerId");
    router.push("/join-game");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <main className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-blue-800">Guess Who</h1>
          <h2 className="text-xl font-medium text-blue-600">ICW Edition</h2>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleCreateGame}
            disabled={isLoading || !connected}
            className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Creating Game..." : "Create New Game"}
          </button>

          <button
            onClick={handleJoinGame}
            disabled={isLoading || !connected}
            className="rounded-lg bg-blue-100 px-4 py-3 font-medium text-blue-800 transition hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500"
          >
            Join Game
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!connected && (
          <div className="mt-4 rounded-md bg-yellow-50 p-3 text-center text-sm text-yellow-700">
            Connecting to server...
          </div>
        )}
      </main>
    </div>
  );
}
