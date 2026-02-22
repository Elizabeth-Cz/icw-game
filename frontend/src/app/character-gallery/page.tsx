"use client";

import React, { useState } from 'react';
import CharacterCard from '../../components/CharacterCard';
import { Character } from '../../context/GameContext';

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

// Create an array of all characters
const allCharacters: Character[] = [
  { id: '1', name: 'Alex', avatarUrl: '' },
  { id: '2', name: 'Anna', avatarUrl: '' },
  { id: '3', name: 'Brian', avatarUrl: '' },
  { id: '4', name: 'David', avatarUrl: '' },
  { id: '5', name: 'Diogo', avatarUrl: '' },
  { id: '6', name: 'Dries', avatarUrl: '' },
  { id: '7', name: 'Elouan', avatarUrl: '' },
  { id: '8', name: 'Frank', avatarUrl: '' },
  { id: '9', name: 'Giri', avatarUrl: '' },
  { id: '10', name: 'Hitesh', avatarUrl: '' },
  { id: '11', name: 'Ivan', avatarUrl: '' },
  { id: '12', name: 'Ivana', avatarUrl: '' },
  { id: '13', name: 'Jeeshan', avatarUrl: '' },
  { id: '14', name: 'Jesse', avatarUrl: '' },
  { id: '15', name: 'Jos', avatarUrl: '' },
  { id: '16', name: 'Karl', avatarUrl: '' },
  { id: '17', name: 'Kevin', avatarUrl: '' },
  { id: '18', name: 'Linh', avatarUrl: '' },
  { id: '19', name: 'Liz', avatarUrl: '' },
  { id: '20', name: 'Louise', avatarUrl: '' },
  { id: '21', name: 'Luc', avatarUrl: '' },
  { id: '22', name: 'Maria', avatarUrl: '' },
  { id: '23', name: 'Michiel', avatarUrl: '' },
  { id: '24', name: 'Mike', avatarUrl: '' },
  { id: '25', name: 'Nick', avatarUrl: '' },
  { id: '26', name: 'Ralph', avatarUrl: '' },
  { id: '27', name: 'Sid', avatarUrl: '' },
  { id: '28', name: 'Tarek', avatarUrl: '' },
  { id: '29', name: 'Tissam', avatarUrl: '' },
  { id: '30', name: 'Tonny', avatarUrl: '' },
  { id: '31', name: 'Wala', avatarUrl: '' },
];

export default function CharacterGallery() {
  const [showEliminated, setShowEliminated] = useState(false);
  const [toggleIndividual, setToggleIndividual] = useState<Record<string, boolean>>({});

  // Toggle all characters between eliminated and non-eliminated
  const toggleAll = () => {
    setShowEliminated(!showEliminated);
    // Reset individual toggles when changing all
    setToggleIndividual({});
  };

  // Toggle individual character's eliminated state
  const toggleCharacter = (id: string) => {
    setToggleIndividual(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Determine if a character is eliminated based on global and individual toggles
  const isCharacterEliminated = (id: string) => {
    // If this character has an individual toggle, use that
    if (id in toggleIndividual) {
      return toggleIndividual[id];
    }
    // Otherwise use the global toggle
    return showEliminated;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-2 xs:gap-3 sm:grid-cols-4 md:grid-cols-5">
          {allCharacters.map(character => (
            <div key={character.id} className="flex flex-col items-center">
              <CharacterCard 
                character={character} 
                isEliminated={isCharacterEliminated(character.id)} 
                onClick={() => toggleCharacter(character.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
