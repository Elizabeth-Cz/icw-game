import React from 'react';

interface PlayAgainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRematch: () => void;
  onNewGame: () => void;
  onJoinGame: () => void;
}

const PlayAgainModal: React.FC<PlayAgainModalProps> = ({
  isOpen,
  onClose,
  onRematch,
  onNewGame,
  onJoinGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 w-full max-w-md">
        <div className="bg-gray-800 rounded-lg py-2 px-4 inline-block mb-6 mx-auto">
          <h2 className="text-xl font-bold text-yellow-400 text-center">
            • Play Again •
          </h2>
        </div>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={onRematch}
            className="w-full py-3 border-2 border-blue-500 bg-black text-blue-500 font-bold rounded-lg hover:bg-blue-900 transition"
          >
            Rematch
            <p className="text-xs font-normal mt-1 text-blue-400">
              Same room, new characters
            </p>
          </button>
          
          <button
            onClick={onNewGame}
            className="w-full py-3 border-2 border-teal-400 bg-black text-teal-400 font-bold rounded-lg hover:bg-teal-900 transition"
          >
            New Game
            <p className="text-xs font-normal mt-1 text-teal-300">
              Create a new game with a new room code
            </p>
          </button>
          
          <button
            onClick={onJoinGame}
            className="w-full py-3 border-2 border-red-500 bg-black text-red-500 font-bold rounded-lg hover:bg-red-900 transition"
          >
            Join Game
            <p className="text-xs font-normal mt-1 text-red-300">
              Join an existing game with a room code
            </p>
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 border border-gray-600 text-gray-400 font-medium rounded-lg hover:bg-gray-800 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PlayAgainModal;
