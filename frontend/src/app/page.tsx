"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSocket } from "../context/SocketContext";
import { useGame } from "../context/GameContext";

// Import all character images dynamically
import AlexImage from "../assets/Alex.png";
import AnnaImage from "../assets/Anna.png";
import BrianImage from "../assets/Brian.png";
import DavidImage from "../assets/David.png";
import DiogoImage from "../assets/Diogo.png";
import DriesImage from "../assets/Dries.png";
import ElouanImage from "../assets/Elouan.png";
import FrankImage from "../assets/Frank.png";
import GiriImage from "../assets/Giri.png";
import HiteshImage from "../assets/Hitesh.png";
import IvanImage from "../assets/Ivan.png";
import IvanaImage from "../assets/Ivana.png";
import JeeshanImage from "../assets/Jeeshan.png";
import JesseImage from "../assets/Jesse.png";
import JosImage from "../assets/Jos.png";
import KarlImage from "../assets/Karl.png";
import KevinImage from "../assets/Kevin.png";
import LinhImage from "../assets/Linh.png";
import LizImage from "../assets/Liz.png";
import LouiseImage from "../assets/Louise.png";
import LucImage from "../assets/Luc.png";
import MariaImage from "../assets/Maria.png";
import MichielImage from "../assets/Michiel.png";
import MikeImage from "../assets/Mike.png";
import NickImage from "../assets/Nick.png";
import RalphImage from "../assets/Ralph.png";
import SidImage from "../assets/Sid.png";
import TarekImage from "../assets/Tarek.png";
import TissamImage from "../assets/Tissam.png";
import TonnyImage from "../assets/Tonny.png";
import WalaImage from "../assets/Wala.png";
import QuestionMarkImage from "../assets/question-mark.png";

// Create an array of all character images for easier looping
const characterImages = [
  { src: AlexImage, alt: "Alex" },
  { src: AnnaImage, alt: "Anna" },
  { src: BrianImage, alt: "Brian" },
  { src: DavidImage, alt: "David" },
  { src: DiogoImage, alt: "Diogo" },
  { src: DriesImage, alt: "Dries" },
  { src: ElouanImage, alt: "Elouan" },
  { src: FrankImage, alt: "Frank" },
  { src: GiriImage, alt: "Giri" },
  { src: HiteshImage, alt: "Hitesh" },
  { src: IvanImage, alt: "Ivan" },
  { src: IvanaImage, alt: "Ivana" },
  { src: JeeshanImage, alt: "Jeeshan" },
  { src: JesseImage, alt: "Jesse" },
  { src: JosImage, alt: "Jos" },
  { src: KarlImage, alt: "Karl" },
  { src: KevinImage, alt: "Kevin" },
  { src: LinhImage, alt: "Linh" },
  { src: LizImage, alt: "Liz" },
  { src: LouiseImage, alt: "Louise" },
  { src: LucImage, alt: "Luc" },
  { src: MariaImage, alt: "Maria" },
  { src: MichielImage, alt: "Michiel" },
  { src: MikeImage, alt: "Mike" },
  { src: NickImage, alt: "Nick" },
  { src: RalphImage, alt: "Ralph" },
  { src: SidImage, alt: "Sid" },
  { src: TarekImage, alt: "Tarek" },
  { src: TissamImage, alt: "Tissam" },
  { src: TonnyImage, alt: "Tonny" },
  { src: WalaImage, alt: "Wala" },
];

// Define background colors for the border
const bgColors = [
  "bg-emerald-600",
  "bg-yellow-500",
  "bg-red-500",
  "bg-pink-400",
  "bg-blue-600",
  "bg-teal-500",
];

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
    <div className="w-full h-screen grid grid-cols-6 grid-rows-10 relative">
      {/* Main content area - positioned absolutely to cover the inner cells but not overlap with borders */}
      <div className="absolute top-[10%] left-[16.67%] w-[66.66%] h-[80%] flex items-center justify-center">
        <div className="rounded-xl bg-black border-cream-100 w-full h-full flex flex-col justify-between">
          <div className="text-center">
            <div className="mb-6 bg-black rounded-4xl border-cream-100 w-[130%] -ml-[15%] relative z-10 border-12 border-black">
              <div className="border-5 border-[#E8DBBC] rounded-3xl">
                <div className="relative inline-block">
                  <h1 className="font-bold text-[#E25B45] mr-6" style={{
                    fontFamily: 'var(--font-irish-grover)',
                    textShadow: '-2px -2px 0 #E8DBBC, 2px -2px 0 #E8DBBC, -2px 2px 0 #E8DBBC, 2px 2px 0 #E8DBBC, 3px 3px 0px rgba(0,0,0,0.2)',
                    display: 'inline-block',
                    position: 'relative',
                    fontSize: '4rem',
                    textAlign: 'left',
                  }}>
                    <span style={{ position: 'relative', right: '2rem', bottom: '-1rem' }}>Guess</span>
                    <br />
                    <span style={{ position: 'relative', right: '2rem', top: '-1rem' }}>Who</span>
                  </h1>
                  <Image
                    src={QuestionMarkImage}
                    alt="Question Mark"
                    width={160}
                    height={160}
                    style={{
                      position: 'absolute',
                      right: '-3rem',
                      top: '50%',
                      transform: 'translateY(-50%) rotate(5deg)',
                      filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                      overflow: 'hidden',
                      zIndex: -2
                    }}
                  />
                  <div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg py-2 px-6 mt-10 inline-block">
              <h2 className="text-4xl font-bold text-[#EAC006]" style={{ fontFamily: 'var(--font-jersey-10)' }}>• ICW Edition •</h2>
            </div>
          </div>
          <div className="flex flex-col gap-6 mb-15 items-center tracking-widest text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>
            <button
              onClick={handleCreateGame}
              disabled={isLoading || !connected}
              className="rounded-xl w-48 border-2 border-[#0390A1] bg-black h-20 font-bold text-xl transition hover:cursor-pointer"
              style={{ boxShadow: '5px 7px #0390A1' }}
            >
              {isLoading ? "Creating..." : "New Game"}
            </button>

            <button
              onClick={handleJoinGame}
              disabled={isLoading || !connected}
              className="rounded-xl w-48 border-2 border-[#D34F34] bg-black h-20 font-bold text-xl transition hover:cursor-pointer"
              style={{ boxShadow: '5px 7px #D34F34' }}
            >
              Join Game
            </button>
          </div>

          {error && (
            <div className="mt-2 rounded-md bg-red-900 border border-red-500 text-center text-xs text-red-300">
              {error}
            </div>
          )}

          {!connected && (
            <div className="mt-2 rounded-md bg-yellow-900 border border-yellow-500 text-center text-xs text-yellow-300">
              Connecting...
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

        // Get character image index based on position
        const characterIndex = index % characterImages.length;

        // Determine background color for frame cells
        // For left column, alternate between first two colors
        // For right column, alternate between last two colors
        let bgColorIndex;
        if (col === 0 && row >= 1) { // Left column
          bgColorIndex = row % 2 === 0 ? 0 : 1;
        } else if (col === 5 && row >= 1) { // Right column
          bgColorIndex = row % 2 === 0 ? 4 : 5;
        } else if (cellNumber <= 6) { // Top row
          bgColorIndex = col;
        } else if (cellNumber >= 55) { // Bottom row
          bgColorIndex = col;
        } else {
          bgColorIndex = index % bgColors.length;
        }

        return (
          <div
            key={`cell-${index}`}
            className={`${isFrame ? bgColors[bgColorIndex] : 'bg-gray-900'} flex items-center justify-center `}
          >
            {isFrame ? (
              <div className="rounded-full overflow-hidden w-16 h-16 flex p-1">
                <Image
                  src={characterImages[characterIndex].src}
                  alt={characterImages[characterIndex].alt}
                  width={64}
                  height={64}
                  className="object-cover"
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