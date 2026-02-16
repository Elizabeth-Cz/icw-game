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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-blue-800 mb-4 text-center">
          Play Again
        </h2>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onRematch}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Rematch
            <p className="text-xs font-normal mt-1 text-blue-100">
              Same room, new characters
            </p>
          </button>
          
          <button
            onClick={onNewGame}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
          >
            New Game
            <p className="text-xs font-normal mt-1 text-green-100">
              Create a new game with a new room code
            </p>
          </button>
          
          <button
            onClick={onJoinGame}
            className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
          >
            Join Game
            <p className="text-xs font-normal mt-1 text-purple-100">
              Join an existing game with a room code
            </p>
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PlayAgainModal;
