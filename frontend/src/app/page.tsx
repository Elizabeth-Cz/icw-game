"use client";

import React, { useState, useEffect } from 'react';
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
    // Clear error on mount to prevent showing old errors
    setError(null);
    
    // Always clear any invalid reconnect tokens on page load
    const clearInvalidTokenTimeout = setTimeout(() => {
      if (error && error.includes("Invalid reconnect token")) {
        // If we got an invalid token error, clear all stored tokens
        localStorage.removeItem("reconnectToken");
        localStorage.removeItem("roomCode");
        localStorage.removeItem("playerId");
        setError(null);
      }
    }, 1000);
    
    // Only attempt reconnection if we're not coming from a "New Game" or "Join Game" action
    const freshStart = sessionStorage.getItem("freshStart");
    if (freshStart === "true") {
      // Clear the flag
      sessionStorage.removeItem("freshStart");
      return () => clearTimeout(clearInvalidTokenTimeout);
    }
    
    // Check if we have a valid token before attempting reconnection
    const reconnectToken = localStorage.getItem("reconnectToken");
    const roomCode = localStorage.getItem("roomCode");
    const playerId = localStorage.getItem("playerId");
    
    // Only attempt reconnection if we have ALL required pieces of information
    if (reconnectToken && roomCode && playerId && socket && connected) {
      console.log('Attempting reconnection with stored token');
      setIsLoading(true);
      socket.emit("request_reconnect", { reconnectToken });
    } else if (reconnectToken && (!roomCode || !playerId)) {
      // If we have a token but missing other required data, clear everything
      console.log('Found incomplete game data, clearing storage');
      localStorage.removeItem("reconnectToken");
      localStorage.removeItem("roomCode");
      localStorage.removeItem("playerId");
    }
    
    return () => clearTimeout(clearInvalidTokenTimeout);
  }, [socket, connected, error]);

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
      
      // If we get an invalid reconnect token error, clear the token from localStorage
      if (message && message.includes('Invalid reconnect token')) {
        console.log('Clearing invalid reconnect token');
        localStorage.removeItem('reconnectToken');
        localStorage.removeItem('roomCode');
        localStorage.removeItem('playerId');
      }
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
    
    // Set a flag to indicate this is a fresh start
    // This prevents reconnection attempts on page refresh
    sessionStorage.setItem("freshStart", "true");
    
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
    
    // Set a flag to indicate this is a fresh start
    // This prevents reconnection attempts on page refresh
    sessionStorage.setItem("freshStart", "true");
    
    router.push("/join-game");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <main className="w-full max-w-md relative">
        {/* Colorful border with character avatars */}
        <div className="absolute inset-0 -m-4 p-4 grid grid-cols-6 gap-0 overflow-hidden">
          {/* Top row */}
          <div className="bg-emerald-600"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-yellow-500"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-red-500"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-pink-400"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-blue-600"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-teal-500"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          
          {/* Left and right columns */}
          {Array.from({ length: 10 }).map((_, i) => (
            <React.Fragment key={`row-${i}`}>
              <div className={`bg-${['emerald-600', 'yellow-500', 'red-500', 'pink-400', 'blue-600'][i % 5]}`}>
                <div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div>
              </div>
              <div className="col-span-4"></div>
              <div className={`bg-${['teal-500', 'yellow-500', 'red-500', 'pink-400', 'emerald-600'][i % 5]}`}>
                <div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div>
              </div>
            </React.Fragment>
          ))}
          
          {/* Bottom row */}
          <div className="bg-teal-500"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-yellow-500"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-red-500"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-pink-400"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-blue-600"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
          <div className="bg-emerald-600"><div className="rounded-full overflow-hidden bg-yellow-400 m-1"></div></div>
        </div>
        
        {/* Main content */}
        <div className="relative z-10 rounded-xl bg-black p-8 border-4 border-cream-100">
          <div className="mb-8 text-center">
            <div className="mb-4 bg-black rounded-lg p-4 border-2 border-cream-100">
              <h1 className="text-5xl font-bold text-red-500 drop-shadow-[0_2px_2px_rgba(255,255,255,0.3)]" style={{ fontFamily: 'fantasy, cursive' }}>Guess Who</h1>
            </div>
            <div className="bg-gray-800 rounded-lg py-2 px-4 inline-block">
              <h2 className="text-xl font-bold text-yellow-400">• ICW Edition •</h2>
            </div>
          </div>

          <div className="flex flex-col gap-6 mt-12">
            <button
              onClick={handleCreateGame}
              disabled={isLoading || !connected}
              className="rounded-lg border-2 border-teal-400 bg-black px-4 py-3 font-bold text-teal-400 transition hover:bg-teal-900 disabled:opacity-50"
            >
              {isLoading ? "Creating Game..." : "New Game"}
            </button>

            <button
              onClick={handleJoinGame}
              disabled={isLoading || !connected}
              className="rounded-lg border-2 border-red-500 bg-black px-4 py-3 font-bold text-red-500 transition hover:bg-red-900 disabled:opacity-50"
            >
              Join Game
            </button>
          </div>
          
          {/* ServiceNow logo */}
          <div className="mt-12 text-center">
            <p className="text-white text-lg font-bold">servicenow.</p>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-900 border border-red-500 p-3 text-center text-sm text-red-300">
              {error}
            </div>
          )}

          {!connected && (
            <div className="mt-4 rounded-md bg-yellow-900 border border-yellow-500 p-3 text-center text-sm text-yellow-300">
              Connecting to server...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
