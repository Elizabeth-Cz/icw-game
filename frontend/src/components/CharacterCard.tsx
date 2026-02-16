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
      className={`flex flex-col items-center rounded-lg border-2 p-1 sm:p-2 transition-all ${
        isSecret
          ? 'border-yellow-400 bg-yellow-50'
          : isEliminated
          ? 'border-gray-200 bg-gray-100 opacity-50'
          : 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-md'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="relative h-10 w-10 sm:h-16 sm:w-16 md:h-20 md:w-20 overflow-hidden rounded-full">
        <Image
          unoptimized={true} 
          src={character.avatarUrl}
          alt={character.name}
          className={`object-cover ${isEliminated ? 'grayscale' : ''}`}
          fill
          sizes="(max-width: 480px) 40px, (max-width: 768px) 64px, 80px"
        />
      </div>
      <div className="mt-1 sm:mt-2 text-center w-full px-1">
        <p className={`text-[10px] sm:text-xs md:text-sm truncate ${isEliminated ? 'text-gray-500' : 'text-gray-800'}`}>
          {character.name}
        </p>
      </div>
    </div>
  );
};

export default CharacterCard;
