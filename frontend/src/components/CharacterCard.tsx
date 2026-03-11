import React from 'react';
import Image from 'next/image';
import { Character } from '../context/GameContext';
import { characterData, teamBgClass } from '../data/characterData';
import Logo from './Logo';

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
  const shouldAnimate = false;
  const characterMeta = characterData[character.name];
  const imageSrc = characterMeta?.image;
  const teamClass = teamBgClass[characterMeta?.team || 'product'];

  if (!imageSrc && !isEliminated) {
    return null;
  }

  return (
    <div className={`rounded-xl xs:rounded-2xl bg-[#D8C8AE] p-[3px] w-full max-w-[180px] ${shouldAnimate ? 'flip-horizontal-bottom' : ''}`}>
      <div
        className={`h-full rounded-lg xs:rounded-xl overflow-hidden border-4 border-[var(--dark-blue)] ${isEliminated ? 'bg-[#27528F]' : ''}`}
        onClick={onClick}
      >
        <div className={`relative w-full aspect-square`}>
          {isEliminated ? (
            <Logo size="small" />
          ) : (
            <Image
              unoptimized={true}
              src={imageSrc}
              alt={character.name}
              className={`object-cover h-full w-full ${teamClass}`}
              fill
              sizes="(max-width: 480px) 100px, (max-width: 768px) 140px, 180px"
            />
          )}
        </div>
        <div className={`text-center w-full bg-[#27528F] py-1 xs:py-1.5 md:py-2 ${isEliminated ? 'invisible' : ''}`}>
          <p className="text-xs xs:text-sm md:text-base truncate px-1" style={{ fontFamily: 'var(--font-jersey-25)', color: 'white' }}>
            {character.name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
