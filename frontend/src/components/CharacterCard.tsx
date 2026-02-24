import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Character } from '../context/GameContext';
import { characterData, teamBgClass, TeamType } from '../data/characterData';
import QuestionMarkImage from '../assets/question-mark.png';
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
  // Track previous elimination state to apply animation only when it changes
  const [wasEliminated, setWasEliminated] = useState(isEliminated);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Get image source from our imported images map
  const getImageSrc = () => {
    return characterData[character.name]?.image;
  };

  // Get team for the character
  const getCharacterTeam = (): TeamType => {
    return characterData[character.name]?.team || 'product';
  };
  
  // Get background color class based on team
  const getTeamBgClass = () => {
    return teamBgClass[getCharacterTeam()];
  };

  return (
    <div className={`border-3 xs:border-3 border-[#D8C8AE] rounded-xl xs:rounded-2xl bg-[#27528F] w-full max-w-[180px] ${shouldAnimate ? 'flip-horizontal-bottom' : ''}`}>
      <div
        className={`h-full border-3 xs:border-3 border-[#27528F] rounded-lg xs:rounded-xl overflow-hidden`}
        onClick={onClick}
      >
        <div className={`relative w-full aspect-square`}>
          {isEliminated ? (
            <Logo size="small" />
          ) : (
            <Image
              unoptimized={true}
              src={getImageSrc()}
              alt={character.name}
              className={`object-cover h-full w-full ${getTeamBgClass()}`}
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
