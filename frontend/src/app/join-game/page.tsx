"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";

export default function JoinGame() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { setRoomCode, setPlayerId, setReconnectToken } = useGame();
  
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handle room join response
    const handleRoomJoined = ({ roomCode, playerId, reconnectToken }: any) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setReconnectToken(reconnectToken);
      setIsLoading(false);
      router.push(`/enter-name?roomCode=${roomCode}`);
    };

    // Handle errors
    const handleError = ({ message }: { message: string }) => {
      setError(message);
      setIsLoading(false);
    };

    // Register event listeners
    socket.on("room_joined", handleRoomJoined);
    socket.on("room_error", handleError);

    // Clean up event listeners
    return () => {
      socket.off("room_joined", handleRoomJoined);
      socket.off("room_error", handleError);
    };
  }, [socket, router, setRoomCode, setPlayerId, setReconnectToken]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socket || !connected) {
      setError("Socket connection not established. Please try again.");
      return;
    }

    // Validate room code (6 digits)
    if (!/^\d{6}$/.test(roomCodeInput)) {
      setError("Please enter a valid 6-digit room code.");
      return;
    }

    setIsLoading(true);
    setError(null);
    socket.emit("join_room", { roomCode: roomCodeInput });
  };

  // Handle back button
  const handleBack = () => {
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
          <h1 className="mb-4 text-2xl font-bold text-blue-800">Join Game</h1>
          <p className="text-sm text-gray-600">
            Enter the 6-digit code provided by your opponent
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="roomCode" className="mb-1 block text-sm font-medium text-gray-700">
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-2xl tracking-wider focus:border-blue-500 focus:outline-none"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !connected || roomCodeInput.length !== 6}
            className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Joining..." : "Join Game"}
          </button>

          {error && (
            <div className="mt-2 rounded-md bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {!connected && (
            <div className="mt-2 rounded-md bg-yellow-50 p-3 text-center text-sm text-yellow-700">
              Connecting to server...
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
