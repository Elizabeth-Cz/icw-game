"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";

export default function JoinGame() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { setRoomCode, setPlayerId, setReconnectToken, setPlayerName } = useGame();

  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handle room join response
    const handleRoomJoined = ({ roomCode, playerId, reconnectToken }: any) => {
      console.log('Room joined:', { roomCode, playerId });

      // Store the data
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setReconnectToken(reconnectToken);
      setIsLoading(false);

      // Submit name immediately
      setPlayerName(name);
      socket.emit("submit_name", {
        roomCode,
        playerId,
        name,
      });

      // Navigate to game
      router.push(`/game?roomCode=${roomCode}`);
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
  }, [socket, router, name, setRoomCode, setPlayerId, setReconnectToken, setPlayerName]);

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

    // Validate name
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Join room with room code
    socket.emit("join_room", { roomCode: roomCodeInput });
  };

  // Handle back button
  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="p-12 bg-[#1C1817] text-[#D8C8AE] h-screen text-center">
        <button
          onClick={handleBack}
          className="mr-auto flex"
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
      <main className="h-full flex flex-col items-center p-8 gap-6">
        <div className="bg-gray-800 rounded-lg py-2 px-6 inline-block w-64">
          <h1 className="text-4xl font-bold text-[#EAC006]" style={{ fontFamily: 'var(--font-jersey-10)' }}>• Join Game •</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full justify-evenly gap-10" style={{ fontFamily: 'var(--font-jersey-25)' }}>
          <div className="flex flex-col items-center text-xl gap-4">
            <label htmlFor="roomCode" className="">
              Enter the 6 digit code
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="rounded-xl w-48 border-2 border-[#0390A1] bg-[#1C1817] h-20 font-bold text-xl text-center"
              style={{ boxShadow: '5px 7px #0390A1' }}              maxLength={6}
              required
            />
          </div>

          <div className="flex flex-col items-center text-xl gap-4">
            <label htmlFor="name" className="">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl w-48 border-2 border-[#0390A1] bg-[#1C1817] h-20 font-bold text-xl text-center"
              style={{ boxShadow: '5px 7px #0390A1' }}                 maxLength={20}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !connected || roomCodeInput.length !== 6 || !name.trim()}
                          className="w-full rounded-xl w-48 border-2 border-[#D34F34] bg-[#1C1817] h-20 font-bold text-xl"
              style={{ boxShadow: '5px 7px #D34F34' }}
          >
            {isLoading ? "Joining..." : "Continue"}
          </button>

          {error && (
            <div className="">
              {error}
            </div>
          )}

          {!connected && (
            <div className="">
              Connecting to server...
            </div>
          )}
        </form>
      </main>
    </div>
  );
}