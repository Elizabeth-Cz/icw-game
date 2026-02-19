// Character interface
export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
}

// Character creation helper function
export function createCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    avatarUrl: name
  };
}

export class CharacterService {
  private characters: Character[] = [];
  private gameCharacters: Record<string, Character[]> = {}; // Store characters for each game room
  
  // List of colleague names to use as characters - exact match with PNG filenames in assets folder
  private colleagues = [
    'Alex', 'Anna', 'Brian', 'David', 'Diogo', 'Dries',
    'Elouan', 'Frank', 'Giri', 'Hitesh', 'Ivan', 'Ivana',
    'Jeeshan', 'Jesse', 'Jos', 'Karl', 'Kevin',
    'Linh', 'Liz', 'Louise', 'Luc', 'Maria', 'Michiel',
    'Mike', 'Nick', 'Ralph', 'Sid', 'Tarek', 'Tissam', 'Tonny',
    'Wala'
  ];
  
  // Set total characters to match the number of colleagues
  private readonly TOTAL_CHARACTERS = this.colleagues.length;
  
  // Number of characters to display in each game
  private readonly GAME_CHARACTERS_COUNT = 20;

  // Initialize all possible characters
  initializeCharacters(): void {
    this.characters = [];
    
    // Create characters from colleague names using the constructor function
    for (let i = 0; i < this.TOTAL_CHARACTERS; i++) {
      const name = this.colleagues[i];
      this.characters.push(createCharacter(`char-${i + 1}`, name));
    }
    
    console.log(`Initialized ${this.characters.length} characters`);
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
    
    console.log(`Selected ${selectedCharacters.length} characters for room ${roomCode}`);
    return selectedCharacters;
  }
  
  // Get characters for a specific game room
  getGameCharacters(roomCode: string): Character[] {
    // If we don't have characters for this room yet, select them
    if (!this.gameCharacters[roomCode]) {
      return this.selectGameCharacters(roomCode);
    }
    return this.gameCharacters[roomCode];
  }
  
  // Clear game characters for a specific room
  clearGameCharacters(roomCode: string): void {
    delete this.gameCharacters[roomCode];
    console.log(`Cleared game characters for room ${roomCode}`);
  }
  
  // Get all characters
  getAllCharacters(): Character[] {
    // Make sure all characters are initialized
    if (this.characters.length === 0) {
      this.initializeCharacters();
    }
    return this.characters;
  }
  
  // Get a character by ID
  getCharacterById(characterId: string): Character | undefined {
    // Make sure all characters are initialized
    if (this.characters.length === 0) {
      this.initializeCharacters();
    }
    return this.characters.find(char => char.id === characterId);
  }
}
