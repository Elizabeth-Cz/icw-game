"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";
import { characterData } from "../../data/characterData";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";


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
      
      // Store the data in context
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setReconnectToken(reconnectToken);
      
      // Store the data in localStorage for persistence
      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("playerId", playerId);
      localStorage.setItem("reconnectToken", reconnectToken);
      
      setIsLoading(false);
      
      // Submit name immediately
      setPlayerName(name);
      socket.emit("submit_name", {
        roomCode,
        playerId,
        name,
      });
      
      // Navigate to character assignment page
      router.push(`/character-assignment?roomCode=${roomCode}`);
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

    // Validate room code (4 digits)
    if (!/^\d{4}$/.test(roomCodeInput)) {
      setError("Please enter a valid 4-digit room code.");
      return;
    }

    // Validate name
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Clear any existing game state to prevent conflicts
    localStorage.removeItem("reconnectToken");
    localStorage.removeItem("roomCode");
    localStorage.removeItem("playerId");

    console.log('Attempting to join room:', roomCodeInput);
    
    // Add a small delay to ensure socket is fully connected
    setTimeout(() => {
      // Join room with room code
      socket.emit("join_room", { roomCode: roomCodeInput });
    }, 100);
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
              Enter the 4 digit code
            </label>
            <input
              type="number"
              id="roomCode"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="rounded-xl w-48 border-2 border-[#0390A1] bg-[#1C1817] h-20 font-bold text-xl text-center"
              style={{ boxShadow: '5px 7px #0390A1' }}              maxLength={4}
              required
            />
          </div>

          <div className="flex flex-col items-center text-xl gap-4">
            <label className="">
              Your name
            </label>
            <Listbox value={name} onChange={setName}>
              <div className="relative w-48">
                <ListboxButton className="rounded-xl w-full border-2 border-[#0390A1] bg-[#1C1817] px-6 py-4 font-bold text-xl text-[#D8C8AE] text-left flex justify-between items-center"
                  style={{ 
                    boxShadow: '5px 7px #0390A1',
                    fontFamily: 'var(--font-jersey-25)'
                  }}
                >
                  <span>{name || "Choose a name"}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </ListboxButton>
                <ListboxOptions className="absolute z-10 w-full mt-1 bg-[#1C1817] border-2 border-[#0390A1] rounded-xl shadow-lg max-h-60 overflow-auto"
                  style={{ fontFamily: 'var(--font-jersey-25)' }}
                >
                  {Object.keys(characterData).map((characterName) => (
                    <ListboxOption
                      key={characterName}
                      value={characterName}
                      className={({ active }) =>
                        `px-6 py-3 cursor-pointer text-[#D8C8AE] ${
                          active ? 'bg-[#0390A1] text-[#1C1817]' : ''
                        } ${name === characterName ? 'bg-[#0390A1] text-[#1C1817]' : ''}`
                      }
                    >
                      {characterName}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          </div>

          <button
            type="submit"
            disabled={isLoading || !connected || roomCodeInput.length !== 4 || !name.trim()}
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