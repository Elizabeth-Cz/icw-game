"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSocket } from "../context/SocketContext";
import { useGame } from "../context/GameContext";
import { getCharacterImagesArray, teamBgClass, teamComplementaryColors } from "../data/characterData";
import Logo from '@/components/Logo';

// Get character images array from shared data
const characterImages = getCharacterImagesArray();

const FRAME_CELL_COUNT = 60;
const FRAME_SLOT_COUNT = 24;
const FRAME_POSITIONS = Array.from({ length: FRAME_CELL_COUNT }, (_, index) => {
  const row = Math.floor(index / 6);
  const col = index % 6;
  const cellNumber = index + 1;
  const isFrame =
    cellNumber <= 6 ||
    cellNumber >= 55 ||
    (col === 0 && row >= 1) ||
    (col === 5 && row >= 1);

  let framePosition = -1;

  if (cellNumber <= 6) {
    framePosition = cellNumber - 1;
  } else if (col === 5 && row >= 1 && row <= 8) {
    framePosition = 6 + (row - 1);
  } else if (cellNumber >= 55) {
    framePosition = 14 + (5 - col);
  } else if (col === 0 && row >= 1 && row <= 8) {
    framePosition = 20 + (8 - row);
  }

  return {
    index,
    isFrame,
    framePosition,
  };
});

const FRAME_SLOTS = FRAME_POSITIONS
  .filter(position => position.isFrame && position.framePosition !== -1)
  .sort((left, right) => left.framePosition - right.framePosition)
  .map(position => ({
    framePosition: position.framePosition,
    column: (position.index % 6) + 1,
    row: Math.floor(position.index / 6) + 1,
  }));

const getFrameBackgrounds = (rotationOffset: number) =>
  FRAME_SLOTS.map(slot => {
    const character = characterImages[(slot.framePosition + rotationOffset) % characterImages.length];
    const complementaryColors = teamComplementaryColors[character.team];
    return complementaryColors[slot.framePosition % complementaryColors.length];
  });

// Main menu component
export default function Home() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { gameState, setRoomCode, setPlayerId, setReconnectToken } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotationOffset, setRotationOffset] = useState(0); // Track the current rotation position
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true); // Toggle for animation
  const [isMouseDown, setIsMouseDown] = useState(false); // Track if mouse is being held down
  const [frameBackgrounds, setFrameBackgrounds] = useState<string[]>(() => getFrameBackgrounds(0));

  // Expose animation toggle to window object for programmatic control
  useEffect(() => {
    // Add the toggle functions to window for programmatic access
    // @ts-ignore - Adding custom property to window
    window.toggleAnimation = (enabled: boolean | undefined) => {
      if (typeof enabled === 'undefined') {
        // Toggle current state if no value provided
        setIsAnimationEnabled(prev => !prev);
        // @ts-ignore
        console.log(`Animation ${!isAnimationEnabled ? 'enabled' : 'disabled'}`);
      } else {
        // Set to specific state
        setIsAnimationEnabled(enabled);
        console.log(`Animation ${enabled ? 'enabled' : 'disabled'}`);
      }
    };
    
    // @ts-ignore - Adding custom property to window
    window.getAnimationState = () => {
      console.log(`Animation is currently ${isAnimationEnabled ? 'enabled' : 'disabled'}`);
      return isAnimationEnabled;
    };
    
    return () => {
      // Clean up when component unmounts
      // @ts-ignore
      delete window.toggleAnimation;
      // @ts-ignore
      delete window.getAnimationState;
    };
  }, [isAnimationEnabled]);

  useEffect(() => {
    // Add event listeners for mouse events
    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);
    
    // Add touch events for mobile devices
    const handleTouchStart = () => setIsMouseDown(true);
    const handleTouchEnd = () => setIsMouseDown(false);
    
    // Add the event listeners to the document
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    // Also handle mouse leaving the window
    document.addEventListener('mouseleave', handleMouseUp);
    
    // Clean up function to remove event listeners
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  // Check for reconnect token on mount
  useEffect(() => {
    // Clear error on mount to prevent showing old errors
    const persistedError = sessionStorage.getItem("gameError");
    if (persistedError) {
      setError(persistedError);
      sessionStorage.removeItem("gameError");
    } else {
      setError(null);
    }

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

    // Check if user wants to stay on home page (no auto-reconnect)
    const stayOnHome = sessionStorage.getItem("stayOnHome");
    if (stayOnHome === "true") {
      return () => clearTimeout(clearInvalidTokenTimeout);
    }

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

  // Animation effect for rotating frame elements with their background colors
  useEffect(() => {
    // Only set up the interval if animation is enabled AND mouse is not being held down
    if (!isAnimationEnabled || isMouseDown) return;
    
    const animationInterval = setInterval(() => {
      setRotationOffset(prev => {
        const nextRotationOffset = (prev + 1) % characterImages.length;
        setFrameBackgrounds(getFrameBackgrounds(nextRotationOffset));
        return nextRotationOffset;
      });
    }, 300);
    
    return () => clearInterval(animationInterval);
  }, [isAnimationEnabled, isMouseDown]); // Re-run effect when animation toggle or mouse state changes

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

  // Function removed - unused

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
    
    // Add a small delay to ensure socket is fully connected
    setTimeout(() => {
      console.log('Emitting create_room event with socket ID:', socket.id);
      socket.emit("create_room");
    }, 100);
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
    <div className="w-full h-screen grid grid-cols-6 grid-rows-10 relative">
      {/* Main content area - positioned absolutely to cover the inner cells but not overlap with borders */}
      <div className="absolute top-[10%] left-[16.67%] w-[66.66%] h-[80%] flex items-center justify-center z-10 pointer-events-auto">
        <div className="rounded-xl bg-[#1C1817] border-cream-100 w-full h-full flex flex-col justify-between">
          <div className="text-center">
            <div className="mb-6 bg-[#1C1817] rounded-4xl border-cream-100 w-[130%] -ml-[15%] relative z-10 border-12 border-[#1C1817]">
              <div className="border-5 border-[#E8DBBC] rounded-3xl">
                <div className="relative inline-block">
                  <Logo size="large" />
                  <div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg py-2 px-6 inline-block">
              <h2 className="text-4xl font-bold text-[#EAC006]" style={{ fontFamily: 'var(--font-jersey-10)' }}>• ICW Edition •</h2>
            </div>
          </div>
          <div className="flex flex-col gap-6 mb-15 items-center tracking-widest text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>
            <button
              onClick={handleCreateGame}
              disabled={isLoading || !connected}
              className="btn btn-lg border-[#0390A1] shadow-[5px_7px_#0390A1] bg-[#1C1817]"
            >
              {isLoading ? "Creating..." : "New Game"}
            </button>

            <button
              onClick={handleJoinGame}
              disabled={isLoading || !connected}
              className="btn btn-lg border-[#D34F34] shadow-[5px_7px_#D34F34] bg-[#1C1817]"
            >
              Join Game
            </button>
          </div>

          {error && (
            <div className="mt-2 rounded-md bg-red-900 border border-red-500 text-center text-xs text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>

      {FRAME_POSITIONS.map(({ index, isFrame, framePosition }) => {
        const bgColor = isFrame && framePosition !== -1
          ? frameBackgrounds[framePosition]
          : '#1f2937';

        return (
          <div
            key={`cell-${index}`}
            className="flex items-center justify-center pointer-events-none"
            style={{ backgroundColor: bgColor }}
          >
            <div className="w-full h-full flex" />
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-0 grid grid-cols-6 grid-rows-10">
        {characterImages.map((character, index) => {
          const sequencePosition = (index - rotationOffset + characterImages.length) % characterImages.length;
          const slot = sequencePosition < FRAME_SLOT_COUNT ? FRAME_SLOTS[sequencePosition] : null;

          return (
            <div
              key={character.id}
              className="flex items-center justify-center"
              style={{
                gridColumn: slot ? `${slot.column} / span 1` : '1 / span 1',
                gridRow: slot ? `${slot.row} / span 1` : '1 / span 1',
                opacity: slot ? 1 : 0,
                visibility: slot ? 'visible' : 'hidden',
              }}
            >
              <div
                className="rounded-full overflow-hidden w-16 h-16 flex p-2"
                style={{
                  filter: 'drop-shadow(3px 0 rgba(0, 0, 0, 0.7))',
                  position: 'relative',
                }}
              >
                <Image
                  src={character.src}
                  alt={character.alt}
                  width={64}
                  height={64}
                  className={`object-cover rounded-full ${teamBgClass[character.team]}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
