"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame, Character } from "../../context/GameContext";
import Image from "next/image";

// Import all character images dynamically
import AlexImage from "../../assets/Alex.png";
import AnnaImage from "../../assets/Anna.png";
import BrianImage from "../../assets/Brian.png";
import DavidImage from "../../assets/David.png";
import DiogoImage from "../../assets/Diogo.png";
import DriesImage from "../../assets/Dries.png";
import ElouanImage from "../../assets/Elouan.png";
import FrankImage from "../../assets/Frank.png";
import GiriImage from "../../assets/Giri.png";
import HiteshImage from "../../assets/Hitesh.png";
import IvanImage from "../../assets/Ivan.png";
import IvanaImage from "../../assets/Ivana.png";
import JeeshanImage from "../../assets/Jeeshan.png";
import JesseImage from "../../assets/Jesse.png";
import JosImage from "../../assets/Jos.png";
import KarlImage from "../../assets/Karl.png";
import KevinImage from "../../assets/Kevin.png";
import LinhImage from "../../assets/Linh.png";
import LizImage from "../../assets/Liz.png";
import LouiseImage from "../../assets/Louise.png";
import LucImage from "../../assets/Luc.png";
import MariaImage from "../../assets/Maria.png";
import MichielImage from "../../assets/Michiel.png";
import MikeImage from "../../assets/Mike.png";
import NickImage from "../../assets/Nick.png";
import RalphImage from "../../assets/Ralph.png";
import SidImage from "../../assets/Sid.png";
import TarekImage from "../../assets/Tarek.png";
import TissamImage from "../../assets/Tissam.png";
import TonnyImage from "../../assets/Tonny.png";
import WalaImage from "../../assets/Wala.png";
import CharacterCard from "@/components/CharacterCard";

// Create a map of character names to their images
const characterImages: Record<string, any> = {
  "Alex": AlexImage,
  "Anna": AnnaImage,
  "Brian": BrianImage,
  "David": DavidImage,
  "Diogo": DiogoImage,
  "Dries": DriesImage,
  "Elouan": ElouanImage,
  "Frank": FrankImage,
  "Giri": GiriImage,
  "Hitesh": HiteshImage,
  "Ivan": IvanImage,
  "Ivana": IvanaImage,
  "Jeeshan": JeeshanImage,
  "Jesse": JesseImage,
  "Jos": JosImage,
  "Karl": KarlImage,
  "Kevin": KevinImage,
  "Linh": LinhImage,
  "Liz": LizImage,
  "Louise": LouiseImage,
  "Luc": LucImage,
  "Maria": MariaImage,
  "Michiel": MichielImage,
  "Mike": MikeImage,
  "Nick": NickImage,
  "Ralph": RalphImage,
  "Sid": SidImage,
  "Tarek": TarekImage,
  "Tissam": TissamImage,
  "Tonny": TonnyImage,
  "Wala": WalaImage,
};

export default function CharacterAssignment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("roomCode");
  const { socket } = useSocket();
  const { gameState, setSecretCharacter } = useGame();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
    const handleSecretCharacterAssigned = ({ character }: { character: Character }) => {
      console.log('Secret character received in assignment page:', character);
      setSecretCharacter(character);
      setIsLoading(false);
    };

    // Handle errors
    const handleError = ({ message }: { message: string }) => {
      console.error('Error in character assignment:', message);
      setError(message);
    };

    // Register event listeners
    socket.on("secret_character_assigned", handleSecretCharacterAssigned);
    socket.on("room_error", handleError);

    // Request secret character if we don't have it
    if (!gameState.secretCharacter && roomCode && gameState.playerId) {
      console.log('Requesting secret character from assignment page:', { roomCode, playerId: gameState.playerId });
      socket.emit("request_secret_character", {
        roomCode,
        playerId: gameState.playerId,
      });
    } else if (gameState.secretCharacter) {
      // If we already have the secret character, no need to load
      setIsLoading(false);
    }

    // Clean up event listeners
    return () => {
      socket.off("secret_character_assigned", handleSecretCharacterAssigned);
      socket.off("room_error", handleError);
    };
  }, [socket, roomCode, gameState.playerId, gameState.secretCharacter, setSecretCharacter]);

  // Retry mechanism for loading character
  useEffect(() => {
    if (!socket || !roomCode || !gameState.playerId || !isLoading) return;

    const retryTimer = setTimeout(() => {
      if (isLoading && retryCount < 5 && !gameState.secretCharacter) {
        console.log(`Retry attempt ${retryCount + 1} for loading character`);
        setRetryCount(retryCount + 1);

        socket.emit("request_secret_character", {
          roomCode,
          playerId: gameState.playerId,
        });
      }
    }, 2000); // Retry every 2 seconds

    return () => clearTimeout(retryTimer);
  }, [socket, roomCode, gameState.playerId, gameState.secretCharacter, isLoading, retryCount]);

  // Handle continue button click
  const handleContinue = () => {
    router.push(`/game?roomCode=${roomCode}`);
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
      <main className="h-full flex flex-col items-center p-8 justify-between">
        <div className="bg-gray-800 rounded-lg py-2 px-6 inline-block w-64">
          <h1 className="text-4xl font-bold text-[#EAC006]" style={{ fontFamily: 'var(--font-jersey-10)' }}>• Your Character •</h1>
        </div>

        <div className="flex flex-col items-center gap-6"> 
          <p className="text-lg text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>
            This is your secret character. Your opponent will try to guess who it is!
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0390A1]"></div>
              <p className="text-[#D8C8AE]">Waiting for your opponent to join...</p>
            </div>
          ) : gameState.secretCharacter ? (
            <div className="w-72 flex justify-center items-center">
              {gameState.secretCharacter.name && characterImages[gameState.secretCharacter.name] && (
                <CharacterCard character={gameState.secretCharacter} isEliminated={false} />
              )}
            </div>
          ) : (
            <div className="text-red-500">
              Failed to load character. Please try again.
            </div>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={isLoading || !gameState.secretCharacter}
          className="rounded-xl w-48 border-2 border-[#D34F34] bg-[#1C1817] h-20 font-bold text-xl mt-6"
          style={{ boxShadow: '5px 7px #D34F34', fontFamily: 'var(--font-jersey-25)' }}
        >
          {isLoading ? "Loading..." : "Continue to Game"}
        </button>

        {error && (
          <div className="text-[#D34F34] text-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
