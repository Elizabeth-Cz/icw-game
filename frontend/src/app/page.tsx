"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSocket } from "../context/SocketContext";
import { useGame } from "../context/GameContext";
import { getCharacterImagesArray, teamBgClass, teamComplementaryColors } from "../data/characterData";
import { clearStoredGameSession, getStoredGameSession } from "@/lib/gameSessionStorage";
import Logo from '@/components/Logo';

// Get character images array from shared data
const characterImages = getCharacterImagesArray();

// Main menu component
export default function Home() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { setRoomCode, setPlayerId, setReconnectToken } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotationOffset, setRotationOffset] = useState(0); // Track the current rotation position
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true); // Toggle for animation
  const [isMouseDown, setIsMouseDown] = useState(false); // Track if mouse is being held down

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
    setError(null);

    // Always clear any invalid reconnect tokens on page load
    const clearInvalidTokenTimeout = setTimeout(() => {
      if (error && error.includes("Invalid reconnect token")) {
        // If we got an invalid token error, clear all stored tokens
        clearStoredGameSession();
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
    const { reconnectToken, roomCode, playerId } = getStoredGameSession();

    // Only attempt reconnection if we have ALL required pieces of information
    if (reconnectToken && roomCode && playerId && socket && connected) {
      console.log('Attempting reconnection with stored token');
      setIsLoading(true);
      socket.emit("request_reconnect", { reconnectToken });
    } else if (reconnectToken && (!roomCode || !playerId)) {
      // If we have a token but missing other required data, clear everything
      console.log('Found incomplete game data, clearing storage');
      clearStoredGameSession();
    }

    return () => clearTimeout(clearInvalidTokenTimeout);
  }, [socket, connected, error]);

  // Animation effect for rotating frame elements with their background colors
  useEffect(() => {
    // Only set up the interval if animation is enabled AND mouse is not being held down
    if (!isAnimationEnabled || isMouseDown) return;
    
    const animationInterval = setInterval(() => {
      // Shift characters one position to the right
      setRotationOffset(prev => (prev + 1) % characterImages.length);
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
        clearStoredGameSession();
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
    clearStoredGameSession();

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
    clearStoredGameSession();

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

      {/* Generate all 60 grid cells */}
      {Array.from({ length: 60 }).map((_, index) => {
        // Calculate the row and column for this index
        const row = Math.floor(index / 6);
        const col = index % 6;
        const cellNumber = index + 1;

        // Check if this cell is part of the frame
        const isFrame =
          // Top row (1-6)
          cellNumber <= 6 ||
          // Bottom row (55-60)
          cellNumber >= 55 ||
          // Left column (7,13,19,25,31,37,43,49)
          (col === 0 && row >= 1) ||
          // Right column (12,18,24,30,36,42,48,54)
          (col === 5 && row >= 1);

        // Calculate position in the frame sequence for both character rotation and color mapping
        let framePosition = -1;
        
        // Top row (left to right) - positions 0-5
        if (cellNumber <= 6) {
          framePosition = cellNumber - 1;
        }
        // Right column (top to bottom, excluding corners) - positions 6-13
        else if (col === 5 && row >= 1 && row <= 8) {
          framePosition = 6 + (row - 1);
        }
        // Bottom row (right to left) - positions 14-19
        else if (cellNumber >= 55) {
          framePosition = 14 + (5 - col);
        }
        // Left column (bottom to top, excluding corners) - positions 20-23
        else if (col === 0 && row >= 1 && row <= 8) {
          framePosition = 20 + (8 - row);
        }
        
        // Apply rotation offset to the frame position if this is a frame cell
        const characterIndex = isFrame && framePosition !== -1
          ? (framePosition + rotationOffset) % characterImages.length
          : index % characterImages.length;
        
        // Determine background color for frame cells
        let bgColor = '#1f2937'; // Default dark gray for non-frame cells
        
        if (isFrame) {
          // Get the character's team for this frame position
          const character = characterImages[characterIndex];
          const team = character.team;
          const complementaryColors = teamComplementaryColors[team];
          
          // Use a fixed color from the complementary family based on frame position
          const colorIndex = framePosition % complementaryColors.length;
          bgColor = complementaryColors[colorIndex];
        }

        return (
          <div
            key={`cell-${index}`}
            className="flex items-center justify-center pointer-events-none"
            style={{ backgroundColor: bgColor }}
          >
            {isFrame ? (
              <div className="rounded-full overflow-hidden w-16 h-16 flex p-2" 
                   style={{ 
                     filter: 'drop-shadow(3px 0 rgba(0, 0, 0, 0.7))',
                     position: 'relative'
                   }}>
                <Image
                  src={characterImages[characterIndex].src}
                  alt={characterImages[characterIndex].alt}
                  width={64}
                  height={64}
                  className={`object-cover rounded-full ${teamBgClass[characterImages[characterIndex].team]}`} // match the background color based on team color
                />
              </div>
            ) : (
              <div className="w-full h-full flex">
                {/* Non-frame cells are empty - main content is handled by the absolute positioned div */}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}