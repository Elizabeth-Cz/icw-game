"use client";

import React, { useState } from 'react';
import CharacterCard from '../../components/CharacterCard';
import { characterAssets } from '../../data/characterData';

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
          {characterAssets.map(character => (
            <div key={character.id} className="flex flex-col items-center">
              <CharacterCard 
                character={{ id: character.id, name: character.name, avatarUrl: '' }}
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
