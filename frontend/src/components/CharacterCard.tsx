import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Character } from '../context/GameContext';
// Import all character images dynamically
import AlexImage from '../assets/Alex.png';
import AnnaImage from '../assets/Anna.png';
import BrianImage from '../assets/Brian.png';
import DavidImage from '../assets/David.png';
import DiogoImage from '../assets/Diogo.png';
import DriesImage from '../assets/Dries.png';
import ElouanImage from '../assets/Elouan.png';
import FrankImage from '../assets/Frank.png';
import GiriImage from '../assets/Giri.png';
import HiteshImage from '../assets/Hitesh.png';
import IvanImage from '../assets/Ivan.png';
import IvanaImage from '../assets/Ivana.png';
import JeeshanImage from '../assets/Jeeshan.png';
import JesseImage from '../assets/Jesse.png';
import JosImage from '../assets/Jos.png';
import KarlImage from '../assets/Karl.png';
import KevinImage from '../assets/Kevin.png';
import LinhImage from '../assets/Linh.png';
import LizImage from '../assets/Liz.png';
import LouiseImage from '../assets/Louise.png';
import LucImage from '../assets/Luc.png';
import MariaImage from '../assets/Maria.png';
import MichielImage from '../assets/Michiel.png';
import MikeImage from '../assets/Mike.png';
import NickImage from '../assets/Nick.png';
import RalphImage from '../assets/Ralph.png';
import SidImage from '../assets/Sid.png';
import TarekImage from '../assets/Tarek.png';
import TissamImage from '../assets/Tissam.png';
import TonnyImage from '../assets/Tonny.png';
import WalaImage from '../assets/Wala.png';
import QuestionMarkImage from '../assets/question-mark.png';

interface CharacterCardProps {
  character: Character;
  isEliminated: boolean;
  isSecret?: boolean;
  onClick?: () => void;
}

// Map of character names to their PNG images
const characterImages: Record<string, any> = {
  'Alex': AlexImage,
  'Anna': AnnaImage,
  'Brian': BrianImage,
  'David': DavidImage,
  'Diogo': DiogoImage,
  'Dries': DriesImage,
  'Elouan': ElouanImage,
  'Frank': FrankImage,
  'Giri': GiriImage,
  'Hitesh': HiteshImage,
  'Ivan': IvanImage,
  'Ivana': IvanaImage,
  'Jeeshan': JeeshanImage,
  'Jesse': JesseImage,
  'Jos': JosImage,
  'Karl': KarlImage,
  'Kevin': KevinImage,
  'Linh': LinhImage,
  'Liz': LizImage,
  'Louise': LouiseImage,
  'Luc': LucImage,
  'Maria': MariaImage,
  'Michiel': MichielImage,
  'Mike': MikeImage,
  'Nick': NickImage,
  'Ralph': RalphImage,
  'Sid': SidImage,
  'Tarek': TarekImage,
  'Tissam': TissamImage,
  'Tonny': TonnyImage,
  'Wala': WalaImage
};

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
    return characterImages[character.name];
  };

  // Apply animation when elimination state changes
  useEffect(() => {
    // Only trigger animation when card is being eliminated (not when un-eliminated)
    if (isEliminated && !wasEliminated) {
      setShouldAnimate(true);

      // Reset animation after it completes so it can be triggered again if needed
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 400); // Match this with the animation duration in CSS

      return () => clearTimeout(timer);
    }
    setWasEliminated(isEliminated);
  }, [isEliminated, wasEliminated]);

  return (
    <div className={`border-3 border-[#D8C8AE] rounded-2xl bg-white`}>
      <div
        className={`flex flex-col items-center border-3 border-[#27528F] rounded-xl`}
        onClick={onClick}
      >
        <div className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 bg-white m-2">
          <Image
            unoptimized={true}
            src={isEliminated ? QuestionMarkImage : getImageSrc()}
            alt={character.name}
            className={`object-cover h-full w-full ${isEliminated? 'mt-3' : ''}`}
            fill
            sizes="(max-width: 480px) 48px, (max-width: 768px) 64px, 80px"
          />
        </div>
        <div className={`text-center w-full py-1 bg-[#27528F] ${isEliminated ? 'invisible' : ''}`}>
          <p className={`text-xs sm:text-xs md:text-sm font-bold truncate`}>
            {character.name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
