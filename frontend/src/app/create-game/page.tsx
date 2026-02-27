"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";
import { characterData } from "../../data/characterData";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import BackButton from "@/components/BackButton";
import { IoCopyOutline } from "react-icons/io5";

export default function CreateGame() {
  return (
    <Suspense fallback={null}>
      <CreateGameInner />
    </Suspense>
  );
}

function CreateGameInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("roomCode");
  const { socket } = useSocket();
  const { gameState, setPlayerName } = useGame();

  const [isJoinUrlCopied, setIsJoinUrlCopied] = useState(false);

  const joinUrl = roomCode
    ? `${window.location.origin}/join-game?roomCode=${encodeURIComponent(roomCode)}`
    : "";

  const handleCopyJoinUrl = async () => {
    if (!joinUrl) return;

    try {
      await navigator.clipboard.writeText(joinUrl);
      setIsJoinUrlCopied(true);
    } catch {
      // Ignore; clipboard may be unavailable in some contexts.
    }
  };

  const [name, setName] = useState("");
  const [isWaiting, setIsWaiting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isJoinUrlCopied) return;
    const timeoutId = window.setTimeout(() => {
      setIsJoinUrlCopied(false);
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isJoinUrlCopied]);

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
      console.log('Both players joined event received');
      setIsWaiting(false);
    };

    // Handle errors
    const handleError = ({ message }: { message: string }) => {
      console.error('Room error received:', message);
      setError(message);
    };

    // Register event listeners
    socket.on("both_players_joined", handleBothPlayersJoined);
    socket.on("room_error", handleError);

    // Store room code and player ID in localStorage when component mounts
    if (roomCode && gameState.playerId) {
      console.log('Storing room data in localStorage:', { roomCode, playerId: gameState.playerId });
      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("playerId", gameState.playerId);
    }

    // Clean up event listeners
    return () => {
      socket.off("both_players_joined", handleBothPlayersJoined);
      socket.off("room_error", handleError);
    };
  }, [socket, roomCode, gameState.playerId]);

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

    // Navigate to character assignment page
    router.push(`/character-assignment?roomCode=${roomCode}`);
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
    <div className="p-12 bg-[#1C1817] text-[#D8C8AE] h-screen text-center">
      <BackButton
        onClick={handleBack}

        iconClassName="mr-1 h-5 w-5"
      />
      <main className="h-full flex flex-col items-center p-8 gap-6">
        <div className="bg-gray-800 rounded-lg py-2 px-6 inline-block w-64">
          <h1 className="text-4xl font-bold text-[#EAC006]" style={{ fontFamily: 'var(--font-jersey-10)' }}>• New Game •</h1>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="text-lg text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>Share this code with your opponent</p>
          <div className="flex flex-row gap-4">
            {roomCode?.split('').map((char, index) => (
              <span key={index} className="rounded-xl p-4 border-2 border-[#0390A1] bg-[#1C1817] font-bold text-xl text-center"
                style={{ fontFamily: 'var(--font-jersey-10)', boxShadow: '5px 7px #0390A1' }}>{char}</span>
            ))}
          </div>

          {roomCode && (
            <div className="flex flex-col items-center gap-2 w-full max-w-md">
              <p className="text-lg text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>
                Or share this link
              </p>
              <div className="flex flex-col gap-3 items-center w-full">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={`\/join-game?roomCode=${encodeURIComponent(roomCode)}`}
                    readOnly
                    className="rounded-xl w-full border-2 border-[#0390A1] bg-[#1C1817] px-4 pr-12 py-3 font-bold text-sm text-[#D8C8AE]"
                    style={{ boxShadow: '5px 7px #0390A1', fontFamily: 'var(--font-jersey-25)' }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyJoinUrl}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D8C8AE]"
                    aria-label="Copy join link"
                  >
                    <IoCopyOutline />
                  </button>
                </div>
                <p
                  className={`text-sm text-[#7BBB63] min-h-[1.25rem] ${isJoinUrlCopied ? "opacity-100" : "opacity-0"
                    }`}
                  style={{ fontFamily: 'var(--font-jersey-25)' }}
                  aria-live="polite"
                >
                  Copied!
                </p>
              </div>
            </div>
          )}

          {isWaiting ? (
            <p className="text-lg text-[#D8C8AE]" style={{ fontFamily: 'var(--font-jersey-25)' }}>Waiting for opponent to join...</p>
          ) : (
            <p className="text-lg text-[#7BBB63]" style={{ fontFamily: 'var(--font-jersey-25)' }}>Opponent joined! Enter your name to continue.</p>
          )}
        </div>

        <form onSubmit={handleSubmitName} className="flex flex-col h-full justify-evenly gap-10" style={{ fontFamily: 'var(--font-jersey-25)' }}>
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
                        `px-6 py-3 cursor-pointer text-[#D8C8AE] ${active ? 'bg-[#0390A1] text-[#1C1817]' : ''
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
            disabled={!name.trim()}
            className="rounded-xl w-48 border-2 border-[#D34F34] bg-[#1C1817] h-20 font-bold text-xl"
            style={{ boxShadow: '5px 7px #D34F34' }}
          >
            Continue
          </button>

          {error && (
            <div className="text-[#D34F34] text-lg">
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
