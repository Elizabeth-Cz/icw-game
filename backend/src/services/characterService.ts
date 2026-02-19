// Character interface
export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
}

// Character constructor function
export function createCharacter(id: string, name: string, avatarStyle: string = 'toon-head'): Character {
  const seed = encodeURIComponent(name);
  
  // We'll handle the PNG image replacement entirely on the frontend
  // This ensures we don't have path resolution issues between backend and frontend
  return {
    id,
    name,
    avatarUrl: `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${seed}`
  };
}

export class CharacterService {
  private characters: Character[] = [];
  private gameCharacters: Record<string, Character[]> = {}; // Store characters for each game room
  
  // List of colleague names to use as characters
  private colleagues = [
    'Alex', 'Anna', 'Brian', 'David', 'Diogo', 'Dries',
    'Elouan', 'Frank', 'Giri', 'Hitesh', 'Ivan', 'Ivana',
    'Jeeshan', 'Jesse', 'Jos', 'Karl', 'Kenny', 'Kevin',
    'Linh', 'Liz', 'Louise', 'Luc', 'Maria', 'Michiel',
    'Nick', 'Ralph', 'Sid', 'Tarek', 'Tissam', 'Tonny',
    'Wala'
  ];
  
  // Set total characters to match the number of colleagues
  private readonly TOTAL_CHARACTERS = this.colleagues.length;
  
  // Number of characters to display in each game
  private readonly GAME_CHARACTERS_COUNT = 20;

  // Avatar style for DiceBear API
  private avatarStyle = 'toon-head';

  // Initialize all possible characters
  initializeCharacters(): void {
    this.characters = [];
    
    // Create characters from colleague names using the constructor function
    for (let i = 0; i < this.TOTAL_CHARACTERS; i++) {
      const name = this.colleagues[i];
      this.characters.push(createCharacter(`char-${i + 1}`, name, this.avatarStyle));
    }
  }
  
  // Select 20 random characters for a specific game room
  selectGameCharacters(roomCode: string): Character[] {
    // If we've already selected characters for this room, return them
    if (this.gameCharacters[roomCode]) {
      return this.gameCharacters[roomCode];
    }
    
    // Make sure all characters are initialized
    if (this.characters.length === 0) {
      this.initializeCharacters();
    }
    
    // Randomly select 20 characters from the full set
    const shuffled = [...this.characters].sort(() => 0.5 - Math.random());
    const selectedCharacters = shuffled.slice(0, this.GAME_CHARACTERS_COUNT);
    
    // Store the selected characters for this room
    this.gameCharacters[roomCode] = selectedCharacters;
    
    return selectedCharacters;
  }
  
  // Get characters for a specific game room
  getGameCharacters(roomCode: string): Character[] {
    // If we haven't selected characters for this room yet, do it now
    if (!this.gameCharacters[roomCode]) {
      return this.selectGameCharacters(roomCode);
    }
    
    return this.gameCharacters[roomCode];
  }
  
  // Clear characters for a specific game room (e.g., when the room is deleted)
  clearGameCharacters(roomCode: string): void {
    delete this.gameCharacters[roomCode];
  }

  // Get all characters
  getAllCharacters(): Character[] {
    return [...this.characters];
  }

  // Get a character by ID
  getCharacterById(id: string): Character | undefined {
    return this.characters.find(char => char.id === id);
  }

  // Get random characters
  getRandomCharacters(count: number): Character[] {
    if (count > this.characters.length) {
      throw new Error(`Cannot get ${count} characters, only ${this.characters.length} available`);
    }

    // Shuffle array and take first 'count' elements
    const shuffled = [...this.characters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Helper to get a random item from an array
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
