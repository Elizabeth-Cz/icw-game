import React from 'react';
import Image from 'next/image';
import { Character } from '../context/GameContext';

interface CharacterCardProps {
  character: Character;
  isEliminated: boolean;
  isSecret?: boolean;
  onClick?: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isEliminated,
  isSecret = false,
  onClick,
}) => {
  return (
    <div
      className={`flex flex-col items-center p-1 sm:p-2 transition-all ${
        isSecret
          ? 'bg-orange-500'
          : isEliminated
          ? 'bg-gray-800 opacity-70'
          : 'bg-blue-500 hover:bg-blue-600'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 overflow-hidden rounded-full bg-white">
        <Image
          unoptimized={true} 
          src={character.avatarUrl}
          alt={character.name}
          className={`object-cover ${isEliminated ? 'grayscale' : ''}`}
          fill
          sizes="(max-width: 480px) 48px, (max-width: 768px) 64px, 80px"
        />
      </div>
      <div className="mt-1 sm:mt-2 text-center w-full px-1 bg-gray-800 py-1 rounded-b-lg">
        <p className={`text-[10px] sm:text-xs md:text-sm font-bold truncate ${isEliminated ? 'text-gray-400' : 'text-white'}`}>
          {character.name}
        </p>
      </div>
    </div>
  );
};

export default CharacterCard;
